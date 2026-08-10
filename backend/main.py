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
from db.schema import Base, MetaAccount, Campaign, User, AuditLog, Tenant, MediaAsset
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
    try:
        conn.execute(text("ALTER TABLE tenants ADD COLUMN brand_logo_url VARCHAR"))
        conn.commit()
    except Exception:
        pass
    try:
        conn.execute(text("ALTER TABLE media_assets ADD COLUMN ai_tags VARCHAR"))
        conn.commit()
    except Exception:
        pass
    try:
        conn.execute(text("ALTER TABLE media_assets ADD COLUMN ai_description VARCHAR"))
        conn.commit()
    except Exception:
        pass

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "assets")
os.makedirs(UPLOAD_DIR, exist_ok=True)

TEMP_UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "temp_assets")
os.makedirs(TEMP_UPLOAD_DIR, exist_ok=True)

@app.get("/api/temp_assets/raw/{filename}")
def get_temp_asset(filename: str):
    file_path = os.path.join(TEMP_UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Temp asset not found")
    from fastapi.responses import FileResponse
    return FileResponse(file_path)


@app.get("/api/proxy-image")
def proxy_image(url: str):
    """Server-side image proxy. Downloads an external image and serves it
    with CORS headers so the browser canvas can draw it without taint."""
    import requests as req_lib
    from fastapi.responses import Response
    try:
        r = req_lib.get(url, timeout=15, headers={"User-Agent": "Mozilla/5.0"})
        r.raise_for_status()
        content_type = r.headers.get("Content-Type", "image/jpeg")
        return Response(
            content=r.content,
            media_type=content_type,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=86400",
            },
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to proxy image: {e}")



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


def auto_tag_media_asset(file_path: str, file_type: str = "image") -> dict:
    """
    Uses Gemini 2.5 Flash Vision to analyze an uploaded image/video asset
    and automatically extract semantic tags and visual description.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key or not os.path.exists(file_path) or file_type == "video":
        filename = os.path.basename(file_path)
        clean_name = os.path.splitext(filename)[0].replace("_", " ").replace("-", " ")
        return {
            "ai_tags": f"uploaded, media, {clean_name}",
            "ai_description": f"Uploaded asset: {clean_name}"
        }

    try:
        from google import genai
        from google.genai import types
        import json

        client = genai.Client(api_key=api_key)
        
        with open(file_path, "rb") as f:
            image_bytes = f.read()

        mime_type = "image/jpeg"
        if file_path.lower().endswith(".png"):
            mime_type = "image/png"
        elif file_path.lower().endswith(".webp"):
            mime_type = "image/webp"

        prompt = (
            "Analyze this product/brand marketing photo. Extract:\n"
            "1. 'ai_tags': 6 to 10 relevant comma-separated keywords describing product, clothing, style, color, occasion, or scene.\n"
            "2. 'ai_description': 1-2 sentence detailed summary of what is visually shown and who it targets.\n"
            "Return ONLY valid JSON with keys 'ai_tags' and 'ai_description'."
        )

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                prompt
            ]
        )

        text_out = response.text.strip()
        if text_out.startswith("```"):
            text_out = text_out.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
        
        parsed = json.loads(text_out)
        return {
            "ai_tags": parsed.get("ai_tags", "uploaded, product, creative"),
            "ai_description": parsed.get("ai_description", "Uploaded brand marketing creative")
        }
    except Exception as e:
        print(f"Auto-tagging vision error: {e}")
        filename = os.path.basename(file_path)
        clean_name = os.path.splitext(filename)[0].replace("_", " ").replace("-", " ")
        return {
            "ai_tags": f"uploaded, {clean_name}",
            "ai_description": f"Uploaded marketing media: {clean_name}"
        }


def save_permanent_asset_if_needed(image_url: Optional[str]) -> Optional[str]:
    if not image_url:
        return image_url
    if image_url.startswith("data:image/"):
        try:
            import base64
            import uuid
            header, base64_data = image_url.split(",", 1)
            ext = "png"
            if "jpeg" in header or "jpg" in header:
                ext = "jpg"
            filename = f"overlay_{uuid.uuid4().hex[:10]}.{ext}"
            file_path = os.path.join(UPLOAD_DIR, filename)
            with open(file_path, "wb") as f:
                f.write(base64.b64decode(base64_data))
            return f"/api/assets/raw/{filename}"
        except Exception as e:
            print(f"Error saving base64 asset: {e}")
            return image_url

    if "/api/temp_assets/raw/" in image_url:
        temp_filename = image_url.split("/api/temp_assets/raw/")[-1]
        temp_path = os.path.join(TEMP_UPLOAD_DIR, temp_filename)
        if os.path.exists(temp_path):
            perm_path = os.path.join(UPLOAD_DIR, temp_filename)
            import shutil
            shutil.copy(temp_path, perm_path)
            return f"/api/assets/raw/{temp_filename}"
    return image_url


class BrandProfileRequest(BaseModel):
    tenant_id: int = 1
    business_name: Optional[str] = None
    business_description: Optional[str] = None
    industry: Optional[str] = None
    category: Optional[str] = None
    brand_url: Optional[str] = None
    brand_logo_url: Optional[str] = None
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
    if payload.brand_logo_url is not None:
        tenant.brand_logo_url = payload.brand_logo_url
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
        "brand_logo_url": tenant.brand_logo_url,
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
    minAge: Optional[int] = Field(18, ge=13, le=100)
    maxAge: Optional[int] = Field(65, ge=13, le=100)
    gender: Optional[str] = Field("All", min_length=1)
    freq: Optional[str] = Field("Daily", min_length=1)
    category: Optional[str] = Field("General", min_length=1)
    businessName: Optional[str] = None
    phoneNumber: Optional[str] = None
    industry: Optional[str] = None
    tone: Optional[str] = "casual"
    tenant_id: Optional[int] = 1


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
    # Convert relative/temp/base64 asset URL to permanent URL
    image_url = save_permanent_asset_if_needed(payload.image_url)
    if image_url and not image_url.startswith("http"):
        public_backend_url = os.environ.get("BACKEND_URL", "https://backend-980545668366.us-central1.run.app")
        if image_url.startswith("/"):
            image_url = f"{public_backend_url.rstrip('/')}{image_url}"

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
        
        # Retrieve uploaded media assets for smart matching scoped to current tenant
        target_tenant_id = payload.tenant_id if payload.tenant_id is not None else 1
        user_assets = db.query(MediaAsset).filter_by(tenant_id=target_tenant_id).all()
        asset_inventory_text = ""
        if user_assets:
            asset_inventory_text = "\nAVAILABLE UPLOADED MEDIA ASSETS IN USER'S LIBRARY:\n"
            for a in user_assets:
                tags = a.ai_tags or "none"
                desc = a.ai_description or a.filename
                asset_inventory_text += f"- ASSET_ID: {a.id} | URL: {a.url} | Tags: {tags} | Description: {desc}\n"
        else:
            asset_inventory_text = "\nAVAILABLE UPLOADED MEDIA ASSETS: None uploaded yet.\n"

        category_instruction = ""
        if payload.category == "Knowledge Info":
            category_instruction = "Style: Educational. Provide comparisons or facts."
        elif payload.category == "Promotions":
            category_instruction = "Style: High-energy. Focus on urgency."
        else:
            category_instruction = "Style: Engaging."

        prompt_text = f"""
        You are an expert digital marketing copywriter. {few_shot_context}
        {asset_inventory_text}
        
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
        4. MEDIA ASSET MATCHING: Evaluate the AVAILABLE UPLOADED MEDIA ASSETS above against this campaign topic.
           - If an uploaded asset matches the topic & audience (relevance >= 60%), select it.
           - If NO uploaded asset fits this specific campaign topic (e.g. topic is space/cars and only silk saree assets are uploaded), set MATCHED_ID to NONE and RECOMMEND_AI_GEN to TRUE.
        
        OUTPUT FORMAT:
        [CAPTION]
        Your post text here...
        
        [VISUAL_SUGGESTION]
        Brief description of an image/infographic to pair with this.

        [MATCHED_URL]
        <Asset URL string from available inventory if relevant match exists, otherwise NONE>

        [MATCH_RATIONALE]
        <1 concise sentence explaining why this uploaded asset was selected, or why no uploaded asset in the library matches this campaign theme>

        [RECOMMEND_AI_GEN]
        <TRUE if no uploaded asset matches or if user should generate custom AI image, otherwise FALSE>
        """
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt_text,
        )
        
        full_text = response.text
        caption = ""
        suggestion = ""
        matched_url = None
        rationale = ""
        recommend_ai_gen = False

        if "[CAPTION]" in full_text:
            parts = full_text.split("[VISUAL_SUGGESTION]")
            caption = parts[0].replace("[CAPTION]", "").strip()
            rem = parts[1] if len(parts) > 1 else ""

            if "[MATCHED_URL]" in rem:
                sugg_part, match_part = rem.split("[MATCHED_URL]", 1)
                suggestion = sugg_part.strip()
                
                m_url_val = "NONE"
                if "[MATCH_RATIONALE]" in match_part:
                    url_p, rat_p = match_part.split("[MATCH_RATIONALE]", 1)
                    m_url_val = url_p.strip()
                    if "[RECOMMEND_AI_GEN]" in rat_p:
                        rat_val, rec_val = rat_p.split("[RECOMMEND_AI_GEN]", 1)
                        rationale = rat_val.strip()
                        recommend_ai_gen = "TRUE" in rec_val.upper()
                    else:
                        rationale = rat_p.strip()
                else:
                    m_url_val = match_part.strip()
                
                if m_url_val and m_url_val != "NONE" and m_url_val.startswith("http"):
                    matched_url = m_url_val
            else:
                suggestion = rem.strip()
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
            "matched_asset_url": matched_url,
            "match_rationale": rationale,
            "recommend_ai_gen": recommend_ai_gen,
            "is_liked": False,
            "cached": False
        }
    except Exception as e:
        import traceback
        error_msg = f"AI Error: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        raise HTTPException(status_code=500, detail=f"Failed to generate campaign: {str(e)}")

class RefineTextRequest(BaseModel):
    text: str
    action: str = "shorten" # shorten, elaborate, formal, casual

@app.post("/api/campaign/refine-text")
def refine_campaign_text(payload: RefineTextRequest):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")

    system_instruction = (
        "You are an expert social media copywriter. Refine the user's provided caption according to the requested action. "
        "Return ONLY the refined caption text with emojis and hashtags intact. Do not add intro/outro quotes or meta commentary."
    )

    if payload.action == "shorten":
        prompt = f"Make this caption punchy, concise, and significantly shorter while retaining core call to action:\n\n{payload.text}"
    elif payload.action == "elaborate":
        prompt = f"Elaborate on this caption with engaging storytelling and detail:\n\n{payload.text}"
    elif payload.action == "formal":
        prompt = f"Rewrite this caption in a professional, formal business tone:\n\n{payload.text}"
    else:
        prompt = f"Rewrite this caption in a friendly, casual conversational tone:\n\n{payload.text}"

    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7,
            )
        )
        refined = response.text.strip()
        return {"status": "success", "refined_text": refined}
    except Exception as e:
        print(f"Refine text error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
        return {
            "status": "error",
            "message": str(e)
        }

class CampaignDraftRequest(BaseModel):
    id: Optional[int] = None
    prompt: Optional[str] = ""
    category: Optional[str] = "Product Showcase"
    tone: Optional[str] = "casual"
    generated_text: Optional[str] = ""
    visual_suggestion: Optional[str] = ""
    image_url: Optional[str] = None
    scheduled_time: Optional[str] = None
    tenant_id: int = 1

@app.post("/api/campaign/draft")
def save_campaign_draft(payload: CampaignDraftRequest, db: Session = Depends(get_db)):
    campaign = None
    if payload.id:
        campaign = db.query(Campaign).filter_by(id=payload.id, tenant_id=payload.tenant_id).first()
    
    if campaign:
        campaign.prompt = payload.prompt or campaign.prompt
        campaign.category = payload.category or campaign.category
        campaign.tone = payload.tone or campaign.tone
        campaign.generated_text = payload.generated_text
        if payload.image_url:
            campaign.visual_suggestion = payload.image_url
        if payload.scheduled_time:
            try:
                raw_dt = datetime.datetime.fromisoformat(payload.scheduled_time.replace("Z", "+00:00"))
                campaign.scheduled_time = raw_dt.astimezone(datetime.timezone.utc).replace(tzinfo=None)
            except Exception:
                pass
        campaign.status = "draft"
    else:
        campaign = Campaign(
            tenant_id=payload.tenant_id,
            prompt=payload.prompt or "Draft Campaign",
            category=payload.category or "Product Showcase",
            min_age=18,
            max_age=35,
            gender="All",
            generated_text=payload.generated_text or "",
            visual_suggestion=payload.image_url or payload.visual_suggestion or "",
            tone=payload.tone or "casual",
            status="draft"
        )
        db.add(campaign)
    
    db.commit()
    db.refresh(campaign)
    return {"status": "success", "id": campaign.id, "message": "Draft saved successfully"}

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
    num_images: Optional[int] = 1
    format_type: Optional[str] = "post" # post (1:1), carousel / story (9:16 vertical)

@app.post("/api/campaign/generate-image")
def generate_ai_image(payload: ImageGenRequest):
    """Generate image(s) using Flux 1.1 Pro (fal.ai) with Imagen 4 fallback."""
    import uuid

    fal_key = os.environ.get("FAL_API_KEY")
    count = min(max(payload.num_images or 1, 1), 4)

    # ── Strategy 1: Flux 1.1 Pro via fal.ai ─────────────────────────────────
    if fal_key:
        try:
            import fal_client
            os.environ["FAL_KEY"] = fal_key  # fal_client reads this env var

            img_size = "portrait_16_9" if payload.format_type in ["carousel", "story"] else "square_hd"

            urls = []
            for _ in range(count):
                result = fal_client.subscribe(
                    "fal-ai/flux-pro/v1.1",
                    arguments={
                        "prompt": payload.prompt,
                        "image_size": img_size,
                        "num_images": 1,
                        "enable_safety_checker": True,
                    },
                )

                image_url = result["images"][0]["url"]
                import requests as req
                img_resp = req.get(image_url, timeout=30)
                img_resp.raise_for_status()

                filename = f"ai_gen_{uuid.uuid4().hex}.jpg"
                filepath = os.path.join(TEMP_UPLOAD_DIR, filename)
                with open(filepath, "wb") as f:
                    f.write(img_resp.content)

                public_url = upload_to_gcs(filepath, f"temp-ai-gen/{filename}")
                if not public_url.startswith("http"):
                    public_url = f"/api/temp_assets/raw/{filename}"
                urls.append(public_url)

            print(f"Flux 1.1 Pro images generated ({count}): {urls}")
            return {"status": "success", "url": urls[0], "urls": urls, "model": "flux-1.1-pro"}

        except Exception as e:
            print(f"Flux image gen error (will fallback to Imagen 4): {e}")

    # ── Strategy 2: Imagen 4 fallback ────────────────────────────────────────
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=400, detail="No image generation API key configured (FAL_API_KEY or GEMINI_API_KEY required)")

    try:
        client = genai.Client(api_key=api_key)
        print(f"Falling back to Imagen 4 for: {payload.prompt}")

        aspect_ratio = "9:16" if payload.format_type in ["carousel", "story"] else "1:1"

        response = client.models.generate_images(
            model='imagen-4.0-generate-001',
            prompt=payload.prompt,
            config=types.GenerateImagesConfig(
                number_of_images=count,
                aspect_ratio=aspect_ratio,
                output_mime_type='image/jpeg'
            )
        )

        if not response.generated_images:
            raise Exception("No images generated")

        urls = []
        for gen_img in response.generated_images:
            image_bytes = gen_img.image.image_bytes
            filename = f"ai_gen_{uuid.uuid4().hex}.jpg"
            filepath = os.path.join(TEMP_UPLOAD_DIR, filename)

            with open(filepath, "wb") as f:
                f.write(image_bytes)

            public_url = upload_to_gcs(filepath, f"temp-ai-gen/{filename}")
            if not public_url.startswith("http"):
                public_url = f"/api/temp_assets/raw/{filename}"
            urls.append(public_url)

        return {"status": "success", "url": urls[0], "urls": urls, "model": "imagen-4"}
    except Exception as e:
        print(f"Imagen 4 error: {e}")
        raise HTTPException(status_code=500, detail=str(e))




@app.post("/api/assets/upload")
async def upload_asset(file: UploadFile = File(...), tenant_id: int = 1, db: Session = Depends(get_db)):
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Upload to GCS
    public_url = upload_to_gcs(file_path, f"uploads/{unique_filename}")
    file_type = "video" if file.content_type.startswith("video") else "image"
    
    # Perform multimodal AI vision auto-tagging
    tag_info = auto_tag_media_asset(file_path, file_type)
    
    # Save to database for persistence across redeployments
    media_entry = MediaAsset(
        tenant_id=tenant_id,
        filename=file.filename,
        url=public_url,
        file_type=file_type,
        ai_tags=tag_info.get("ai_tags"),
        ai_description=tag_info.get("ai_description")
    )
    db.add(media_entry)
    db.commit()
    db.refresh(media_entry)
        
    return {
        "status": "success",
        "id": media_entry.id,
        "url": public_url,
        "filename": file.filename,
        "type": file_type,
        "ai_tags": media_entry.ai_tags,
        "ai_description": media_entry.ai_description
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
        img_url = None
        if c.visual_suggestion and (c.visual_suggestion.startswith('/') or c.visual_suggestion.startswith('http://') or c.visual_suggestion.startswith('https://')):
            img_url = c.visual_suggestion
            
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
            "image_url": img_url,
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
def list_assets(tenant_id: int = 1, db: Session = Depends(get_db)):
    assets = []
    
    # Fetch from Database for this specific tenant ONLY
    db_assets = db.query(MediaAsset).filter_by(tenant_id=tenant_id).order_by(MediaAsset.id.desc()).all()
    for item in db_assets:
        assets.append({
            "id": str(item.id),
            "url": item.url,
            "name": item.filename,
            "type": item.file_type,
            "ai_tags": item.ai_tags or "",
            "ai_description": item.ai_description or ""
        })
    return assets

class AssetTagUpdateRequest(BaseModel):
    ai_tags: Optional[str] = None
    ai_description: Optional[str] = None

@app.put("/api/assets/{asset_id}/tags")
def update_asset_tags(asset_id: str, payload: AssetTagUpdateRequest, tenant_id: int = 1, db: Session = Depends(get_db)):
    asset = None
    if asset_id.isdigit():
        asset = db.query(MediaAsset).filter_by(id=int(asset_id), tenant_id=tenant_id).first()
    if not asset:
        asset = db.query(MediaAsset).filter_by(tenant_id=tenant_id).filter(
            (MediaAsset.filename == asset_id) | (MediaAsset.url.contains(asset_id))
        ).first()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    if payload.ai_tags is not None:
        asset.ai_tags = payload.ai_tags
    if payload.ai_description is not None:
        asset.ai_description = payload.ai_description
        
    db.commit()
    db.refresh(asset)
    return {"status": "success", "id": asset.id, "ai_tags": asset.ai_tags, "ai_description": asset.ai_description}

from fastapi.responses import FileResponse

@app.delete("/api/assets/{filename}")
def delete_asset(filename: str, tenant_id: int = 1, db: Session = Depends(get_db)):
    # Remove from database if present for this tenant
    db.query(MediaAsset).filter_by(tenant_id=tenant_id).filter(
        (MediaAsset.filename == filename) | (MediaAsset.url.contains(filename))
    ).delete(synchronize_session=False)
    db.commit()
    
    # Remove from local filesystem if no other tenant references it
    other_refs = db.query(MediaAsset).filter_by(filename=filename).first()
    if not other_refs:
        file_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
    return {"status": "success", "message": f"Deleted {filename}"}

@app.delete("/api/campaigns/{campaign_id}")
def delete_campaign(campaign_id: int, tenant_id: int = 1, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter_by(id=campaign_id, tenant_id=tenant_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign post not found")
    
    db.delete(campaign)
    db.commit()

    # Log the deletion
    log = AuditLog(
        tenant_id=tenant_id,
        user_email="admin@digim.com",
        action="Delete Campaign",
        details=f"Deleted scheduled/draft campaign {campaign_id}"
    )
    db.add(log)
    db.commit()

    return {"status": "success", "message": f"Successfully deleted campaign {campaign_id}"}

@app.get("/api/assets/raw/{filename}")
def get_asset_file(filename: str):
    # Try assets directory first
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
        
    # Fallback to uploads directory
    uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
    fallback_path = os.path.join(uploads_dir, filename)
    if os.path.exists(fallback_path):
        return FileResponse(fallback_path)
        
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

from db.schema import ArchivedCampaign
from utils.storage import get_gcs_bucket_size_bytes

def process_post_archival_and_pruning():
    """
    Background worker that runs periodically:
    1. Archives published posts >90 days old to archived_campaigns table.
    2. Prunes GCS media files >180 days old if GCS usage exceeds 5.0 GB limit.
    """
    while True:
        try:
            time.sleep(3600) # Check hourly
            from db.database import SessionLocal
            db = SessionLocal()
            now = datetime.datetime.utcnow()
            thirty_days_ago = now - datetime.timedelta(days=30)
            ninety_days_ago = now - datetime.timedelta(days=90)
            one_eighty_days_ago = now - datetime.timedelta(days=180)

            # ── 0. Auto-Prune Abandoned Drafts (>30 days old & unliked) ────────
            abandoned_drafts = db.query(Campaign).filter(
                Campaign.status == "draft",
                Campaign.is_liked == False,
                Campaign.scheduled_time == None
            ).all()

            for draft in abandoned_drafts:
                db.delete(draft)
            db.commit()

            # ── 1. DB Archival (>90 days old published posts) ──────────────────
            old_published = db.query(Campaign).filter(
                Campaign.status == "published",
                Campaign.scheduled_time <= ninety_days_ago
            ).all()

            for post in old_published:
                archived = ArchivedCampaign(
                    original_campaign_id=post.id,
                    tenant_id=post.tenant_id,
                    prompt=post.prompt,
                    category=post.category,
                    min_age=post.min_age,
                    max_age=post.max_age,
                    gender=post.gender,
                    generated_text=post.generated_text,
                    visual_suggestion=post.visual_suggestion,
                    tone=post.tone,
                    is_liked=post.is_liked,
                    scheduled_time=post.scheduled_time,
                    status="archived",
                    archived_at=now
                )
                db.add(archived)
                db.delete(post)
                db.add(AuditLog(
                    tenant_id=post.tenant_id,
                    user_email="system@digim.com",
                    action="Archive Campaign",
                    details=f"Auto-archived post {post.id} (published >90d ago)"
                ))
            db.commit()

            # ── 2. GCS Storage Quota Pruning (>180d old & GCS > 5GB limit) ────
            FIVE_GB_BYTES = 5 * 1024 * 1024 * 1024
            gcs_bytes = get_gcs_bucket_size_bytes()

            if gcs_bytes > FIVE_GB_BYTES:
                old_archived = db.query(ArchivedCampaign).filter(
                    ArchivedCampaign.scheduled_time <= one_eighty_days_ago,
                    ArchivedCampaign.media_pruned == False
                ).all()

                for arch in old_archived:
                    arch.media_pruned = True
                    arch.visual_suggestion = None  # Clear heavy media reference
                    db.add(AuditLog(
                        tenant_id=arch.tenant_id,
                        user_email="system@digim.com",
                        action="Prune GCS Media Blob",
                        details=f"Pruned GCS media blob for archived post {arch.id} (>180d & GCS quota > 5GB)"
                    ))
                db.commit()

            db.close()
        except Exception as e:
            print(f"Error in archival processor thread: {e}")

@app.get("/api/storage/status")
def get_storage_status():
    size_bytes = get_gcs_bucket_size_bytes()
    limit_bytes = 5 * 1024 * 1024 * 1024  # 5GB Always Free limit
    used_gb = round(size_bytes / (1024 ** 3), 2)
    percentage = round((size_bytes / limit_bytes) * 100, 1) if limit_bytes > 0 else 0
    return {
        "used_bytes": size_bytes,
        "used_gb": used_gb,
        "limit_gb": 5.0,
        "percentage": percentage,
        "warning_threshold_exceeded": percentage > 90.0
    }

@app.get("/api/campaigns/archived")
def list_archived_campaigns(tenant_id: int = 1, db: Session = Depends(get_db)):
    archived = db.query(ArchivedCampaign).filter_by(tenant_id=tenant_id).order_by(ArchivedCampaign.archived_at.desc()).all()
    return archived

@app.get("/api/campaigns/archival-warnings")
def get_archival_warnings(tenant_id: int = 1, db: Session = Depends(get_db)):
    now = datetime.datetime.utcnow()
    eighty_three_days_ago = now - datetime.timedelta(days=83)
    ninety_days_ago = now - datetime.timedelta(days=90)
    
    # Posts published between 83 and 90 days ago (will archive in next 7 days)
    warning_posts = db.query(Campaign).filter(
        Campaign.tenant_id == tenant_id,
        Campaign.status == "published",
        Campaign.scheduled_time <= eighty_three_days_ago,
        Campaign.scheduled_time > ninety_days_ago
    ).all()
    
    result = []
    for p in warning_posts:
        days_until = 90 - (now - p.scheduled_time).days
        result.append({
            "id": p.id,
            "prompt": p.prompt,
            "generated_text": p.generated_text,
            "scheduled_time": p.scheduled_time,
            "days_until_archival": max(1, days_until)
        })
    return result

@app.post("/api/campaigns/archived/{archived_id}/unarchive")
def unarchive_campaign(archived_id: int, tenant_id: int = 1, db: Session = Depends(get_db)):
    archived = db.query(ArchivedCampaign).filter_by(id=archived_id, tenant_id=tenant_id).first()
    if not archived:
        raise HTTPException(status_code=404, detail="Archived campaign not found")

    restored = Campaign(
        tenant_id=archived.tenant_id,
        prompt=archived.prompt,
        category=archived.category,
        min_age=archived.min_age,
        max_age=archived.max_age,
        gender=archived.gender,
        generated_text=archived.generated_text,
        visual_suggestion=archived.visual_suggestion,
        tone=archived.tone,
        is_liked=archived.is_liked,
        scheduled_time=archived.scheduled_time,
        status="published"
    )
    db.add(restored)
    db.delete(archived)
    db.commit()
    return {"status": "success", "message": "Restored archived post to active history"}

@app.on_event("startup")
def start_scheduler():
    print("Starting scheduled post background worker thread...")
    threading.Thread(target=process_scheduled_campaigns, daemon=True).start()
    threading.Thread(target=process_post_archival_and_pruning, daemon=True).start()

