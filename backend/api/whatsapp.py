import os
import httpx
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from db.database import get_db
from db.schema import Tenant, AuditLog

router = APIRouter()

class WhatsAppSettingsRequest(BaseModel):
    tenant_id: int = 1
    whatsapp_phone_number_id: str = Field(..., min_length=1)
    whatsapp_access_token: str = Field(..., min_length=1)

class WhatsAppSendRequest(BaseModel):
    tenant_id: int = 1
    recipient_phone: str = Field(..., min_length=1)
    template_name: str = "hello_world"

@router.get("/status")
def get_whatsapp_status(tenant_id: int = 1, db: Session = Depends(get_db)):
    tenant = db.query(Tenant).filter_by(id=tenant_id).first()
    if not tenant:
        return {"connected": False}
    
    # Check if DB credentials exist, or fall back to local .env
    phone_id = tenant.whatsapp_phone_number_id or os.environ.get("WHATSAPP_PHONE_NUMBER_ID")
    token = tenant.whatsapp_access_token or os.environ.get("WHATSAPP_ACCESS_TOKEN")
    
    return {
        "connected": bool(phone_id and token),
        "whatsapp_phone_number_id": phone_id,
        "has_token": bool(token)
    }

@router.post("/settings")
def save_whatsapp_settings(payload: WhatsAppSettingsRequest, db: Session = Depends(get_db)):
    tenant = db.query(Tenant).filter_by(id=payload.tenant_id).first()
    if not tenant:
        tenant = Tenant(
            id=payload.tenant_id,
            name="Demo Business",
            email=f"demo_{payload.tenant_id}@digim.local",
            is_active=True,
        )
        db.add(tenant)
    
    tenant.whatsapp_phone_number_id = payload.whatsapp_phone_number_id
    tenant.whatsapp_access_token = payload.whatsapp_access_token
    db.commit()

    # Log action
    log = AuditLog(
        tenant_id=payload.tenant_id,
        user_email="admin@digim.com",
        action="Configure WhatsApp Settings",
        details=f"Configured Phone Number ID: {payload.whatsapp_phone_number_id}"
    )
    db.add(log)
    db.commit()

    return {"status": "success", "message": "WhatsApp settings updated successfully."}

@router.post("/send-template")
async def send_whatsapp_template(payload: WhatsAppSendRequest, db: Session = Depends(get_db)):
    tenant = db.query(Tenant).filter_by(id=payload.tenant_id).first()
    
    phone_id = (tenant.whatsapp_phone_number_id if tenant else None) or os.environ.get("WHATSAPP_PHONE_NUMBER_ID")
    token = (tenant.whatsapp_access_token if tenant else None) or os.environ.get("WHATSAPP_ACCESS_TOKEN")
    
    if not phone_id or not token:
        raise HTTPException(
            status_code=400,
            detail="WhatsApp settings are incomplete. Please provide Phone Number ID and Access Token."
        )

    url = f"https://graph.facebook.com/v21.0/{phone_id}/messages"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    body = {
        "messaging_product": "whatsapp",
        "to": payload.recipient_phone,
        "type": "template",
        "template": {
            "name": payload.template_name,
            "language": {
                "code": "en_US"
            }
        }
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=body, headers=headers, timeout=10.0)
            
        # Log dispatch action
        log = AuditLog(
            tenant_id=payload.tenant_id,
            user_email="admin@digim.com",
            action="Send WhatsApp Message",
            details=f"Template: {payload.template_name} sent to {payload.recipient_phone}. Status Code: {response.status_code}"
        )
        db.add(log)
        db.commit()
        
        return {
            "status_code": response.status_code,
            "response": response.json()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to communicate with WhatsApp API: {e}")
