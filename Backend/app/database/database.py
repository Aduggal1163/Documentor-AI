import os
# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Load variables from .env file (if present)
load_dotenv()

URL_DATABASE = os.environ.get('DATABASE_URL')

if not URL_DATABASE:
    raise RuntimeError(
        "DATABASE_URL is not set. "
        "Copy .env.example to .env and fill in your credentials."
    )

engine = create_engine(URL_DATABASE)

sessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()