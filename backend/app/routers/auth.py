import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any

from app.models.schemas import AuthSignupRequest, AuthLoginRequest, AuthResponse
from app.services.auth import hash_password, verify_password, create_access_token, decode_access_token
from app.services.firestore_service import get_user_by_username, get_user_profile, update_user_profile

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    profile = get_user_profile(user_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found",
        )
    return profile

@router.post("/signup", response_model=AuthResponse)
def signup(request_body: AuthSignupRequest, request: Request):
    # Check if username exists
    existing = get_user_by_username(request_body.username)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    user_id = str(uuid.uuid4())
    hashed = hash_password(request_body.password)
    
    user_profile = {
        "userId": user_id,
        "userName": request_body.username,
        "password_hash": hashed,
        "streak": 0,
        "baseline_co2": 250.0,
        "teamName": "Floor 3",
        "badges": ["Carbon Onboarder"],
        "completed_challenges": []
    }
    
    update_user_profile(user_id, user_profile)
    
    # Generate token
    token = create_access_token({"sub": user_id})
    
    return AuthResponse(
        access_token=token,
        userId=user_id,
        userName=request_body.username,
        role="admin" if request_body.username.lower() == "admin" else "user"
    )

@router.post("/login", response_model=AuthResponse)
def login(request_body: AuthLoginRequest, request: Request):
    user = get_user_by_username(request_body.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    password_hash = user.get("password_hash")
    if not password_hash:
        password_hash = hash_password(request_body.password)
        update_user_profile(user["userId"], {"password_hash": password_hash})
    
    if not verify_password(request_body.password, password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
        
    token = create_access_token({"sub": user["userId"]})
    
    return AuthResponse(
        access_token=token,
        userId=user["userId"],
        userName=user["userName"],
        role=user.get("role", "admin" if user["userName"].lower() == "admin" else "user")
    )

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    # Remove password hash for security before returning profile data
    profile = current_user.copy()
    if "password_hash" in profile:
        del profile["password_hash"]
    return profile

