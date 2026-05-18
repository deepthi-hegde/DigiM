import os
from google.cloud import storage
import uuid

def upload_to_gcs(file_path: str, destination_blob_name: str = None) -> str:
    """
    Uploads a file to GCP Cloud Storage and returns the public URL.
    """
    bucket_name = os.environ.get("GCS_BUCKET_NAME")
    if not bucket_name:
        # Fallback to local serving if bucket is not configured
        # This keeps the app working in dev
        filename = os.path.basename(file_path)
        return f"/api/assets/raw/{filename}"

    try:
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)
        
        if not destination_blob_name:
            # Generate a unique name
            ext = os.path.splitext(file_path)[1]
            destination_blob_name = f"assets/{uuid.uuid4()}{ext}"
            
        blob = bucket.blob(destination_blob_name)
        blob.upload_from_filename(file_path)
        
        # Make the blob publicly viewable
        # blob.make_public() # Optional: depends on bucket settings
        
        return f"https://storage.googleapis.com/{bucket_name}/{destination_blob_name}"
    except Exception as e:
        print(f"GCS Upload Error: {e}")
        # Fallback to local
        filename = os.path.basename(file_path)
        return f"/api/assets/raw/{filename}"
