from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.database import get_db
from db.schema import Tenant
from core.security import verify_google_sso_token
from pydantic import BaseModel

router = APIRouter()

class AuthResponse(BaseModel):
    tenant_id: int
    name: str
    email: str
    token: str

@router.post("/login", response_model=AuthResponse)
def login_via_google(
    token_payload: dict = Depends(verify_google_sso_token),
    db: Session = Depends(get_db)
):
    """
    Validates Google SSO token, finds or creates the Tenant in PostgreSQL, 
    and returns session data.
    """
    try:
        email = token_payload.get("email")
        name = token_payload.get("name")
        google_id = token_payload.get("sub")
        
        if not email:
            raise HTTPException(status_code=400, detail="Email not found in token payload")
    
        # Look for existing tenant by email
        tenant = db.query(Tenant).filter(Tenant.email == email).first()
        
        if not tenant:
            # If demo tenant 1 exists and is unassigned or demo, claim it for this Google user
            demo_tenant = db.query(Tenant).filter(Tenant.id == 1).first()
            if demo_tenant and ("demo" in (demo_tenant.email or "").lower()):
                tenant = demo_tenant
                tenant.email = email
                if name:
                    tenant.name = name
                tenant.google_sso_id = google_id
            else:
                # Create new tenant
                tenant = Tenant(
                    email=email,
                    name=name or "Google User",
                    google_sso_id=google_id,
                    is_active=True
                )
                db.add(tenant)
                
            db.commit()
            db.refresh(tenant)
            
        return AuthResponse(
            tenant_id=tenant.id,
            name=tenant.name,
            email=tenant.email,
            token="mock-backend-jwt-token" 
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Auth/Database Error: {str(e)}")
