import os
import json
import datetime
import threading
from typing import Optional

def dispatch_scheduled_campaign_task(
    campaign_id: int,
    tenant_id: int,
    run_at: datetime.datetime,
    local_callback = None
) -> dict:
    """
    Schedules a delayed push notification / webhook for a scheduled campaign.
    In Production (Google Cloud), creates a Google Cloud Task.
    In Local Development, schedules a local background timer or logs webhook payload.
    """
    backend_url = os.environ.get("BACKEND_URL", "https://backend-uaicdvk4ka-uc.a.run.app").rstrip("/")
    target_url = f"{backend_url}/api/tasks/publish-scheduled"
    secret = os.environ.get("TASK_WEBHOOK_SECRET", "")
    
    payload = {
        "campaign_id": campaign_id,
        "tenant_id": tenant_id,
        "secret": secret
    }

    project = os.environ.get("CLOUD_TASKS_PROJECT_ID") or os.environ.get("PROJECT_ID") or "digim-496018"
    location = os.environ.get("CLOUD_TASKS_LOCATION", "us-central1")
    queue = os.environ.get("CLOUD_TASKS_QUEUE", "marketflow-scheduler-queue")
    
    # Check if Cloud Tasks is active (e.g. running on Cloud Run or credentials present)
    is_cloud_env = bool(os.environ.get("K_SERVICE") or os.environ.get("ENABLE_CLOUD_TASKS") == "true")

    if is_cloud_env:
        try:
            from google.cloud import tasks_v2
            from google.protobuf import timestamp_pb2

            client = tasks_v2.CloudTasksClient()
            parent = client.queue_path(project, location, queue)

            # Ensure UTC timezone
            if run_at.tzinfo is None:
                utc_run_at = run_at.replace(tzinfo=datetime.timezone.utc)
            else:
                utc_run_at = run_at.astimezone(datetime.timezone.utc)

            timestamp = timestamp_pb2.Timestamp()
            timestamp.FromDatetime(utc_run_at)

            task = {
                "http_request": {
                    "http_method": tasks_v2.HttpMethod.POST,
                    "url": target_url,
                    "headers": {"Content-Type": "application/json"},
                    "body": json.dumps(payload).encode(),
                },
                "schedule_time": timestamp,
            }

            created_task = client.create_task(request={"parent": parent, "task": task})
            print(f"[Cloud Tasks] Successfully scheduled task for Campaign {campaign_id} at {utc_run_at}: {created_task.name}")
            return {"status": "scheduled_via_cloud_tasks", "task_name": created_task.name}
        except Exception as e:
            print(f"[Cloud Tasks] Warning: Failed to create Cloud Task: {e}. Falling back to local dispatch.")

    # Local fallback for development / test environments:
    # Schedule a local timer if callback is provided, otherwise log the event
    now = datetime.datetime.utcnow()
    naive_run_at = run_at.replace(tzinfo=None) if run_at.tzinfo else run_at
    delay = max(0.0, (naive_run_at - now).total_seconds())
    
    print(f"[Local Scheduler] Scheduled Campaign {campaign_id} in {delay:.1f}s (run_at={run_at}). Webhook: POST {target_url}")

    if local_callback and delay >= 0:
        timer = threading.Timer(delay, local_callback, [campaign_id])
        timer.daemon = True
        timer.start()

    return {"status": "scheduled_locally", "delay_seconds": delay, "target_url": target_url}
