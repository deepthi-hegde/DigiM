import os
import hashlib
import time
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from db.database import get_db
from db.schema import Tenant, MetaAccount, Campaign, User, MediaAsset, AuditLog

router = APIRouter()

SUPERADMIN_PASSWORD = os.environ.get("SUPERADMIN_PASSWORD", "digim-superadmin-2026!")

# Simple in-memory token store for active superadmin sessions (token -> timestamp)
ACTIVE_SESSIONS: Dict[str, float] = {}

def generate_token(password: str) -> str:
    seed = f"{password}:{time.time()}:{os.urandom(16).hex()}"
    return hashlib.sha256(seed.encode()).hexdigest()

def verify_superadmin_auth(
    authorization: Optional[str] = Header(None),
    x_superadmin_token: Optional[str] = Header(None)
):
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
    elif x_superadmin_token:
        token = x_superadmin_token

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Superadmin authentication required"
        )

    # Allow direct password matching for API tools / curl
    if token == SUPERADMIN_PASSWORD:
        return True

    # Check active session token
    now = time.time()
    created_at = ACTIVE_SESSIONS.get(token)
    if not created_at or (now - created_at) > (86400 * 7):  # 7-day session
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Superadmin session expired or invalid"
        )
    return True

class LoginRequest(BaseModel):
    password: str

class LoginResponse(BaseModel):
    status: str
    token: str
    message: str

@router.post("/login", response_model=LoginResponse)
def superadmin_login(payload: LoginRequest):
    expected = os.environ.get("SUPERADMIN_PASSWORD", "digim-superadmin-2026!")
    if payload.password != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid superadmin password"
        )
    token = generate_token(payload.password)
    ACTIVE_SESSIONS[token] = time.time()
    return LoginResponse(
        status="success",
        token=token,
        message="Superadmin authenticated successfully"
    )

@router.get("/verify")
def verify_session(auth: bool = Depends(verify_superadmin_auth)):
    return {"status": "authenticated"}

@router.get("/overview")
def get_superadmin_overview(auth: bool = Depends(verify_superadmin_auth), db: Session = Depends(get_db)):
    total_tenants = db.query(Tenant).count()
    active_tenants = db.query(Tenant).filter(Tenant.is_active == True).count()
    total_campaigns = db.query(Campaign).count()
    
    scheduled_camps = db.query(Campaign).filter(Campaign.status == "scheduled").count()
    published_camps = db.query(Campaign).filter(Campaign.status == "published").count()
    failed_camps = db.query(Campaign).filter(Campaign.status == "failed").count()
    draft_camps = db.query(Campaign).filter(Campaign.status == "draft").count()

    connected_meta = db.query(MetaAccount).count()
    connected_ig = db.query(MetaAccount).filter(
        MetaAccount.ig_user_id.isnot(None),
        MetaAccount.ig_user_id != ""
    ).count()

    connected_wa = db.query(Tenant).filter(
        Tenant.whatsapp_access_token.isnot(None),
        Tenant.whatsapp_access_token != ""
    ).count()

    total_assets = db.query(MediaAsset).count()
    total_users = db.query(User).count()

    return {
        "tenants": {
            "total": total_tenants,
            "active": active_tenants
        },
        "campaigns": {
            "total": total_campaigns,
            "scheduled": scheduled_camps,
            "published": published_camps,
            "failed": failed_camps,
            "draft": draft_camps
        },
        "integrations": {
            "connected_meta_pages": connected_meta,
            "connected_instagram": connected_ig,
            "connected_whatsapp": connected_wa
        },
        "assets_count": total_assets,
        "users_count": total_users
    }

@router.get("/tenants")
def list_all_tenants(auth: bool = Depends(verify_superadmin_auth), db: Session = Depends(get_db)):
    tenants = db.query(Tenant).order_by(Tenant.id.asc()).all()
    results = []

    for t in tenants:
        meta_acc = db.query(MetaAccount).filter_by(tenant_id=t.id).order_by(MetaAccount.id.desc()).first()
        camp_total = db.query(Campaign).filter_by(tenant_id=t.id).count()
        camp_scheduled = db.query(Campaign).filter_by(tenant_id=t.id, status="scheduled").count()
        camp_published = db.query(Campaign).filter_by(tenant_id=t.id, status="published").count()
        camp_failed = db.query(Campaign).filter_by(tenant_id=t.id, status="failed").count()
        asset_count = db.query(MediaAsset).filter_by(tenant_id=t.id).count()
        user_count = db.query(User).filter_by(tenant_id=t.id).count()

        meta_info = {
            "connected": bool(meta_acc),
            "page_id": meta_acc.page_id if meta_acc else None,
            "page_name": meta_acc.page_name if meta_acc else None,
            "has_instagram": bool(meta_acc and meta_acc.ig_user_id),
            "ig_user_id": meta_acc.ig_user_id if meta_acc else None,
            "token_masked": f"{meta_acc.access_token[:8]}...{meta_acc.access_token[-6:]}" if (meta_acc and meta_acc.access_token) else None
        }

        wa_connected = bool(t.whatsapp_phone_number_id and t.whatsapp_access_token)
        wa_info = {
            "connected": wa_connected,
            "phone_number_id": t.whatsapp_phone_number_id,
            "token_masked": f"{t.whatsapp_access_token[:6]}...{t.whatsapp_access_token[-4:]}" if (t.whatsapp_access_token) else None
        }

        results.append({
            "id": t.id,
            "name": t.name or "Unnamed Business",
            "email": t.email,
            "google_sso_id": t.google_sso_id,
            "is_active": t.is_active,
            "brand": {
                "url": t.brand_url,
                "logo_url": t.brand_logo_url,
                "primary_color": t.brand_color_primary,
                "secondary_color": t.brand_color_secondary,
                "industry": t.industry,
                "category": t.category,
                "description": t.business_description
            },
            "targeting": {
                "locations": t.target_locations,
                "timezone": t.timezone,
                "gender": t.target_gender,
                "age_min": t.target_age_min,
                "age_max": t.target_age_max,
                "tone": t.persona_tone
            },
            "meta": meta_info,
            "whatsapp": wa_info,
            "campaigns": {
                "total": camp_total,
                "scheduled": camp_scheduled,
                "published": camp_published,
                "failed": camp_failed
            },
            "assets_count": asset_count,
            "users_count": user_count
        })

    return results

@router.get("/tenants/{tenant_id}")
def get_tenant_detail(tenant_id: int, auth: bool = Depends(verify_superadmin_auth), db: Session = Depends(get_db)):
    tenant = db.query(Tenant).filter_by(id=tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    recent_campaigns = db.query(Campaign).filter_by(tenant_id=tenant_id)        .order_by(Campaign.id.desc()).limit(20).all()
    
    campaign_list = []
    for c in recent_campaigns:
        campaign_list.append({
            "id": c.id,
            "prompt": c.prompt,
            "category": c.category,
            "status": c.status,
            "scheduled_time": c.scheduled_time.isoformat() if c.scheduled_time else None,
            "failure_reason": getattr(c, "failure_reason", None),
            "publish_to_facebook": getattr(c, "publish_to_facebook", True),
            "publish_to_instagram": getattr(c, "publish_to_instagram", False),
            "generated_text_preview": (c.generated_text[:120] + "...") if c.generated_text and len(c.generated_text) > 120 else c.generated_text,
            "has_image": bool(c.visual_suggestion)
        })

    recent_logs = db.query(AuditLog).filter_by(tenant_id=tenant_id)        .order_by(AuditLog.timestamp.desc()).limit(20).all()
    
    log_list = []
    for l in recent_logs:
        log_list.append({
            "id": l.id,
            "action": l.action,
            "user_email": l.user_email,
            "details": l.details,
            "timestamp": l.timestamp.isoformat() if l.timestamp else None
        })

    meta_account = db.query(MetaAccount).filter_by(tenant_id=tenant_id)        .order_by(MetaAccount.id.desc()).first()

    return {
        "tenant_id": tenant.id,
        "name": tenant.name,
        "email": tenant.email,
        "google_sso_id": tenant.google_sso_id,
        "meta_account": {
            "page_id": meta_account.page_id if meta_account else None,
            "page_name": meta_account.page_name if meta_account else None,
            "ig_user_id": meta_account.ig_user_id if meta_account else None,
            "token_preview": f"{meta_account.access_token[:10]}...{meta_account.access_token[-6:]}" if (meta_account and meta_account.access_token) else None
        } if meta_account else None,
        "whatsapp": {
            "phone_number_id": tenant.whatsapp_phone_number_id,
            "token_preview": f"{tenant.whatsapp_access_token[:8]}..." if tenant.whatsapp_access_token else None
        },
        "campaigns": campaign_list,
        "logs": log_list
    }
