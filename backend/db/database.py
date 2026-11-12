import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Uses SQLite for local dev to avoid setup hurdles
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./marketflow.db")

def sync_db_from_gcs():
    """
    Downloads SQLite database file from Google Cloud Storage on Cloud Run startup.
    """
    bucket_name = os.environ.get("GCS_BUCKET_NAME") or "marketflow-assets-digim-496018"
    if not os.environ.get("K_SERVICE"):
        return
    try:
        from google.cloud import storage
        client = storage.Client()
        bucket = client.bucket(bucket_name)
        blob = bucket.blob("database/marketflow.db")
        if blob.exists():
            blob.download_to_filename("./marketflow.db")
            print("Successfully restored SQLite database from GCS!")
        else:
            print("No existing SQLite database found in GCS, starting fresh.")
    except Exception as e:
        print(f"Error restoring SQLite database from GCS: {e}")

# Run sync before engine is initialized
sync_db_from_gcs()

# Engine initialization (SQLite requires check_same_thread=False)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Session local factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def run_migrations():
    """
    Applies incremental schema migrations to an existing SQLite database.
    Safe to run on every startup — each migration is guarded by a column existence check.
    """
    import sqlite3
    db_path = SQLALCHEMY_DATABASE_URL.replace("sqlite:///", "")
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        # Check existing columns
        cur.execute("PRAGMA table_info(campaigns)")
        existing_cols = {row[1] for row in cur.fetchall()}
        # Migration: add failure_reason column (stores human-readable error for failed scheduled posts)
        if "failure_reason" not in existing_cols:
            cur.execute("ALTER TABLE campaigns ADD COLUMN failure_reason TEXT")
            print("Migration applied: campaigns.failure_reason column added.")

        # Sync active Meta accounts between tenant 1 and tenant 2 if tenant 2 has expired or missing token for same page
        cur.execute("SELECT tenant_id, page_id, access_token, page_name, ig_user_id FROM meta_accounts WHERE tenant_id = 1")
        t1_meta = cur.fetchone()
        if t1_meta:
            page_id, access_token, page_name, ig_user_id = t1_meta[1], t1_meta[2], t1_meta[3], t1_meta[4]
            cur.execute("SELECT id, access_token FROM meta_accounts WHERE tenant_id = 2 AND page_id = ?", (page_id,))
            t2_meta = cur.fetchone()
            if t2_meta and t2_meta[1] != access_token:
                cur.execute("UPDATE meta_accounts SET access_token = ?, page_name = ?, ig_user_id = ? WHERE id = ?", (access_token, page_name, ig_user_id, t2_meta[0]))
                print("Migration applied: Synced active Facebook token to tenant 2.")
            elif not t2_meta:
                cur.execute("SELECT id FROM tenants WHERE id = 2")
                if cur.fetchone():
                    cur.execute("INSERT INTO meta_accounts (tenant_id, page_id, access_token, page_name, ig_user_id) VALUES (2, ?, ?, ?, ?)", (page_id, access_token, page_name, ig_user_id))
                    print("Migration applied: Linked active Facebook token to tenant 2.")

        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Migration error (non-fatal): {e}")

run_migrations()

def sync_db_to_gcs():
    """
    Uploads the updated SQLite database file back to Google Cloud Storage.
    """
    bucket_name = os.environ.get("GCS_BUCKET_NAME") or "marketflow-assets-digim-496018"
    if not os.environ.get("K_SERVICE"):
        return
    try:
        from google.cloud import storage
        client = storage.Client()
        bucket = client.bucket(bucket_name)
        blob = bucket.blob("database/marketflow.db")
        blob.upload_from_filename("./marketflow.db")
        print("Successfully backed up SQLite database to GCS!")
    except Exception as e:
        print(f"Error backing up SQLite database to GCS: {e}")

def get_db():
    """
    Dependency to yield a SQLAlchemy session per request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        sync_db_to_gcs()

