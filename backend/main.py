from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from api.meta import router as meta_router
from api.auth import router as auth_router

app = FastAPI(title="MarketFlow AI Backend", version="1.0.0")

# Configure CORS so the Next.js frontend can communicate with it
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meta_router, prefix="/api/meta", tags=["Meta API"])
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])

from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from db.database import get_db
from db.schema import MetaAccount
from fastapi import Depends, HTTPException
from api.meta import publish_to_facebook, PublishRequest

class CampaignRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    maxAge: int = Field(..., ge=13, le=100)
    gender: str = Field(..., min_length=1)
    freq: str = Field(..., min_length=1)
    category: str = Field(..., min_length=1)

class CampaignPublishRequest(BaseModel):
    message: str
    tenant_id: int = 1

@app.post("/api/campaign/publish")
def publish_campaign(payload: CampaignPublishRequest, db: Session = Depends(get_db)):
    account = db.query(MetaAccount).filter_by(tenant_id=payload.tenant_id).first()
    if not account:
        raise HTTPException(status_code=400, detail="No Meta account connected")
    
    # If the user hasn't selected a real page yet, mock the success to avoid graph API errors during testing
    if account.page_id == "pending_page_selection":
        return {"status": "success", "message": "Mock published because page_id is pending_page_selection"}

    # Actual publish call to Meta
    pub_req = PublishRequest(
        page_id=account.page_id,
        message=payload.message,
        access_token=account.access_token
    )
    
    response = publish_to_facebook(pub_req)
    return {"status": "success", "meta_response": response}

@app.post("/api/campaign/generate")
def generate_campaign(payload: CampaignRequest):
    # This would typically connect to an LLM like Gemini
    return {
        "status": "success",
        "generated_text": f"Step into elegance with our new premium formal wear collection! 👔 Perfect for your next big event.\n\n✨ Target: {payload.gender}, up to {payload.maxAge} years.\nFrequency: {payload.freq}\n\nVisit our store today for an exclusive 20% discount. #FormalWear #LocalFashion"
    }

@app.get("/")
def health_check():
    return {"status": "ok", "message": "MarketFlow AI Backend is running"}
