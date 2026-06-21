from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded
import uvicorn
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()
# Import routers
from app.routers import log, insights, actions, leaderboard, auth, admin

# Rate limiter — protects auth endpoints from brute-force
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="TerraRolex Backend API",
    description="Carbon footprint tracking, gamification, and contextual Gemini insights API.",
    version="1.0.0"
)

# Attach rate limiter state and error handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Configure CORS — restrict to known frontend origins.
# In production, set ALLOWED_ORIGINS env var as a comma-separated list of domains.
_raw_origins = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:4173"  # Vite dev + preview defaults
)
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "x-user-id", "Authorization"],
)

# Mount routers
app.include_router(auth.router)
app.include_router(log.router)
app.include_router(insights.router)
app.include_router(actions.router)
app.include_router(leaderboard.router)
app.include_router(admin.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": "TerraRolex Carbon Footprint API",
        "version": "1.0.0",
        "firebase_configured": os.environ.get("FIREBASE_CREDENTIALS_PATH") is not None,
        "gemini_configured": os.environ.get("GEMINI_API_KEY") is not None
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
