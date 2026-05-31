from typing import Optional
from fastapi import APIRouter, HTTPException, Body, Depends
import requests
import os
from pydantic import BaseModel
from sqlalchemy.orm import Session
from db.database import get_db
from db.schema import MetaAccount

router = APIRouter()

META_GRAPH_URL = "https://graph.facebook.com/v19.0"

class PublishRequest(BaseModel):
    page_id: str
    message: str
    access_token: str
    image_url: Optional[str] = None  # Optional image to post

class InstagramPublishRequest(BaseModel):
    ig_user_id: str
    image_url: str
    caption: str
    access_token: str

class ConnectMetaRequest(BaseModel):
    tenant_id: int  # In a real app, infer this from a secure JWT backend token
    page_id: str
    page_name: str
    access_token: str

@router.post("/connect")
def connect_meta_account(payload: ConnectMetaRequest, db: Session = Depends(get_db)):
    """
    Saves the Meta Page credentials to the database for the current tenant.
    Exchanges the short-lived user token for a long-lived Page access token
    (non-expiring) so the connection persists beyond 1 hour.
    """
    app_id = os.environ.get("META_APP_ID", "")
    app_secret = os.environ.get("META_APP_SECRET", "")

    page_access_token = payload.access_token  # fallback

    # Step 1: Exchange short-lived user token → long-lived user token (60 days)
    if app_id and app_secret:
        try:
            exchange_res = requests.get(
                f"{META_GRAPH_URL}/oauth/access_token",
                params={
                    "grant_type": "fb_exchange_token",
                    "client_id": app_id,
                    "client_secret": app_secret,
                    "fb_exchange_token": payload.access_token
                }
            )
            if exchange_res.status_code == 200:
                long_lived_user_token = exchange_res.json().get("access_token", payload.access_token)
                print(f"DEBUG - Got long-lived user token (first 30): {long_lived_user_token[:30]}")

                # Step 2: Get the non-expiring Page access token using the long-lived user token
                pages_res = requests.get(
                    f"{META_GRAPH_URL}/me/accounts",
                    params={"access_token": long_lived_user_token}
                )
                if pages_res.status_code == 200:
                    pages = pages_res.json().get("data", [])
                    matched = next((p for p in pages if p["id"] == payload.page_id), None)
                    if matched:
                        page_access_token = matched["access_token"]
                        print(f"DEBUG - Got non-expiring Page token (first 30): {page_access_token[:30]}")
                    else:
                        print(f"DEBUG - Page {payload.page_id} not found in /me/accounts, using fallback token")
            else:
                print(f"DEBUG - Token exchange failed: {exchange_res.json()}")
        except Exception as e:
            print(f"DEBUG - Token exchange error: {e}")
    else:
        print("DEBUG - META_APP_ID or META_APP_SECRET not set, skipping token exchange")

    # Try to find a linked Instagram account using the Page token
    ig_id = None
    try:
        ig_res = get_instagram_accounts(payload.page_id, page_access_token)
        ig_id = ig_res.get("instagram_business_account", {}).get("id")
    except:
        pass

    account = db.query(MetaAccount).filter_by(tenant_id=payload.tenant_id, page_id=payload.page_id).first()
    if not account:
        account = MetaAccount(
            tenant_id=payload.tenant_id,
            page_id=payload.page_id,
            page_name=payload.page_name,
            access_token=page_access_token,
            ig_user_id=ig_id
        )
        db.add(account)
    else:
        account.access_token = page_access_token
        account.page_name = payload.page_name
        account.ig_user_id = ig_id
    
    db.commit()
    return {
        "status": "success", 
        "message": f"Connected {payload.page_name}",
        "has_instagram": ig_id is not None
    }

@router.get("/pages")
def get_user_pages(user_access_token: str):
    """
    Fetch all Facebook Pages the user manages.
    """
    if not user_access_token:
        raise HTTPException(status_code=400, detail="User access token required")

    url = f"{META_GRAPH_URL}/me/accounts"
    params = {"access_token": user_access_token}
    
    response = requests.get(url, params=params)
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json())
        
    data = response.json()
    print("DEBUG - FB PAGES RESPONSE:", data)
    return data

@router.get("/instagram-accounts")
def get_instagram_accounts(page_id: str, access_token: str):
    """
    Fetch the Instagram Professional account connected to a specific Facebook Page.
    Requires 'instagram_basic' permission.
    """
    url = f"{META_GRAPH_URL}/{page_id}"
    params = {
        "fields": "instagram_business_account",
        "access_token": access_token
    }
    
    response = requests.get(url, params=params)
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json())
        
    return response.json()

@router.post("/publish/facebook")
def publish_to_facebook(payload: PublishRequest):
    """
    Publish a post (text or photo) to a Facebook Page.
    Requires 'pages_manage_posts' permission.
    """
    if payload.image_url:
        # Post a photo with a caption
        url = f"{META_GRAPH_URL}/{payload.page_id}/photos"
        data = {
            "url": payload.image_url,
            "message": payload.message,
            "access_token": payload.access_token
        }
    else:
        # Post text only
        url = f"{META_GRAPH_URL}/{payload.page_id}/feed"
        data = {
            "message": payload.message,
            "access_token": payload.access_token
        }
    
    response = requests.post(url, data=data)
    if response.status_code != 200:
        error_detail = response.json()
        message = error_detail.get("error", {}).get("message", str(error_detail))
        raise HTTPException(status_code=response.status_code, detail=message)
        
    return response.json()

@router.post("/publish/instagram")
def publish_to_instagram(payload: InstagramPublishRequest):
    """
    Publish a photo post to an Instagram Business account. (Requires 2 steps)
    Requires 'instagram_content_publish' permission.
    """
    import time

    # Step 1: Create the media container
    media_url = f"{META_GRAPH_URL}/{payload.ig_user_id}/media"
    media_data = {
        "image_url": payload.image_url,
        "caption": payload.caption,
        "access_token": payload.access_token
    }
    
    media_response = requests.post(media_url, data=media_data)
    if media_response.status_code != 200:
        raise HTTPException(status_code=media_response.status_code, detail=media_response.json())
        
    creation_id = media_response.json().get("id")
    print(f"DEBUG IG - Media container created: {creation_id}")

    # Step 1.5: Poll until the container status is FINISHED (up to 30 seconds)
    status_url = f"{META_GRAPH_URL}/{creation_id}"
    max_attempts = 10
    for attempt in range(max_attempts):
        status_res = requests.get(status_url, params={
            "fields": "status_code",
            "access_token": payload.access_token
        })
        status_data = status_res.json()
        status_code = status_data.get("status_code", "")
        print(f"DEBUG IG - Container status (attempt {attempt + 1}): {status_code}")
        
        if status_code == "FINISHED":
            break
        elif status_code == "ERROR":
            raise HTTPException(status_code=400, detail=f"Instagram media container failed: {status_data}")
        
        time.sleep(3)  # Wait 3 seconds before retrying
    else:
        raise HTTPException(status_code=408, detail="Instagram media container did not finish processing in time. Please try again.")

    # Step 2: Publish the media container
    publish_url = f"{META_GRAPH_URL}/{payload.ig_user_id}/media_publish"
    publish_data = {
        "creation_id": creation_id,
        "access_token": payload.access_token
    }
    
    publish_response = requests.post(publish_url, data=publish_data)
    if publish_response.status_code != 200:
        raise HTTPException(status_code=publish_response.status_code, detail=publish_response.json())
        
    return publish_response.json()
