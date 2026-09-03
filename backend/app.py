import os
from sqlalchemy import text
from flask import Flask, request, jsonify
from flask_cors import CORS
from database import get_engine, get_client
from models.transaction import create_tables, create_budget_table
from pipeline.parser import parse_bmo_csv
from pipeline.ingestion import insert_transactions
from pipeline.categorization import categorize_all_pending

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]}})

# Initializing database and client
engine = get_engine()
client = get_client()

# Creating tables if they don't exist
create_tables(engine)
create_budget_table(engine)
# -------------------- routes -------------------------
@app.route("/health", methods=["GET"])
def health():
    """Check if the API is running."""
    return jsonify({"status": "ok"})

@app.route("/upload", methods=["POST"])
def upload():
    """ Receives a BMO csv file, parses, inserts and categorizes transactions"""

    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    # Checking if the file is a csv
    if not file.filename.endswith(".csv"):
        return jsonify({"error": "File must be a CSV"}), 400

    # saving the file temporarily so parser can read it
    temp_path = os.path.join("temp", file.filename)
    os.makedirs("temp", exist_ok=True)
    file.save(temp_path)

    # Running the full pipeline
    df = parse_bmo_csv(temp_path)
    records = df.to_dict(orient="records")
    insert_transactions(records, engine)
    categorize_all_pending(engine, client)

    # Deleting temp file after processing the data
    os.remove(temp_path)
    return jsonify({
        "message" : "Upload Successful",
        "processed" : len(records)
    }), 200

@app.route("/transactions", methods=["GET"])
def transactions():
    """Returns all transactions from the database"""

    start_date = request.args.get("start")
    end_date = request.args.get("end")

    if start_date and end_date:
        query = text("""
                SELECT id, transaction_type, date, amount, 
                       description, transaction_code, category, created_at
                FROM transactions
                WHERE date BETWEEN :start AND :end
                ORDER BY date DESC
            """)
        params = {"start": start_date, "end": end_date}
    else:
        query = text("""
                SELECT id, transaction_type, date, amount,
                       description, transaction_code, category, created_at
                FROM transactions
                ORDER BY date DESC
            """)
        params = {}

    with engine.connect() as connection:
        result = connection.execute(query, params)
        rows = result.fetchall()
        transactions_list = [dict(row._mapping) for row in rows]
    return jsonify(transactions_list), 200

@app.route("/analytics/summary", methods=["GET"])
def get_summary():
    """Returns monthly income, spending and net savings"""
    start_date = request.args.get("start")
    end_date = request.args.get("end")

    if start_date and end_date:
        date_filter = "WHERE date BETWEEN :start AND :end"
        params = {"start": start_date, "end": end_date}
    else:
        date_filter = ""
        params = {}

    # First query => totals
    totals_query = text(f"""
            SELECT
                SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) AS total_income,
                SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END) AS total_spending,
                SUM(amount) AS net_savings
            FROM transactions
            {date_filter}
        """)

    # Second query => spending by category
    category_query = text(f"""
        SELECT category, SUM(amount) AS total
        FROM transactions
        WHERE amount < 0
        {f"AND date BETWEEN :start AND :end" if start_date and end_date else ""} 
        GROUP BY category
        ORDER BY total ASC
        """)

    with engine.connect() as connection:
        # get totals
        totals_result = connection.execute(totals_query, params)
        totals_row = totals_result.fetchone()
        summary = {
            "total_income": round(float(totals_row.total_income or 0), 2),
            "total_spending": round(float(totals_row.total_spending or 0), 2),
            "net_savings": round(float(totals_row.net_savings or 0), 2)
        }

        # get by category
        category_result = connection.execute(category_query, params)
        by_category = {}
        for row in category_result.fetchall():
            by_category[row.category] = float(row.total) # Converting Decimal to float

    summary["by_category"] = by_category
    return jsonify(summary), 200

@app.route("/analytics/trends", methods=["GET"])
def get_trends():
    """Returns monthly spending totals for trend line chart."""

    start_date = request.args.get("start")
    end_date = request.args.get("end")
    granularity = request.args.get("granularity", "monthly")  # default monthly

    # choose date format based on granularity
    if granularity == "daily":
        date_format = "YYYY-MM-DD"
        group_label = "day"
    else:
        date_format = "YYYY-MM"
        group_label = "month"

    if start_date and end_date:
        query = text(f"""
                SELECT 
                ROUND(SUM(amount)::numeric, 2) AS total_spending, 
                TO_CHAR(date, '{date_format}') AS {group_label}, date FROM transactions
                WHERE amount < 0 AND date BETWEEN :start AND :end
                GROUP BY '{date_format}'
                ORDER BY {group_label}
            """)
        params = {"start":start_date, "end":end_date}
    else:
        query = text(f"""
            SELECT 
            ROUND(SUM(amount)::numeric, 2) AS total_spending,
            TO_CHAR(date, '{date_format}') AS {group_label} FROM transactions
            WHERE amount < 0
            GROUP BY TO_CHAR(date, '{date_format}')
            ORDER BY {group_label}
        """)
        params = {}

    with engine.connect() as connection:
        results = connection.execute(query, params)
        trends = results.fetchall()
        trends_list = [dict(trend._mapping) for trend in trends]
    return jsonify(trends_list), 200

# Two flask endpoints for bedget
@app.route("/budgets", methods=["GET"])
def get_budget():
    """Returns all budgets with current spendings"""
    start_date = request.args.get("start")
    end_date = request.args.get("end")

    if start_date and end_date:
        date_filter = "AND t.date BETWEEN :start AND :end"
        params = {"start": start_date, "end": end_date}
    else:
        date_filter = ""
        params = {}

    query = text(f"""
    SELECT b.category, b.amount AS budget,
    ROUND(COALESCE(SUM(ABS(t.amount)), 0)::numeric, 2) as spent 
    FROM budgets b
    LEFT JOIN transactions t
    ON b.category = t.category 
    AND t.amount < 0
    {date_filter}
    GROUP BY b.category, b.amount
    ORDER BY  b.category
    """)

    with engine.connect() as connection:
        result = connection.execute(query, params)
        budgets = [dict(row._mapping) for row in result.fetchall()]

    return jsonify(budgets), 200

@app.route("/budgets", methods=["POST"])
def set_budgets():
    """Creates or udpdates budgets for a category"""
    data = request.get_json()
    amount = data.get("amount")
    category = data.get("category")

    if not category or not amount:
        return jsonify({"error": "category and amount required"}), 400

    query = text("""
    INSERT INTO budgets (category, amount)
    VALUES (:category, :amount)
    ON CONFLICT (category)
    DO UPDATE SET amount = :amount
    """)

    with engine.connect() as connection:
        connection.execute(query, {"category": category, "amount": amount})
        connection.commit()

    return jsonify({"message": f"Budget set for {category}"}), 200

if __name__ == "__main__":
    app.run(debug=True)



