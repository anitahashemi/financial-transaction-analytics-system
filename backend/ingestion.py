from sqlalchemy import text

def insert_transactions(records, engine):
    """
    Accepts a list of clean transaction records and inserts them
    into the database, skipping duplicates by fingerprint.

    Args:
        records: list of dicts from parse_bmo_csv()
        engine: SQLAlchemy engine instance
    """
    insert_query = text("""
        INSERT INTO transactions
            (transaction_type, date, amount, description, 
             transaction_code, fingerprint) 
        VALUES 
            (:transaction_type, :date, :amount, :description, 
             :transaction_code, :fingerprint)
        ON CONFLICT (fingerprint) DO NOTHING;
    """)

    with engine.connect() as connection:
        for record in records:
            connection.execute(insert_query, record)
        connection.commit()

    print(f"Processed {len(records)} records")