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
    image_url: str = None  # Optional image to post

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
    """
    account = db.query(MetaAccount).filter_by(tenant_id=payload.tenant_id, page_id=payload.page_id).first()
    if not account:
        account = MetaAccount(
            tenant_id=payload.tenant_id,
            page_id=payload.page_id,
            page_name=payload.page_name,
            access_token=payload.access_token
        )
        db.add(account)
    else:
        account.access_token = payload.access_token
        account.page_name = payload.page_name
    
    db.commit()
    return {"status": "success", "message": f"Connected {payload.page_name}"}

@router.get("/pages")
def get_user_pages(user_access_token: str):
    """
    Fetch all Facebook Pages the user manages.
    Requires 'pages_show_list' and 'pages_read_engagement' permissions.
    """
    if not user_access_token:
        raise HTTPException(status_code=400, detail="User access token required")

    url = f"{META_GRAPH_URL}/me/accounts"
    params = {"access_token": user_access_token}
    
    response = requests.get(url, params=params)
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json())
        
    return response.json()

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
        raise HTTPException(status_code=response.status_code, detail=response.json())
        
    return response.json()

@router.post("/publish/instagram")
def publish_to_instagram(payload: InstagramPublishRequest):
    """
    Publish a photo post to an Instagram Business account. (Requires 2 steps)
    Requires 'instagram_content_publish' permission.
    """
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
