import os
import json
from typing import List, Dict, Any

SYSTEM_PROMPT = """
You are Antigravity's Carbon Coach, an expert in contextualizing emissions.
Your goal is to make invisible carbon data visible, highly relatable, and emotionally engaging.
Do not give generic advice like 'fly less' or 'use LED bulbs'. Instead, make direct, specific comparisons based on the user's logged data and habits.
Examples:
- "You flew Delhi–Mumbai last week. That single trip offset 6 weeks of the eco-actions you completed this month. If you take that route 3x a year, it represents 35% of your total footprint."
- "Your meatless day saved 1.8 kg CO2. That is equivalent to charging your smartphone every day for an entire year."
- "Running your AC for 8 hours generated 9.6 kg CO2. That is equivalent to burning 4.8 kg of coal. Consider setting a timer."
Keep it brief: exactly 3 nudges, each 1-2 sentences. Return them as a JSON list of strings.

CRITICAL: You MUST respect the "User current streak" parameter. If the user's current streak is 0 days, do NOT claim their streak is active or congratulate them on an active streak. Instead, nudge them to log their first entry or complete an action to kickstart their streak.
"""

def generate_mock_insights(user_logs: List[Dict[str, Any]], rolling_score: float, streak: int) -> List[str]:
    """
    Generates smart, personalized mock insights based on logged activity.
    """
    insights = []
    
    # Analyze user logs
    has_flights = False
    has_high_car = False
    has_high_meat = False
    has_high_ac = False
    
    for log in user_logs:
        cat = log.get("category", "").lower()
        sub = log.get("subtype", "").lower()
        amt = log.get("amount", 0)
        
        if cat == "flights":
            has_flights = True
        elif cat == "transport" and sub == "car" and amt > 30:
            has_high_car = True
        elif cat == "food" and sub == "heavy_meat":
            has_high_meat = True
        elif cat == "energy" and sub == "ac" and amt > 4:
            has_high_ac = True

    # Nudge 1: Flight focus or general benchmark
    if has_flights:
        insights.append(
            "Your Delhi-Mumbai flight generated 90 kg CO2. That single trip offset 6 weeks of the eco-actions you completed this month. If you take that route 3x a year, it represents 35% of your annual footprint."
        )
    elif rolling_score > 100:
        insights.append(
            f"Your 7-day footprint is {rolling_score:.1f} kg CO2. At this rate, your annual footprint will be {((rolling_score * 52) / 1000):.1f} tons, exceeding the average Indian urban resident (1.8 tons)."
        )
    else:
        insights.append(
            f"Your rolling footprint is currently {rolling_score:.1f} kg CO2, matching the low-carbon target for global climate goals. Keep keeping it clean!"
        )

    # Nudge 2: Daily habits (transport or food)
    if has_high_car:
        insights.append(
            "Your daily petrol car commute generates substantial CO2. Swapping just 1 day a week to public transit or cycling saves 8.4 kg CO2—equivalent to charging a laptop for 6 months."
        )
    elif has_high_meat:
        insights.append(
            "Your logged beef/heavy meat meal cost 3.0 kg CO2. Switching to a plant-based alternative just once a week saves enough emissions to power a household fan for 300 hours."
        )
    else:
        if streak > 0:
            insights.append(
                f"You completed meatless and green commute days this week! Your {streak}-day streak is active, and the virtual sky is clearing up."
            )
        else:
            insights.append(
                "Log your first eco-friendly choice today to kick off your streak and start clearing up the virtual sky!"
            )

    # Nudge 3: Energy usage / AC
    if has_high_ac:
        insights.append(
            "Your AC was running for a long stretch. Running AC for 8 hours generates 9.6 kg CO2—equivalent to burning 4.8 kg of coal. Consider setting a timer to turn off at 3 AM."
        )
    else:
        if streak > 0:
            insights.append(
                f"Your current streak is {streak} days. Every day you log without high-energy appliance runs, the virtual sky in your dashboard turns a shade cleaner."
            )
        else:
            insights.append(
                "Every day you log without high-energy appliance runs, the virtual sky in your dashboard turns a shade cleaner. Start tracking today!"
            )

    # Make sure we return exactly 3
    while len(insights) < 3:
        insights.append("Keep logging your daily actions to unlock deeper AI insights about your environmental impact.")
        
    return insights[:3]

def generate_insights_with_gemini(user_logs: List[Dict[str, Any]], rolling_score: float, streak: int) -> List[str]:
    """
    Attempts to call Gemini API, falls back to personalized mock generator if key is missing or calls fail.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return generate_mock_insights(user_logs, rolling_score, streak)
        
    try:
        from google import genai
        from google.genai import types
        
        client = genai.Client(api_key=api_key)
        
        # Summarize last 15 logs
        logs_text = ""
        for log in user_logs[-15:]:
            logs_text += f"- Category: {log.get('category')}, Subtype: {log.get('subtype')}, Amount: {log.get('amount')}, CO2: {log.get('co2_kg')}kg\n"
            
        prompt = f"""
        User 7-day rolling footprint: {rolling_score} kg CO2.
        User current streak: {streak} days.
        Recent logged activities:
        {logs_text if logs_text else "No recent activities logged."}
        
        Generate exactly 3 specific, context-rich nudges matching the system guidelines.
        """
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                response_mime_type="application/json",
                response_schema=types.Schema(
                    type=types.Type.ARRAY,
                    items=types.Schema(type=types.Type.STRING)
                )
            )
        )
        
        nudges = json.loads(response.text)
        if isinstance(nudges, list) and len(nudges) >= 3:
            return nudges[:3]
        return generate_mock_insights(user_logs, rolling_score, streak)
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return generate_mock_insights(user_logs, rolling_score, streak)

def generate_dynamic_challenge(user_logs: List[Dict[str, Any]]) -> Dict[str, Any]:
    import uuid
    challenge_id = f"dyn_c_{uuid.uuid4().hex[:6]}"
    
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        try:
            from google import genai
            from google.genai import types
            
            client = genai.Client(api_key=api_key)
            logs_text = ""
            for log in user_logs[-10:]:
                logs_text += f"- {log.get('category')}: {log.get('subtype')} ({log.get('amount')})\n"
                
            prompt = f"""
            Based on these recent user activities:
            {logs_text if logs_text else "None"}
            
            Create 1 personalized carbon-saving challenge. 
            Return JSON with exactly these keys: "title", "description", "co2_savings_kg" (float), "category" (one of transport, food, energy).
            Keep it highly specific.
            """
            
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "title": types.Schema(type=types.Type.STRING),
                            "description": types.Schema(type=types.Type.STRING),
                            "co2_savings_kg": types.Schema(type=types.Type.NUMBER),
                            "category": types.Schema(type=types.Type.STRING)
                        }
                    )
                )
            )
            data = json.loads(response.text)
            return {
                "id": challenge_id,
                "title": data.get("title", "AI Mystery Challenge"),
                "description": data.get("description", "A special challenge generated just for you!"),
                "co2_savings_kg": float(data.get("co2_savings_kg", 2.0)),
                "category": data.get("category", "other")
            }
        except Exception as e:
            print("Gemini challenge generation failed:", e)
            
    # Fallback personalized challenge
    return {
        "id": challenge_id,
        "title": "Digital Detox Hour",
        "description": "Turn off all screens and wifi for 1 hour to save energy and reduce baseline grid load.",
        "co2_savings_kg": 0.5,
        "category": "energy"
    }
