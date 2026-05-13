import os
from fastapi import HTTPException, status, Header
from google.oauth2 import id_token
from google.auth.transport import requests

# Typically this would be a dedicated backend client ID, but sharing the frontend one works for now
CLIENT_ID = os.getenv("NEXT_PUBLIC_GOOGLE_CLIENT_ID")

def verify_google_sso_token(authorization: str = Header(None)):
    """
    Dependency to verify the Google SSO JWT token sent from the Next.js frontend.
    Returns the decoded token payload (containing email, name, etc.).
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = authorization.split(" ")[1]
    
    try:
        # Verify the token with Google
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), CLIENT_ID)
        
        # Verify the issuer
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')
            
        return idinfo
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
