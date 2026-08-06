import os
from typing import Optional
from dotenv import load_dotenv
# Reload trigger comment v4
load_dotenv()
from google import genai
from google.genai import types
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from api.meta import router as meta_router
from api.auth import router as auth_router
from api.whatsapp import router as whatsapp_router
from api.calendar import router as calendar_router
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
app.include_router(whatsapp_router, prefix="/api/whatsapp", tags=["WhatsApp"])
app.include_router(calendar_router, prefix="/api/calendar", tags=["Calendar"])

from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from db.database import get_db, engine
from db.schema import Base, MetaAccount, Campaign, User, AuditLog, Tenant
from api.meta import publish_to_facebook, PublishRequest
from utils.storage import upload_to_gcs
import datetime

from sqlalchemy import text

# Ensure tables are created
Base.metadata.create_all(bind=engine)

# Auto-migrate missing columns for existing SQLite DB files
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE tenants ADD COLUMN timezone VARCHAR DEFAULT 'Asia/Kolkata'"))
        conn.commit()
    except Exception:
        pass  # Column already exists or table freshly created

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "assets")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def infer_timezone_from_location(location_str: Optional[str]) -> str:
    """Infer IANA timezone string from location string or default to Asia/Kolkata."""
    if not location_str:
        return "Asia/Kolkata"
    
    loc = location_str.lower()
    if any(k in loc for k in ["bangalore", "bengaluru", "karnataka", "india", "mumbai", "delhi", "chennai", "hyderabad", "kolkata"]):
        return "Asia/Kolkata"
    elif any(k in loc for k in ["new york", "nyc", "est", "eastern", "boston", "miami"]):
        return "America/New_York"
    elif any(k in loc for k in ["los angeles", "la", "california", "pst", "pacific", "seattle"]):
        return "America/Los_Angeles"
    elif any(k in loc for k in ["chicago", "cst", "central", "dallas"]):
        return "America/Chicago"
    elif any(k in loc for k in ["london", "uk", "england", "gmt", "bst"]):
        return "Europe/London"
    elif any(k in loc for k in ["tokyo", "japan", "jst"]):
        return "Asia/Tokyo"
    elif any(k in loc for k in ["sydney", "australia"]):
        return "Australia/Sydney"
    elif any(k in loc for k in ["dubai", "uae"]):
        return "Asia/Dubai"
    elif any(k in loc for k in ["singapore"]):
        return "Asia/Singapore"
    
    return "Asia/Kolkata"


class BrandProfileRequest(BaseModel):
    tenant_id: int = 1
    business_name: Optional[str] = None
    business_description: Optional[str] = None
    industry: Optional[str] = None
    category: Optional[str] = None
    brand_url: Optional[str] = None
    brand_color_primary: Optional[str] = None
    brand_color_secondary: Optional[str] = None
    target_locations: Optional[str] = None   # comma-separated
    timezone: Optional[str] = None           # IANA timezone string e.g. Asia/Kolkata
    target_gender: Optional[str] = "All"
    target_age_min: Optional[int] = 18
    target_age_max: Optional[int] = 35
    persona_tone: Optional[str] = "casual"


@app.post("/api/onboarding/brand-profile")
def save_brand_profile(payload: BrandProfileRequest, db: Session = Depends(get_db)):
    """Save or update the brand identity profile for a tenant."""
    tenant = db.query(Tenant).filter_by(id=payload.tenant_id).first()
    if not tenant:
        # Create a stub tenant on first save (demo mode has no Google auth)
        tenant = Tenant(
            id=payload.tenant_id,
            name=payload.business_name or "Demo Business",
            email=f"demo_{payload.tenant_id}@digim.local",
            is_active=True,
        )
        db.add(tenant)

    if payload.business_name:
        tenant.name = payload.business_name
    if payload.business_description is not None:
        tenant.business_description = payload.business_description
    if payload.industry is not None:
        tenant.industry = payload.industry
    if payload.category is not None:
        tenant.category = payload.category
    if payload.brand_url is not None:
        tenant.brand_url = payload.brand_url
    if payload.brand_color_primary is not None:
        tenant.brand_color_primary = payload.brand_color_primary
    if payload.brand_color_secondary is not None:
        tenant.brand_color_secondary = payload.brand_color_secondary
    if payload.target_locations is not None:
        tenant.target_locations = payload.target_locations
    if payload.timezone:
        tenant.timezone = payload.timezone
    elif payload.target_locations and not tenant.timezone:
        tenant.timezone = infer_timezone_from_location(payload.target_locations)
    elif not tenant.timezone:
        tenant.timezone = "Asia/Kolkata"

    if payload.target_gender is not None:
        tenant.target_gender = payload.target_gender
    if payload.target_age_min is not None:
        tenant.target_age_min = payload.target_age_min
    if payload.target_age_max is not None:
        tenant.target_age_max = payload.target_age_max
    if payload.persona_tone is not None:
        tenant.persona_tone = payload.persona_tone

    db.commit()
    db.refresh(tenant)
    return {"status": "success", "message": "Brand profile saved.", "timezone": tenant.timezone}


@app.get("/api/onboarding/brand-profile")
def get_brand_profile(tenant_id: int = 1, db: Session = Depends(get_db)):
    """Retrieve the saved brand profile for a tenant."""
    tenant = db.query(Tenant).filter_by(id=tenant_id).first()
    if not tenant:
        return {}
    tz = tenant.timezone or infer_timezone_from_location(tenant.target_locations)
    return {
        "business_name": tenant.name,
        "business_description": tenant.business_description,
        "industry": tenant.industry,
        "category": tenant.category,
        "brand_url": tenant.brand_url,
        "brand_color_primary": tenant.brand_color_primary,
        "brand_color_secondary": tenant.brand_color_secondary,
        "target_locations": tenant.target_locations,
        "timezone": tz,
        "target_gender": tenant.target_gender,
        "target_age_min": tenant.target_age_min,
        "target_age_max": tenant.target_age_max,
        "persona_tone": tenant.persona_tone,
    }


class ScrapeUrlRequest(BaseModel):
    url: str


@app.post("/api/onboarding/scrape-url")
def scrape_brand_url(payload: ScrapeUrlRequest):
    """Use Gemini to extract brand name, description and industry from a public URL."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {
            "status": "mock",
            "business_name": "Sample Brand",
            "business_description": "A creative local business.",
            "industry": "Clothing & Apparel",
        }
    try:
        import google.genai as genai
        client = genai.Client(api_key=api_key)
        prompt = (
            f"Visit this URL or use its text content to extract brand information: {payload.url}\n"
            "Return a JSON object with keys: business_name, business_description (1-2 sentences), industry.\n"
            "Respond with ONLY valid JSON, no markdown."
        )
        config = types.GenerateContentConfig(
            tools=[{"google_search": {}}]
        )
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=config,
        )
        import json
        text = response.text.strip()
        # Strip any markdown code fences
        if text.startswith("```"):
            text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
        data = json.loads(text)
        return {"status": "success", **data}
    except Exception as e:
        return {"status": "error", "detail": str(e)}



class CampaignRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    minAge: int = Field(..., ge=13, le=100)
    maxAge: int = Field(..., ge=13, le=100)
    gender: str = Field(..., min_length=1)
    freq: str = Field(..., min_length=1)
    category: str = Field(..., min_length=1)
    businessName: Optional[str] = None
    phoneNumber: Optional[str] = None
    industry: Optional[str] = None
    tone: Optional[str] = "casual"


class CampaignPublishRequest(BaseModel):
    message: str
    image_url: Optional[str] = None
    publish_to_instagram: bool = False
    tenant_id: int = 1
    scheduled_time: Optional[str] = None  # ISO format string or None
    campaign_id: Optional[int] = None

@app.get("/api/meta/status")
def get_meta_status(tenant_id: int = 1, db: Session = Depends(get_db)):
    account = db.query(MetaAccount).filter_by(tenant_id=tenant_id)\
        .order_by(MetaAccount.id.desc()).first()
    if account:
        return {
            "connected": True,
            "page_name": account.page_name,
            "page_id": account.page_id,
            "has_instagram": bool(account.ig_user_id)
        }
    return {"connected": False}

@app.post("/api/campaign/publish")
def publish_campaign(payload: CampaignPublishRequest, db: Session = Depends(get_db)):
    # Get the latest connected account that has a real page ID
    account = db.query(MetaAccount).filter_by(tenant_id=payload.tenant_id)\
        .order_by(MetaAccount.id.desc()).first()
    if not account:
        raise HTTPException(status_code=400, detail="No Meta account connected")

    # Handle Scheduling
    if payload.scheduled_time:
        tenant = db.query(Tenant).filter_by(id=payload.tenant_id).first()
        tenant_tz_str = tenant.timezone if (tenant and tenant.timezone) else infer_timezone_from_location(tenant.target_locations if tenant else None)
        
        try:
            raw_time_str = payload.scheduled_time
            if raw_time_str.endswith("Z"):
                raw_dt = datetime.datetime.fromisoformat(raw_time_str.replace("Z", "+00:00"))
                utc_dt = raw_dt.astimezone(datetime.timezone.utc).replace(tzinfo=None)
            else:
                raw_dt = datetime.datetime.fromisoformat(raw_time_str)
                if raw_dt.tzinfo is None:
                    try:
                        from zoneinfo import ZoneInfo
                        loc_tz = ZoneInfo(tenant_tz_str)
                    except Exception:
                        from zoneinfo import ZoneInfo
                        loc_tz = ZoneInfo("Asia/Kolkata")
                    loc_dt = raw_dt.replace(tzinfo=loc_tz)
                    utc_dt = loc_dt.astimezone(datetime.timezone.utc).replace(tzinfo=None)
                else:
                    utc_dt = raw_dt.astimezone(datetime.timezone.utc).replace(tzinfo=None)
            parsed_time = utc_dt
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid scheduled_time format: {e}")
        
        # Update existing campaign if campaign_id is provided, otherwise create a new one
        campaign = None
        if payload.campaign_id:
            campaign = db.query(Campaign).filter_by(id=payload.campaign_id).first()
            
        if campaign:
            campaign.scheduled_time = parsed_time
            campaign.status = "scheduled"
            campaign.generated_text = payload.message
            if payload.image_url:
                campaign.visual_suggestion = payload.image_url
        else:
            campaign = Campaign(
                tenant_id=payload.tenant_id,
                prompt="Scheduled direct post",
                category="Direct",
                min_age=18,
                max_age=65,
                gender="All",
                generated_text=payload.message,
                visual_suggestion=payload.image_url,
                scheduled_time=parsed_time,
                status="scheduled"
            )
            db.add(campaign)
        
        db.commit()
        db.refresh(campaign)

        # Log schedule action
        log = AuditLog(
            tenant_id=payload.tenant_id,
            user_email="admin@digim.com",
            action="Schedule Campaign",
            details=f"Scheduled campaign {campaign.id} for {payload.scheduled_time}"
        )
        db.add(log)
        db.commit()

        return {"status": "scheduled", "campaign_id": campaign.id, "message": f"Successfully scheduled post for {payload.scheduled_time}"}

    # If the user hasn't selected a real page yet, mock the success to avoid graph API errors during testing
    if account.page_id == "pending_page_selection":
        # Log mock publish
        log = AuditLog(
            tenant_id=payload.tenant_id,
            user_email="admin@digim.com",
            action="Publish Campaign (Mock)",
            details="Mock published because page_id is pending_page_selection"
        )
        db.add(log)
        db.commit()
        return {"status": "success", "message": "Mock published because page_id is pending_page_selection"}

    # Actual publish call to Meta
    fb_res = None
    ig_res = None
    
    # In local development, if GCS is not configured, image_url starts with "/api/assets/raw/"
    # Meta APIs cannot download images from localhost, so we substitute a high-quality public image for local testing.
    image_url = payload.image_url
    if image_url and not image_url.startswith("http"):
        image_url = "https://picsum.photos/id/237/600/600.jpg"

    # 1. Post to Facebook
    pub_req = PublishRequest(
        page_id=account.page_id,
        message=payload.message,
        access_token=account.access_token,
        image_url=image_url
    )
    fb_res = publish_to_facebook(pub_req)
    
    # 2. Post to Instagram (if requested and account is linked)
    if payload.publish_to_instagram:
        if not account.ig_user_id:
            raise HTTPException(status_code=400, detail="No Instagram account linked to this Facebook Page")
        if not image_url:
            raise HTTPException(status_code=400, detail="Instagram publishing requires an image")
            
        from api.meta import publish_to_instagram, InstagramPublishRequest
        print(f"DEBUG IG PUBLISH - ig_user_id: {account.ig_user_id}")
        print(f"DEBUG IG PUBLISH - image_url: {image_url}")
        print(f"DEBUG IG PUBLISH - access_token prefix: {account.access_token[:30]}")
        ig_pub_req = InstagramPublishRequest(
            ig_user_id=account.ig_user_id,
            image_url=image_url,
            caption=payload.message,
            access_token=account.access_token
        )
        ig_res = publish_to_instagram(ig_pub_req)
        
    # Log live publish
    log = AuditLog(
        tenant_id=payload.tenant_id,
        user_email="admin@digim.com",
        action="Publish Campaign",
        details=f"Published to Facebook (and Instagram if linked)"
    )
    db.add(log)
    db.commit()

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
        gender=payload.gender,
        tone=payload.tone
    ).first()
    
    if existing_campaign:
        return {
            "status": "success",
            "id": existing_campaign.id,
            "generated_text": existing_campaign.generated_text,
            "visual_suggestion": existing_campaign.visual_suggestion,
            "is_liked": existing_campaign.is_liked,
            "cached": True
        }

    # Retrieve liked campaigns to construct few-shot learning prompt context
    liked_campaigns = db.query(Campaign).filter_by(tenant_id=1, is_liked=True).limit(3).all()
    few_shot_context = ""
    if liked_campaigns:
        few_shot_context = "\nBelow are examples of posts the user has saved and likes (match this style and format):\n"
        for c in liked_campaigns:
            few_shot_context += f"Input Topic: {c.prompt}\nGenerated Post: {c.generated_text}\n---\n"

    if not api_key:
        return {
            "status": "success",
            "id": 999,
            "generated_text": f"[Mock {payload.tone.capitalize()}] Experience ultimate comfort with our premium linen shirts. 🌿 Breathable, stylish, and perfect for the sun!\n\n#SummerVibes #LinenLove",
            "visual_suggestion": "A high-quality photo of a linen shirt on a sunny balcony.",
            "is_liked": False,
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
        You are an expert digital marketing copywriter. {few_shot_context}
        
        Create an engaging social media post for:
        Topic: {payload.prompt}
        Audience: {payload.gender}, {payload.minAge}-{payload.maxAge}
        Category: {payload.category} ({category_instruction})
        Requested Tone: {payload.tone} (e.g., formal, casual, elaborate, shorten)
        
        CRITICAL RULES FOR POST COPY:
        1. NO PLACEHOLDERS: Do NOT include any placeholder text (such as [Your Name], [Link], [Phone], [Insert Details Here], etc.). 
           - Use the real brand name '{payload.businessName or "our brand"}' instead of brand placeholders.
           - If a phone number is provided ('{payload.phoneNumber or ""}'), use it. If not, do NOT write a phone number placeholder.
           - Do not mention links unless a specific URL is provided.
        2. TONE & STYLE: Adhere strictly to the requested tone '{payload.tone}'. If shorten, keep it extremely brief. If elaborate, write a rich post.
        3. CALL TO ACTION: Make it a clear, direct, and realistic call to action.
        
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
            tone=payload.tone,
            generated_text=caption,
            visual_suggestion=suggestion
        )
        db.add(new_campaign)
        db.commit()
        db.refresh(new_campaign)
        
        # Log the generation event
        log = AuditLog(
            tenant_id=1,
            user_email="admin@digim.com",
            action="Generate Campaign",
            details=f"Generated campaign {new_campaign.id} with tone {payload.tone}"
        )
        db.add(log)
        db.commit()

        return {
            "status": "success", 
            "id": new_campaign.id,
            "generated_text": caption,
            "visual_suggestion": suggestion,
            "is_liked": False,
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

class LikeRequest(BaseModel):
    is_liked: bool

@app.post("/api/campaign/{campaign_id}/like")
def toggle_campaign_like(campaign_id: int, payload: LikeRequest, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter_by(id=campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    campaign.is_liked = payload.is_liked
    db.commit()
    
    # Log like action
    log = AuditLog(
        tenant_id=1,
        user_email="admin@digim.com",
        action="Like Campaign" if payload.is_liked else "Unlike Campaign",
        details=f"Campaign ID: {campaign_id}"
    )
    db.add(log)
    db.commit()

    return {"status": "success", "is_liked": campaign.is_liked}

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
            model='imagen-4.0-generate-001',
            prompt=payload.prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                output_mime_type='image/jpeg'
            )
        )
        
        if not response.generated_images:
            raise Exception("No images generated")
            
        import uuid, base64, requests as req
        image_bytes = response.generated_images[0].image.image_bytes
        filename = f"ai_gen_{uuid.uuid4().hex}.jpg"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        with open(filepath, "wb") as f:
            f.write(image_bytes)
            
        # Try GCS first (production)
        public_url = upload_to_gcs(filepath, f"ai-gen/{filename}")
        
        # ============================================================
        # TODO (GCP DEPLOYMENT): Remove this catbox.moe block entirely.
        # For production, set GCS_BUCKET_NAME env var in Cloud Run and
        # grant the Cloud Run service account roles/storage.objectAdmin
        # on the bucket. The upload_to_gcs() call above will then return
        # a proper public https://storage.googleapis.com/... URL.
        # See: image_hosting_architecture.md for full setup instructions.
        # ============================================================
        # LOCAL DEV ONLY: upload to catbox.moe for a public URL so Meta
        # can download the image. Images are temporary and public — do NOT
        # use in production.
        if not public_url.startswith("http"):
            import requests as req
            try:
                with open(filepath, "rb") as img_file:
                    catbox_res = req.post(
                        "https://catbox.moe/user/api.php",
                        data={"reqtype": "fileupload"},
                        files={"fileToUpload": (filename, img_file, "image/jpeg")}
                    )
                if catbox_res.status_code == 200 and catbox_res.text.startswith("http"):
                    public_url = catbox_res.text.strip()
                    print(f"Uploaded to catbox.moe: {public_url}")
                else:
                    print(f"catbox.moe upload failed: {catbox_res.text}")
            except Exception as upload_err:
                print(f"Public upload failed: {upload_err}")
            
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

@app.get("/api/campaigns")
def list_campaigns(tenant_id: int = 1, db: Session = Depends(get_db)):
    tenant = db.query(Tenant).filter_by(id=tenant_id).first()
    tz_str = tenant.timezone if (tenant and tenant.timezone) else infer_timezone_from_location(tenant.target_locations if tenant else None)
    
    from zoneinfo import ZoneInfo
    try:
        loc_tz = ZoneInfo(tz_str)
    except Exception:
        loc_tz = ZoneInfo("Asia/Kolkata")
        
    campaigns = db.query(Campaign).filter_by(tenant_id=tenant_id).order_by(Campaign.id.desc()).all()
    result = []
    for c in campaigns:
        c_dict = {
            "id": c.id,
            "tenant_id": c.tenant_id,
            "prompt": c.prompt,
            "category": c.category,
            "min_age": c.min_age,
            "max_age": c.max_age,
            "gender": c.gender,
            "generated_text": c.generated_text,
            "visual_suggestion": c.visual_suggestion,
            "tone": c.tone,
            "is_liked": c.is_liked,
            "status": c.status,
            "scheduled_time": None,
            "scheduled_time_local": None,
            "timezone": tz_str
        }
        if c.scheduled_time:
            utc_dt = c.scheduled_time.replace(tzinfo=datetime.timezone.utc)
            local_dt = utc_dt.astimezone(loc_tz)
            c_dict["scheduled_time"] = local_dt.isoformat()
            c_dict["scheduled_time_local"] = local_dt.strftime("%I:%M %p")
        result.append(c_dict)
    return result

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

@app.delete("/api/assets/{filename}")
def delete_asset(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        return {"status": "success", "message": f"Deleted {filename}"}
    raise HTTPException(status_code=404, detail="File not found")

@app.get("/api/assets/raw/{filename}")
def get_asset_file(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="File not found")

@app.get("/api/admin/logs")
def get_audit_logs(user_email: str = "admin@digim.com", db: Session = Depends(get_db)):
    if "admin" not in user_email:
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required")
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()
    return logs

class UserRoleRequest(BaseModel):
    email: str
    role: str

@app.post("/api/admin/users/role")
def assign_user_role(payload: UserRoleRequest, admin_email: str = "admin@digim.com", db: Session = Depends(get_db)):
    if "admin" not in admin_email:
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required")
    user = db.query(User).filter_by(email=payload.email).first()
    if not user:
        user = User(email=payload.email, tenant_id=1, role=payload.role)
        db.add(user)
    else:
        user.role = payload.role
    db.commit()
    return {"status": "success", "email": payload.email, "role": payload.role}

@app.get("/")
def health_check():
    return {"status": "ok", "message": "MarketFlow AI Backend is running"}

import threading
import time

def process_scheduled_campaigns():
    while True:
        # Check every 30 seconds
        time.sleep(30)
        from db.database import SessionLocal
        db = SessionLocal()
        try:
            now = datetime.datetime.utcnow()
            # Query all scheduled posts whose execution time has passed
            sched_posts = db.query(Campaign).filter(
                Campaign.status == "scheduled",
                Campaign.scheduled_time <= now
            ).all()
            
            for post in sched_posts:
                print(f"Auto-publishing scheduled campaign ID: {post.id}...")
                account = db.query(MetaAccount).filter_by(tenant_id=post.tenant_id)\
                    .order_by(MetaAccount.id.desc()).first()
                if not account:
                    post.status = "failed"
                    db.commit()
                    continue
                
                if account.page_id == "pending_page_selection":
                    # Mock successful publication
                    post.status = "published"
                    db.commit()
                    continue
                
                try:
                    image_url = post.visual_suggestion
                    if image_url and not image_url.startswith("http"):
                        image_url = "https://picsum.photos/id/237/600/600.jpg"
                    
                    pub_req = PublishRequest(
                        page_id=account.page_id,
                        message=post.generated_text,
                        access_token=account.access_token,
                        image_url=image_url
                    )
                    publish_to_facebook(pub_req)
                    post.status = "published"
                    
                    # Log the auto-publish action
                    log = AuditLog(
                        tenant_id=post.tenant_id,
                        user_email="system@digim.com",
                        action="Auto-Publish Scheduled Post",
                        details=f"Campaign ID: {post.id} successfully published."
                    )
                    db.add(log)
                except Exception as pub_err:
                    print(f"Error publishing scheduled post {post.id}: {pub_err}")
                    post.status = "failed"
                
                db.commit()
        except Exception as err:
            print(f"Error in scheduler processor loop: {err}")
        finally:
            db.close()

@app.on_event("startup")
def start_scheduler():
    print("Starting scheduled post background worker thread...")
    threading.Thread(target=process_scheduled_campaigns, daemon=True).start()

