"""
Authentication Module - Supabase Auth Proxy

This module provides authentication endpoints that proxy requests to Supabase Auth.
The backend acts as a middleman between the frontend and Supabase.

SECURITY NOTE:
- This is a learning backend. In production, tokens should be verified properly
  using JWKS (JSON Web Key Sets) from Supabase.
- For now, we accept tokens as-is and pass them to Supabase for validation.
"""

import os
from typing import Optional
import httpx
from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# =====================================================
# CONFIGURATION
# =====================================================
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

# Note: For a learning backend, we allow the server to start even without Supabase credentials
# API calls will fail at runtime if credentials are not configured
if SUPABASE_URL and SUPABASE_ANON_KEY:
    # Supabase Auth API base URL
    SUPABASE_AUTH_URL = f"{SUPABASE_URL}/auth/v1"
else:
    SUPABASE_AUTH_URL = None
    print("⚠️  WARNING: SUPABASE_URL and SUPABASE_ANON_KEY not set. Auth endpoints will not work.")

# =====================================================
# ROUTER
# =====================================================
router = APIRouter(prefix="/api/auth", tags=["Authentication"])
bearer_scheme = HTTPBearer(auto_error=False)

# =====================================================
# REQUEST/RESPONSE MODELS
# =====================================================
class SignUpRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

class UserResponse(BaseModel):
    id: str
    email: str
    user_metadata: dict

# =====================================================
# HELPER: Get Supabase headers
# =====================================================
def get_supabase_headers():
    """Get common headers for Supabase API calls."""
    return {
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json"
    }

def get_auth_headers(access_token: str):
    """Get headers with authorization for authenticated requests."""
    return {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }


def require_bearer_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(bearer_scheme),
) -> str:
    """Return a bearer token or raise 401 for missing or malformed credentials."""
    if not credentials or credentials.scheme.lower() != "bearer" or not credentials.credentials.strip():
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    return credentials.credentials.strip()


async def get_user_from_supabase(access_token: str) -> UserResponse:
    """Validate an access token with Supabase and return its user details."""
    if not SUPABASE_AUTH_URL:
        raise HTTPException(status_code=500, detail="Supabase not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY.")

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SUPABASE_AUTH_URL}/user",
            headers=get_auth_headers(access_token)
        )

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    data = response.json()
    return UserResponse(
        id=data["id"],
        email=data["email"],
        user_metadata=data.get("user_metadata", {})
    )

# =====================================================
# ENDPOINTS
# =====================================================

@router.post("/signup", response_model=AuthResponse)
async def signup(request: SignUpRequest):
    """
    Sign up a new user via Supabase Auth.
    
    Creates a new user account and returns access token.
    The app stores no additional signup metadata.
    """
    if not SUPABASE_AUTH_URL:
        raise HTTPException(status_code=500, detail="Supabase not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY.")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SUPABASE_AUTH_URL}/signup",
            headers=get_supabase_headers(),
            json={
                "email": request.email,
                "password": request.password
            }
        )
    
    if response.status_code != 200:
        # Try to parse error response as JSON, with fallback for empty responses
        try:
            error_data = response.json()
            error_message = error_data.get("msg", error_data.get("message", "Signup failed"))
        except Exception:
            # Response body is empty or not valid JSON
            error_message = f"Signup failed with status {response.status_code}"
            print(f"⚠️  Supabase signup error: {response.status_code} - {response.text}")
        
        raise HTTPException(
            status_code=response.status_code,
            detail=error_message
        )
    
    data = response.json()
    return AuthResponse(
        access_token=data["access_token"],
        token_type=data["token_type"],
        user=data["user"]
    )


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """
    Login with email and password via Supabase Auth.
    
    Returns access token on successful authentication.
    """
    if not SUPABASE_AUTH_URL:
        raise HTTPException(status_code=500, detail="Supabase not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY.")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SUPABASE_AUTH_URL}/token?grant_type=password",
            headers=get_supabase_headers(),
            json={
                "email": request.email,
                "password": request.password
            }
        )
    
    if response.status_code != 200:
        # Try to parse error response as JSON, with fallback for empty responses
        try:
            error_data = response.json()
            error_message = error_data.get("msg", error_data.get("message", "Invalid credentials"))
        except Exception:
            # Response body is empty or not valid JSON
            error_message = f"Login failed with status {response.status_code}"
            print(f"⚠️  Supabase login error: {response.status_code} - {response.text}")
        
        raise HTTPException(
            status_code=401,
            detail=error_message
        )
    
    data = response.json()
    return AuthResponse(
        access_token=data["access_token"],
        token_type=data["token_type"],
        user=data["user"]
    )


@router.post("/logout")
async def logout(access_token: str = Depends(require_bearer_token)):
    """
    Logout the current user.
    
    INVALIDATES the access token on Supabase side.
    Requires Authorization header with Bearer token.
    """
    if not SUPABASE_AUTH_URL:
        raise HTTPException(status_code=500, detail="Supabase not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY.")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SUPABASE_AUTH_URL}/logout",
            headers=get_auth_headers(access_token)
        )
    
    if response.status_code != 204:
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_current_user(access_token: str = Depends(require_bearer_token)):
    """
    Get current user information.
    
    Returns user details from Supabase Auth.
    Requires Authorization header with Bearer token.
    
    PRODUCTION NOTE:
    In production, you should verify the JWT signature using JWKS
    instead of just passing the token to Supabase.
    """
    return await get_user_from_supabase(access_token)
