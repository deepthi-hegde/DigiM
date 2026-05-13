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

class CampaignRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    maxAge: int = Field(..., ge=13, le=100)
    gender: str = Field(..., min_length=1)
    freq: str = Field(..., min_length=1)
    category: str = Field(..., min_length=1)

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
