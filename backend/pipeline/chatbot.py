import json
from sqlalchemy import text

def get_financial_context(engine, start_date=None, end_date=None):
    """
        Queries the database and builds a financial context dictionary
        to send to Claude as RAG context.
        """

    if start_date and end_date:
        date_filter = "WHERE date BETWEEN :start AND :end"
        spending_filter = "AND date BETWEEN :start AND :end"
        params ={"start": start_date, "end": end_date}
        period = f"{start_date} to {end_date}"
    else:
        date_filter = ""
        spending_filter = ""
        params = {}
        period = "All Time"

    with engine.connect() as connection:

        # 1st Query
        totals = connection.execute(text(f"""
        SELECT 
        ROUND(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END)::numeric, 2) AS total_income,
        ROUND(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END):: numeric, 2) AS total_spending,
        ROUND(SUM(amount)::numeric, 2) AS net_savings 
        FROM transactions
        {date_filter}
        """
        ), params).fetchone()

        # 2nd Query: amount spent by category
        categories = connection.execute(text(f"""
        SELECT category,
        ROUND(SUM(ABS(amount))::numeric, 2) AS total
        FROM transactions
        WHERE amount < 0
        {date_filter}
        GROUP BY category
        ORDER BY total DESC
         
        """), params).fetchall()

        # 3rd Query: monthly breakdowns
        monthly = connection.execute(text(f"""
        SELECT 
            TO_CHAR(date, 'YYYY-MM') AS month,
            ROUND(SUM(ABS(amount)):: numeric, 2) AS spending 
        FROM transactions
        WHERE amount < 0
        {spending_filter}
        GROUP BY TO_CHAR(date, 'YYYY-MM')
        ORDER BY month
        """), params).fetchall()

        # 4th Query: top 5 biggest transactions
        top5_transactions = connection.execute(text(f"""
        SELECT 
            date, description, ABS(amount) AS amount, category
        FROM transactions
        WHERE amount < 0 
        {spending_filter}
        ORDER BY amount DESC 
        LIMIT 5
        """), params).fetchall()

        # 5TH Query: budgets with spending
        budgets = connection.execute(text(f"""
        SELECT b.category, b.amount AS budget,
        ROUND(COALESCE(SUM(ABS(t.amount)), 0)::numeric, 2) AS spent
        FROM budgets b
        LEFT JOIN transactions t
        ON b.category = t.category
        AND t.amount < 0
        {spending_filter.replace('AND', 'AND t.')}
        GROUP BY b.category, b.amount
        """), params).fetchall()

        # Building context dictionary
        context = {
            "period": period,
            "total_income": float(totals.total_income or 0),
            "total_spending": float(abs(totals.total_spending or 0)),
            "net_savings": float(totals.net_savings or 0),
            "spending_by_category": {
                row.category: float(row.total) for row in categories
            },
            "monthly_breakdown": [
                {"month": row.month, "spending": float(row.spending)}
                for row in monthly
            ],
            "top_5_transactions": [
                {
                    "date": str(row.date),
                    "description": row.description,
                    "amount": float(row.amount),
                    "category": row.category
                }
                for row in top5_transactions
            ],
            "budgets": {
                row.category: {
                    "budget": float(row.budget),
                    "spent": float(row.spent),
                    "status": "over budget" if float(row.spent) > float(row.budget)
                    else "near limit" if float(row.spent) > float(row.budget) * 0.8
                    else "on track"
                }
                for row in budgets
            }
        }

    return context


def build_system_prompt(context):
    """
        Builds the system prompt with financial context for Claude.
        """

    return f"""You are a helpful personal finance assistant for a Canadian user.
    You have access to their real financial data for the period: {context['period']}

    FINANCIAL SUMMARY:
    - Total Income: ${context['total_income']:.2f}
    - Total Spending: ${context['total_spending']:.2f}
    - Net Savings: ${context['net_savings']:.2f}

    SPENDING BY CATEGORY:
    {json.dumps(context['spending_by_category'], indent=2)}

    MONTHLY BREAKDOWN:
    {json.dumps(context['monthly_breakdown'], indent=2)}

    TOP 5 BIGGEST TRANSACTIONS:
    {json.dumps(context['top_5_transactions'], indent=2)}
    
    BUDGET STATUS:
    {json.dumps(context['budgets'], indent=2)}

    INSTRUCTIONS:
    - Answer questions about this financial data naturally and helpfully
    - Be specific with dollar amounts
    - Keep answers concise — 2 to 3 sentences maximum
    - If asked something not in the data, say so honestly
    - Never make up numbers — only use the data provided above"""

def get_chat_response(message, conversation_history, engine, client,  start_date=None, end_date=None):
    """
        Main function called by Flask route.
        Gathers context, builds prompt, calls Claude, returns response.
        """
    context = get_financial_context(engine, start_date, end_date)
    system_prompt = build_system_prompt(context)

    conversation_history.append({
        "role": "user",
        "content": message
    })

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        system=system_prompt,
        messages=conversation_history
    )

    assistant_message = response.content[0].text

    # add Claude's response to history
    conversation_history.append({
        "role": "assistant",
        "content": assistant_message
    })

    return assistant_message, conversation_history

