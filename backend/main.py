from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Import routers
from routers import log, insights, actions, leaderboard

app = FastAPI(
    title="Terra-rolex Backend API",
    description="Carbon footprint tracking, gamification, and contextual Gemini insights API.",
    version="1.0.0"
)

# Configure CORS for local React/Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development, allow all. In production, restrict to frontend domain.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(log.router)
app.include_router(insights.router)
app.include_router(actions.router)
app.include_router(leaderboard.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": "Terra-rolex Carbon Footprint API",
        "version": "1.0.0",
        "firebase_configured": os.environ.get("FIREBASE_CREDENTIALS_PATH") is not None,
        "gemini_configured": os.environ.get("GEMINI_API_KEY") is not None
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
