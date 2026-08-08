import anthropic
import os
import json
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

CATEGORIES = [
    "Income", "Groceries", "Dining", "Coffee",
    "Transportation", "Shopping", "Subscriptions",
    "Health & Wellness", "Transfer", "Other"
]

SYSTEM_PROMPT = f"""You are a financial transaction categorizer for a Canadian personal finance app.

You will receive a bank transaction description and an optional transaction code.
Transaction codes mean:
- DN: direct deposit (likely Income or Transfer)
- CW: cash withdrawal or e-transfer sent (likely Transfer)
- PR: point of sale purchase (likely Shopping, Groceries, Dining, Coffee etc.)
- OP: online purchase (likely Shopping, Subscriptions etc.)

Respond ONLY with a JSON object in this exact format: {{"category": "CategoryName"}}
Choose from this exact list: {CATEGORIES}

Rules:
- Return only valid JSON, no explanation, no markdown, no extra text
- If uncertain, return "Other" — never return null
- Canadian context: CRA deposits are Income, Compass card is Transportation

Canadian specific rules:
- TLNK or TRANSLINK or COMPASS VENDING = Transportation
- CRA or CANADA REVENUE = Income  
- BC REVENUE or BC SERVICES = Health & Wellness
- TF followed by numbers = Transfer

Example:
Input: [PR] TIM HORTONS VANCOUVER BC
Output: {{"category": "Coffee"}}
"""

def categorize_transaction(description, transaction_code, client):
    """
    Sends description and transaction code to Claude API.
    Returns a valid category string.
    """

    user_message = f"Transaction code: {transaction_code}\nDescription: {description}"

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=50,
        system=SYSTEM_PROMPT,
        messages=[{
            "role": "user",
            "content": user_message,
        }]
    )

    raw = response.content[0].text.strip()

    try:
        parsed = json.loads(raw)
        category = parsed.get("category", "Other")
        if category not in CATEGORIES:
            return "Other"
        return category
    except json.JSONDecodeError:
        return "Other"



def categorize_all_pending(engine, client):
    """
    Fetches all NULL category rows from DB,
    categorizes each one, updates the DB.
    """

    with engine.connect() as connection:
        result = connection.execute(text("""
        SELECT id, description, transaction_code
        FROM transactions
        WHERE category IS NULL
        """))

        rows = result.fetchall()
        print(f"Testing with {len(rows)} rows.")

    with engine.connect() as connection:
        for row in rows:
            print(f"description: '{row.description}', code: '{row.transaction_code}'")
            category = categorize_transaction(row.description, row.transaction_code, client)
            connection.execute(text("""
            UPDATE transactions
            SET category = :category
            WHERE id = :id
            """), {"category": category, "id": row.id})

            print(f"{row.description[:40]} → {category}")

        connection.commit()
        print("Done.")

