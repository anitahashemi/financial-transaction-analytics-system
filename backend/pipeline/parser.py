import pandas as pd
import hashlib
import re
from pathlib import Path
def load_raw(file_path):
    df = pd.read_csv(file_path, skiprows=1)
    return df

def rename_drop_columns(df):
    df = df.copy()
    df.columns = ['card_number', 'transaction_type', 'date', 'amount', 'description']
    df= df.drop(columns=['card_number'])
    return df

def parse_date(df):
    df = df.copy()
    df['date'] = pd.to_datetime(df['date'], format="%Y%m%d")
    return df

def clean_description(df):
    df = df.copy()
    df['description'] = df['description'].str.replace("\xa0", " ", regex=False)
    df['description'] = df['description'].str.replace(r"\s+", " ", regex=True)
    df['description'] = df['description'].str.strip()
    return df

def extract_transaction_codes(df):
    df = df.copy()
    df["transaction_code"] = df["description"].str.extract(r'^\[([A-Z]+)\]')
    df["description"] = df["description"].str.replace(r'^\[[A-Z]+\]\s*', '', regex=True)
    return df

def generate_fingerprint(date, amount, description):
    raw = f"{str(date)}{str(amount)}{str(description)}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

def add_fingerprint(df):
    df = df.copy()
    df['fingerprint'] = df.apply(
    lambda row: generate_fingerprint(row["date"], row["amount"], row["description"]),
    axis=1
    )
    return df


def parse_bmo_csv(file_path):
    """
    Accepts a path to a csv file and returns a dataframe of clean
    transaction history, ready for database insertion.
    """

    if not Path(file_path).exists():
        raise FileNotFoundError(f"csv file not found: {file_path}")
    df = load_raw(file_path)
    df = rename_drop_columns(df)
    df = parse_date(df)
    df = clean_description(df)
    df = extract_transaction_codes(df)
    df = add_fingerprint(df)
    return df