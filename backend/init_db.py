import os
from db.database import engine
from db.schema import Base

def init_db():
    print(f"Initializing database using connection string: {engine.url}")
    try:
        # Create all tables stored in this metadata.
        Base.metadata.create_all(bind=engine)
        print("Success! All PostgreSQL tables have been created.")
    except Exception as e:
        print(f"Error connecting to database: {e}")
        print("\nMake sure your local PostgreSQL server is running and the database 'marketflow' exists.")

if __name__ == "__main__":
    init_db()
