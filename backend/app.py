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
    pass

@app.route("/analytics/summary", methods=["GET"])
def get_summary():
    """Returns monthly income, spending and net savings"""
    pass

if __name__ == "__main__":
    app.run(debug=True)



