import os
import json
from fastapi import APIRouter, HTTPException

router = APIRouter()

# Load the offline calendar data
CALENDAR_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data",
    "karnataka_calendar_2026.json"
)

@router.get("/events")
def get_calendar_events():
    """Retrieve the offline Karnataka 2026 holidays and festivals list."""
    if not os.path.exists(CALENDAR_FILE):
        raise HTTPException(status_code=404, detail="Calendar data file not found.")
    
    try:
        with open(CALENDAR_FILE, "r", encoding="utf-8") as f:
            events = json.load(f)
        return events
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read calendar data: {str(e)}")
