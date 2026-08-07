import os
import anthropic
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()

def get_engine():
    """
    Creates and returns a SQLAlchemy engine using credentials
    from .env variables.
    """
    DB_HOST = os.getenv("DB_HOST")
    DB_PORT = os.getenv("DB_PORT")
    DB_NAME = os.getenv("DB_NAME")
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")

    engine = create_engine(
        f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )
    return engine

def get_client():
    """
    Creates and returns Anthropic client using API key
    """
    return anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

