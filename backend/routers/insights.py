from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timedelta, timezone
from models.schemas import InsightResponse, OnboardingData
from services.firestore_service import get_user_profile, get_user_logs, update_user_profile
from services.gemini_service import generate_insights_with_gemini
from services.co2_engine import calculate_onboarding_baseline
from routers.auth import get_current_user

router = APIRouter(prefix="/insights", tags=["Insights"])

@router.get("", response_model=InsightResponse)
def get_insights(current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["userId"]
        profile = get_user_profile(user_id)
        logs = get_user_logs(user_id)
        
        # Calculate rolling 7-day footprint score
        # For our local simulation, we can sum co2 from recent logs.
        # Include baseline daily emissions for days with no logs.
        baseline = profile.get("baseline_co2", 250.0) # monthly baseline (e.g. 250kg)
        daily_baseline = baseline / 30.0
        
        # Calculate rolling 7-day footprint score using real date-filtered logs
        cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        recent_logs = [log for log in logs if log.get("timestamp", "") >= cutoff]

        # Start with a week of baseline
        rolling_score = daily_baseline * 7

        # Adjust with real recent logs (positive adds carbon, negative saves carbon)
        for log in recent_logs:
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
            
        # Caching logic to prevent calling Gemini live on every dashboard reload.
        cached_nudges = profile.get("cached_nudges")
        cached_logs_count = profile.get("cached_logs_count")
        cached_streak = profile.get("cached_streak")
        
        current_streak = profile.get("streak", 0)
        logs_count = len(logs)
        
        if (
            cached_nudges is not None
            and cached_logs_count == logs_count 
            and cached_streak == current_streak
        ):
            nudges = cached_nudges
        else:
            # Generate new insights
            nudges = generate_insights_with_gemini(logs, rolling_score, current_streak)
            # Update user profile with cached data
            update_user_profile(user_id, {
                "cached_nudges": nudges,
                "cached_logs_count": logs_count,
                "cached_streak": current_streak
            })
        
        return InsightResponse(
            rolling_score_kg=round(rolling_score, 1),
            streak=current_streak,
            nudges=nudges,
            living_world_status=status
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/onboarding")
def save_onboarding_baseline(data: OnboardingData, current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["userId"]
        monthly_baseline, benchmark_context = calculate_onboarding_baseline(
            transport_km=data.transport_km_per_month,
            transport_type=data.transport_type,
            diet_type=data.diet_type,
            ac_hours=data.ac_hours_per_week,
            flights_count=data.flights_per_year,
            shopping_freq=data.shopping_frequency
        )
        
        # Save baseline to user profile
        update_user_profile(user_id, {
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
