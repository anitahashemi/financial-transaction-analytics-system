from sqlalchemy import text

def create_tables(engine):
    """Creates all tables if they don't exist. Run once during setup."""

    with engine.connect() as connection:
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS transactions (
                id                  SERIAL PRIMARY KEY,
                transaction_type    TEXT NOT NULL,
                date                DATE NOT NULL,
                amount              FLOAT NOT NULL,
                description         TEXT NOT NULL,
                transaction_code    TEXT,
                category            TEXT,
                fingerprint         TEXT UNIQUE NOT NULL,
                created_at          TIMESTAMP DEFAULT NOW()
            );
        """))
        connection.commit()
        print("Tables created successfully")

def create_budget_table(engine):
    """Creates budget table if it doesn't exist"""

    with engine.connect() as connection:
        connection.execute(text("""
        CREATE TABLE IF NOT EXISTS budgets (
            category  TEXT PRIMARY KEY,
            amount    FLOAT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
            );
        """))
        connection.commit()
        print("Budgets table created successfully")