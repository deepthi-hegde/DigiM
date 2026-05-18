import os
from dotenv import load_dotenv
load_dotenv()
from google import genai
from google.genai import types
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from api.meta import router as meta_router
from api.auth import router as auth_router
import uuid
import shutil

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
from db.database import get_db, engine
from db.schema import Base, MetaAccount, Campaign
from api.meta import publish_to_facebook, PublishRequest
from utils.storage import upload_to_gcs

# Ensure tables are created
Base.metadata.create_all(bind=engine)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "assets")
os.makedirs(UPLOAD_DIR, exist_ok=True)

class CampaignRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    minAge: int = Field(..., ge=13, le=100)
    maxAge: int = Field(..., ge=13, le=100)
    gender: str = Field(..., min_length=1)
    freq: str = Field(..., min_length=1)
    category: str = Field(..., min_length=1)

class CampaignPublishRequest(BaseModel):
    message: str
    image_url: str = None
    publish_to_instagram: bool = False
    tenant_id: int = 1

@app.get("/api/meta/status")
def get_meta_status(tenant_id: int = 1, db: Session = Depends(get_db)):
    account = db.query(MetaAccount).filter_by(tenant_id=tenant_id).first()
    if account:
        return {
            "connected": True,
            "page_name": account.page_name,
            "page_id": account.page_id
        }
    return {"connected": False}

@app.post("/api/campaign/publish")
def publish_campaign(payload: CampaignPublishRequest, db: Session = Depends(get_db)):
    # Get the latest connected account that has a real page ID
    account = db.query(MetaAccount).filter_by(tenant_id=payload.tenant_id)\
        .order_by(MetaAccount.id.desc()).first()
    if not account:
        raise HTTPException(status_code=400, detail="No Meta account connected")
    
    # If the user hasn't selected a real page yet, mock the success to avoid graph API errors during testing
    if account.page_id == "pending_page_selection":
        return {"status": "success", "message": "Mock published because page_id is pending_page_selection"}

    # Actual publish call to Meta
    fb_res = None
    ig_res = None
    
    # 1. Post to Facebook
    pub_req = PublishRequest(
        page_id=account.page_id,
        message=payload.message,
        access_token=account.access_token,
        image_url=payload.image_url
    )
    fb_res = publish_to_facebook(pub_req)
    
    # 2. Post to Instagram (if requested and account is linked)
    if payload.publish_to_instagram:
        if not account.ig_user_id:
            raise HTTPException(status_code=400, detail="No Instagram account linked to this Facebook Page")
        if not payload.image_url:
            raise HTTPException(status_code=400, detail="Instagram publishing requires an image")
            
        from api.meta import publish_to_instagram, InstagramPublishRequest
        ig_pub_req = InstagramPublishRequest(
            ig_user_id=account.ig_user_id,
            image_url=payload.image_url,
            caption=payload.message,
            access_token=account.access_token
        )
        ig_res = publish_to_instagram(ig_pub_req)
        
    return {
        "status": "success", 
        "fb_response": fb_res,
        "ig_response": ig_res
    }

import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

@app.post("/api/campaign/generate")
def generate_campaign(payload: CampaignRequest, db: Session = Depends(get_db)):
    api_key = os.environ.get("GEMINI_API_KEY")
    
    existing_campaign = db.query(Campaign).filter_by(
        tenant_id=1,
        prompt=payload.prompt,
        category=payload.category,
        min_age=payload.minAge,
        max_age=payload.maxAge,
        gender=payload.gender
    ).first()
    
    if existing_campaign:
        return {
            "status": "success",
            "generated_text": existing_campaign.generated_text,
            "visual_suggestion": existing_campaign.visual_suggestion,
            "cached": True
        }

    if not api_key:
        return {
            "status": "success",
            "generated_text": "Experience ultimate comfort with our premium linen shirts. 🌿 Breathable, stylish, and perfect for the sun!\n\n#SummerVibes #LinenLove",
            "visual_suggestion": "A high-quality photo of a linen shirt on a sunny balcony.",
            "cached": False
        }
        
    try:
        client = genai.Client(api_key=api_key)
        
        category_instruction = ""
        if payload.category == "Knowledge Info":
            category_instruction = "Style: Educational. Provide comparisons or facts."
        elif payload.category == "Promotions":
            category_instruction = "Style: High-energy. Focus on urgency."
        else:
            category_instruction = "Style: Engaging."

        prompt_text = f"""
        You are an expert digital marketing copywriter for a premium textile brand. 
        Create an engaging social media post for:
        Topic: {payload.prompt}
        Audience: {payload.gender}, {payload.minAge}-{payload.maxAge}
        Category: {payload.category} ({category_instruction})
        
        OUTPUT FORMAT:
        [CAPTION]
        Your post text here...
        
        [VISUAL_SUGGESTION]
        Brief description of an image/infographic to pair with this.
        """
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt_text,
        )
        
        full_text = response.text
        # Parse text
        caption = ""
        suggestion = ""
        if "[CAPTION]" in full_text and "[VISUAL_SUGGESTION]" in full_text:
            parts = full_text.split("[VISUAL_SUGGESTION]")
            caption = parts[0].replace("[CAPTION]", "").strip()
            suggestion = parts[1].strip()
        else:
            caption = full_text.strip()
            suggestion = "A professional lifestyle photo related to the product."

        new_campaign = Campaign(
            tenant_id=1,
            prompt=payload.prompt,
            category=payload.category,
            min_age=payload.minAge,
            max_age=payload.maxAge,
            gender=payload.gender,
            generated_text=caption,
            visual_suggestion=suggestion
        )
        db.add(new_campaign)
        db.commit()
        
        return {
            "status": "success", 
            "generated_text": caption,
            "visual_suggestion": suggestion,
            "cached": False
        }
    except Exception as e:
        import traceback
        error_msg = f"AI Error: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        return {
            "status": "error",
            "message": str(e)
        }

class ImageGenRequest(BaseModel):
    prompt: str

@app.post("/api/campaign/generate-image")
def generate_ai_image(payload: ImageGenRequest):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=400, detail="API key missing")
    
    try:
        client = genai.Client(api_key=api_key)
        print(f"Generating image for: {payload.prompt}")
        
        response = client.models.generate_images(
            model='imagen-4.0-fast-generate-001',
            prompt=payload.prompt,
            config=types.GenerateImageConfig(
                number_of_images=1,
                output_mime_type='image/jpeg'
            )
        )
        
        if not response.generated_images:
            raise Exception("No images generated")
            
        import uuid
        filename = f"ai_gen_{uuid.uuid4().hex}.jpg"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        with open(filepath, "wb") as f:
            f.write(response.generated_images[0].image_bytes)
            
        # Upload to GCS
        public_url = upload_to_gcs(filepath, f"ai-gen/{filename}")
            
        return {"status": "success", "url": public_url}
    except Exception as e:
        print(f"Image gen error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
import uuid

@app.post("/api/assets/upload")
async def upload_asset(file: UploadFile = File(...)):
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Upload to GCS
    public_url = upload_to_gcs(file_path, f"uploads/{unique_filename}")
        
    return {
        "status": "success",
        "url": public_url,
        "filename": file.filename,
        "type": "video" if file.content_type.startswith("video") else "image"
    }

@app.get("/api/assets")
def list_assets():
    if not os.path.exists(UPLOAD_DIR):
        return []
    
    assets = []
    for filename in os.listdir(UPLOAD_DIR):
        if filename == ".gitignore": continue
        file_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.isfile(file_path):
            assets.append({
                "id": filename,
                "url": f"/api/assets/raw/{filename}",
                "name": filename
            })
    return assets

from fastapi.responses import FileResponse

@app.get("/api/assets/raw/{filename}")
def get_asset_file(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="File not found")

@app.get("/")
def health_check():
    return {"status": "ok", "message": "MarketFlow AI Backend is running"}
