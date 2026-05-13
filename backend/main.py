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

@app.get("/")
def health_check():
    return {"status": "ok", "message": "MarketFlow AI Backend is running"}
