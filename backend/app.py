import os
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

@app.route("/transactions", methods=["GET"])
def transactions():
    """Returns all transactions from the database"""
    pass

@app.route("/analytics/summary", methods=["GET"])
def get_summary():
    """Returns monthly income, spending and net savings"""
    pass

if __name__ == "__main__":
    app.run(debug=True)



