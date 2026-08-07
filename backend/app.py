import os
from flask import Flask, request
from flask_cors import CORS
from database import get_engine, get_client
from transaction import create_tables
from parser import parse_bmo_csv
from ingestion import insert_transactions
from categorization import categorize_all_pending

app = Flask(__name__)
CORS(app)

# Initializing database and client
engine = get_engine()
client = get_client()

# Creating tables if they don't exist
create_tables()
# -------------------- routes -------------------------



