from fastapi import APIRouter, Header, HTTPException
from models.schemas import InsightResponse, OnboardingData
from services.firestore_service import get_user_profile, get_user_logs, update_user_profile
from services.gemini_service import generate_insights_with_gemini
from services.co2_engine import calculate_onboarding_baseline

router = APIRouter(prefix="/insights", tags=["Insights"])

@router.get("", response_model=InsightResponse)
def get_insights(x_user_id: str = Header(default="default_user")):
    try:
        profile = get_user_profile(x_user_id)
        logs = get_user_logs(x_user_id)
        
        # Calculate rolling 7-day footprint score
        # For our local simulation, we can sum co2 from recent logs.
        # Include baseline daily emissions for days with no logs.
        baseline = profile.get("baseline_co2", 250.0) # monthly baseline (e.g. 250kg)
        daily_baseline = baseline / 30.0
        
        # Start with a week of baseline
        rolling_score = daily_baseline * 7
        
        # Adjust with logs (positive adding carbon, negative subtracting/saving carbon)
        for log in logs[:15]:  # examine last 15 entries
            # Check if within last 7 days (or simply sum last 5 entries as a simulation)
            rolling_score += log.get("co2_kg", 0.0)
            
        rolling_score = max(0.0, rolling_score)
        
        # Determine status of the living world globe
        if rolling_score < 40:
            status = "thriving"
        elif rolling_score < 100:
            status = "healthy"
        elif rolling_score < 200:
            status = "threatened"
        else:
            status = "degraded"
            
        # Call Gemini insight engine
        nudges = generate_insights_with_gemini(logs, rolling_score, profile.get("streak", 0))
        
        return InsightResponse(
            rolling_score_kg=round(rolling_score, 1),
            streak=profile.get("streak", 0),
            nudges=nudges,
            living_world_status=status
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/onboarding")
def save_onboarding_baseline(data: OnboardingData, x_user_id: str = Header(default="default_user")):
    try:
        monthly_baseline, benchmark_context = calculate_onboarding_baseline(
            transport_km=data.transport_km_per_month,
            transport_type=data.transport_type,
            diet_type=data.diet_type,
            ac_hours=data.ac_hours_per_week,
            flights_count=data.flights_per_year,
            shopping_freq=data.shopping_frequency
        )
        
        # Save baseline to user profile
        update_user_profile(x_user_id, {
            "baseline_co2": monthly_baseline,
            "transport_type": data.transport_type,
            "diet_type": data.diet_type,
            "ac_hours_per_week": data.ac_hours_per_week,
            "flights_per_year": data.flights_per_year,
            "shopping_frequency": data.shopping_frequency
        })
        
        return {
            "monthly_baseline_kg": monthly_baseline,
            "annual_tonnes": round((monthly_baseline * 12) / 1000, 2),
            "benchmark_context": benchmark_context
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
