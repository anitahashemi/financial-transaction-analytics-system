import os
from sqlalchemy import text
from flask import Flask, request, jsonify
from flask_cors import CORS
from database import get_engine, get_client
from models.transaction import create_tables
from pipeline.parser import parse_bmo_csv
from pipeline.ingestion import insert_transactions
from pipeline.categorization import categorize_all_pending

app = Flask(__name__)
CORS(app)

# Initializing database and client
engine = get_engine()
client = get_client()

# Creating tables if they don't exist
create_tables(engine)
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
        AND {f"date BETWEEN :start AND :end" if start_date and end_date else ""} 
        GROUP BY category
        ORDER BY total ASC
        """)

    with engine.connect() as connection:
        # get totals
        totals_result = connection.execute(totals_query, params)
        totals_row = totals_result.fetchone()
        summary = dict(totals_row._mapping)

        # get by category
        category_result = connection.execute(category_query, params)
        by_category = {}
        for row in category_result.fetchall():
            by_category[row.category] = float(row.total) # Converting Decimal to float

    summary["by_category"] = by_category
    return jsonify(summary), 200

if __name__ == "__main__":
    app.run(debug=True)



