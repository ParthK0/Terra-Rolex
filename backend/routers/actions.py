from fastapi import APIRouter, Header, HTTPException
from typing import List
from models.schemas import ChallengeResponse, ChallengeCompleteRequest
from services.firestore_service import get_challenges, complete_challenge, get_user_profile
import os

router = APIRouter(prefix="/actions", tags=["Actions"])

@router.get("", response_model=List[ChallengeResponse])
def fetch_challenges(x_user_id: str = Header(default="default_user")):
    try:
        challenges = get_challenges(x_user_id)
        return [ChallengeResponse(**c) for c in challenges]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/complete")
def finish_challenge(request: ChallengeCompleteRequest, x_user_id: str = Header(default="default_user")):
    try:
        challenge = complete_challenge(x_user_id, request.challenge_id)
        if not challenge:
            raise HTTPException(status_code=404, detail="Challenge not found.")
            
        profile = get_user_profile(x_user_id)
        streak = profile.get("streak", 0)
        co2_saved = challenge["co2_savings_kg"]
        
        # Call Gemini for a direct reaction, or generate a high-context reaction.
        api_key = os.environ.get("GEMINI_API_KEY")
        reaction_msg = ""
        if api_key:
            try:
                from google import genai
                client = genai.Client(api_key=api_key)
                prompt = f"Write a single sentence congratulating a user for completing the '{challenge['title']}' challenge, saving {co2_saved} kg CO2. Make a specific context comparison (e.g. charging phones, running a bulb). Keep it punchy and energetic. Current streak: {streak} days."
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt
                )
                reaction_msg = response.text.strip()
            except Exception:
                pass
                
        if not reaction_msg:
            # Fallback high-context message
            if challenge["id"] == "c1": # No-Car Day
                reaction_msg = f"Incredible! By biking or walking today, you saved {co2_saved} kg CO2—enough to offset charging your phone every single night for the next 8 months! Keep it up, your streak is now {streak}!"
            elif challenge["id"] == "c2": # Meatless Day
                reaction_msg = f"Awesome effort! Going meatless today saved {co2_saved} kg CO2. That's equivalent to planting a tree seedling and letting it grow for 10 years! Streak: {streak} days."
            elif challenge["id"] == "c3": # AC Hibernate
                reaction_msg = f"Fantastic! Shutting off the AC saved {co2_saved} kg CO2—which is equivalent to taking a passenger car off the road for 50 kilometers! Streak: {streak}."
            else:
                reaction_msg = f"Success! You completed '{challenge['title']}' and saved {co2_saved} kg CO2. Equivalent to keeping a 10W lightbulb off for {int(co2_saved * 100)} hours. Streak: {streak} days!"
                
        return {
            "success": True,
            "streak": streak,
            "reaction": reaction_msg
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
