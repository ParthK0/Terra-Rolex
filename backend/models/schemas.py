from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class OnboardingData(BaseModel):
    transport_km_per_month: float = Field(..., ge=0.0, description="Monthly commute distance in km")
    transport_type: str = "car"  # car, electric_car, motorbike, public_transport, bicycle
    diet_type: str = "balanced"  # heavy_meat, balanced, low_meat, vegetarian, vegan
    ac_hours_per_week: float = Field(..., ge=0.0, description="AC hours of operation per week")
    flights_per_year: int = Field(..., ge=0, description="Annual passenger flight count")
    shopping_frequency: str = "average"  # minimalist, average, shopaholic

class LogEntryRequest(BaseModel):
    category: str  # transport, food, energy, flights
    subtype: str   # e.g., car, public_transport, red_meat, plant_based, ac, washing_machine, flight_short, flight_medium, flight_long
    amount: float = Field(..., gt=0.0, description="Activity quantity, must be greater than 0")
    description: Optional[str] = None
    fuel_type: Optional[str] = None # e.g. petrol, diesel, hybrid, electric, none
    region: Optional[str] = None    # e.g. IN-coal-heavy, IN-national-avg, IN-green-grid, Global-average

class LogEntryResponse(BaseModel):
    id: str
    userId: str
    category: str
    subtype: str
    amount: float
    co2_kg: float
    equivalent: str
    timestamp: datetime
    description: Optional[str] = None
    fuel_type: Optional[Optional[str]] = None
    region: Optional[Optional[str]] = None

class ChallengeCompleteRequest(BaseModel):
    challenge_id: str

class ChallengeResponse(BaseModel):
    id: str
    title: str
    description: str
    co2_savings_kg: float
    category: str
    completed: bool = False

class LeaderboardEntry(BaseModel):
    userId: str
    userName: str
    score: float  # Lower emissions is better, or "savings" is better. Let's rank by rolling 7-day CO2 emissions (lower is better)
    streak: int
    teamName: Optional[str] = None

class GroupLeaderboard(BaseModel):
    teamName: str
    score: float  # average per member or aggregate
    memberCount: int

class InsightResponse(BaseModel):
    rolling_score_kg: float
    streak: int
    nudges: List[str]
    living_world_status: str  # thriving, healthy, threatened, degraded

class AuthSignupRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=20)
    password: str = Field(..., min_length=6)

class AuthLoginRequest(BaseModel):
    username: str
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    userId: str
    userName: str
    role: str = "user"

class AdminChallengeCreateRequest(BaseModel):
    id: str
    title: str
    description: str
    co2_savings_kg: float
    category: str

class AdminChallengeUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    co2_savings_kg: Optional[float] = None
    category: Optional[str] = None

class AdminUserTeamUpdateRequest(BaseModel):
    team_name: str

class AdminUserRoleUpdateRequest(BaseModel):
    role: str



