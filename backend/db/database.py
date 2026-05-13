import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Uses SQLite for local dev to avoid setup hurdles
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./marketflow.db")

# Engine initialization (SQLite requires check_same_thread=False)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Session local factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """
    Dependency to yield a SQLAlchemy session per request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
