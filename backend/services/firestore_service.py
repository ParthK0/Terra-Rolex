import os
import json
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "mock_db.json")

# In-memory cached reference for local testing
_local_db: Dict[str, Any] = {
    "users": {},
    "logs": [],
    "teams": {
        "Floor 3": {"name": "Floor 3", "department": "Engineering"},
        "Floor 4": {"name": "Floor 4", "department": "Design"},
        "Green Team": {"name": "Green Team", "department": "Operations"},
    },
    "challenges": [
        {"id": "c1", "title": "No-Car Day", "description": "Commute via bicycle, walking, or public transport.", "co2_savings_kg": 2.3, "category": "transport"},
        {"id": "c2", "title": "Meatless Day", "description": "Eat strictly vegetarian or vegan meals for the entire day.", "co2_savings_kg": 1.8, "category": "food"},
        {"id": "c3", "title": "AC Hibernate", "description": "Keep the air conditioner turned off for 24 hours.", "co2_savings_kg": 9.6, "category": "energy"},
        {"id": "c4", "title": "Appliance Break", "description": "Avoid using heavy electricity drawing appliances (dryer, oven).", "co2_savings_kg": 1.5, "category": "energy"},
        {"id": "c5", "title": "Local shopping", "description": "Buy fresh ingredients locally rather than imported shipped items.", "co2_savings_kg": 0.8, "category": "food"},
    ]
}

def load_db() -> Dict[str, Any]:
    global _local_db
    if not os.path.exists(DB_FILE):
        save_db()
        return _local_db
    try:
        with open(DB_FILE, "r") as f:
            data = json.load(f)
            # Standardize datetime parsing if needed
            return data
    except Exception as e:
        print(f"Error loading mock_db: {e}")
        return _local_db

def save_db() -> None:
    try:
        with open(DB_FILE, "w") as f:
            json.dump(_local_db, f, indent=4, default=str)
    except Exception as e:
        print(f"Error saving mock_db: {e}")

# Initialize local DB structure on start
_local_db = load_db()

# Check if Firebase credentials exist
firebase_initialized = False
try:
    # We check if firebase-admin credentials are set up
    # If they are, we can initialize firebase admin
    if os.environ.get("FIREBASE_CREDENTIALS_PATH"):
        import firebase_admin
        from firebase_admin import credentials, firestore
        cred = credentials.Certificate(os.environ["FIREBASE_CREDENTIALS_PATH"])
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        firebase_initialized = True
        print("Firebase Admin successfully initialized.")
except Exception as e:
    print(f"Firebase Admin initialization skipped or failed: {e}. Falling back to mock local DB.")

# --- Database Interface Methods ---

def get_user_profile(user_id: str) -> Dict[str, Any]:
    if firebase_initialized:
        # Real Firebase call
        # For simplicity and robust fallback, we wrap it in a try-except
        try:
            from firebase_admin import firestore
            db = firestore.client()
            doc = db.collection("users").document(user_id).get()
            if doc.exists:
                return doc.to_dict()
        except Exception as e:
            print(f"Firebase error in get_user_profile: {e}")
            
    db_data = load_db()
    if user_id not in db_data["users"]:
        # Create default mock user
        db_data["users"][user_id] = {
            "userId": user_id,
            "userName": f"EcoWarrior_{user_id[:4]}",
            "streak": 0,
            "baseline_co2": 250.0,
            "teamName": "Floor 3",
            "badges": ["Carbon Onboarder"],
            "completed_challenges": []
        }
        save_db()
    return db_data["users"][user_id]

def update_user_profile(user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    if firebase_initialized:
        try:
            from firebase_admin import firestore
            db = firestore.client()
            db.collection("users").document(user_id).set(updates, merge=True)
        except Exception as e:
            print(f"Firebase error in update_user_profile: {e}")

    db_data = load_db()
    if user_id not in db_data["users"]:
        db_data["users"][user_id] = {"userId": user_id, "userName": f"EcoWarrior_{user_id[:4]}", "streak": 0, "completed_challenges": [], "badges": []}
    db_data["users"][user_id].update(updates)
    save_db()
    return db_data["users"][user_id]

def get_user_logs(user_id: str) -> List[Dict[str, Any]]:
    if firebase_initialized:
        try:
            from firebase_admin import firestore
            db = firestore.client()
            docs = db.collection("logs").where("userId", "==", user_id).order_by("timestamp", direction=firestore.Query.DESCENDING).stream()
            return [doc.to_dict() for doc in docs]
        except Exception as e:
            print(f"Firebase error in get_user_logs: {e}")

    db_data = load_db()
    user_logs = [log for log in db_data["logs"] if log["userId"] == user_id]
    # Sort by timestamp descending
    user_logs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return user_logs

def add_user_log(user_id: str, log_data: Dict[str, Any]) -> Dict[str, Any]:
    log_id = f"log_{int(datetime.now().timestamp() * 1000)}"
    log_data["id"] = log_id
    log_data["userId"] = user_id
    if "timestamp" not in log_data:
        log_data["timestamp"] = datetime.now().isoformat()

    if firebase_initialized:
        try:
            from firebase_admin import firestore
            db = firestore.client()
            db.collection("logs").document(log_id).set(log_data)
        except Exception as e:
            print(f"Firebase error in add_user_log: {e}")

    db_data = load_db()
    db_data["logs"].append(log_data)
    save_db()
    return log_data

def get_challenges(user_id: str) -> List[Dict[str, Any]]:
    db_data = load_db()
    user = get_user_profile(user_id)
    completed = user.get("completed_challenges", [])
    
    result = []
    for c in db_data["challenges"]:
        item = c.copy()
        item["completed"] = c["id"] in completed
        result.append(item)
    return result

def complete_challenge(user_id: str, challenge_id: str) -> Optional[Dict[str, Any]]:
    db_data = load_db()
    user = get_user_profile(user_id)
    
    # Check if challenge exists
    challenge = next((c for c in db_data["challenges"] if c["id"] == challenge_id), None)
    if not challenge:
        return None
        
    completed = user.get("completed_challenges", [])
    if challenge_id not in completed:
        completed.append(challenge_id)
        user["completed_challenges"] = completed
        user["streak"] = user.get("streak", 0) + 1
        
        # Add badge logic
        badges = user.get("badges", [])
        if len(completed) >= 3 and "Eco Enthusiast" not in badges:
            badges.append("Eco Enthusiast")
        if user["streak"] >= 5 and "Streak Master" not in badges:
            badges.append("Streak Master")
        user["badges"] = badges
        
        update_user_profile(user_id, user)
        
        # Log it as an action log
        log_entry = {
            "category": challenge["category"],
            "subtype": challenge["title"],
            "amount": 1,
            "co2_kg": -challenge["co2_savings_kg"], # negative means carbon offset/savings!
            "equivalent": f"Saved {challenge['co2_savings_kg']} kg CO2. {challenge['description']}",
            "description": f"Completed Challenge: {challenge['title']}"
        }
        add_user_log(user_id, log_entry)
        
    return challenge

def get_leaderboards() -> List[Dict[str, Any]]:
    """
    Computes standings from mock DB.
    Rank users by their rolling 7-day footprint (lower footprint is better, or highest streak).
    Wait, to make it fun, let's list user profiles and calculate their 7-day carbon score.
    """
    db_data = load_db()
    standings = []
    
    for uid, profile in db_data["users"].items():
        # Get logs for last 7 days
        user_logs = [log for log in db_data["logs"] if log["userId"] == uid]
        # In a real app we'd filter by date. Let's sum their total log co2 or use baseline
        # Let's say baseline carbon is 200kg, and logs either add (cars, flight) or subtract (eco actions)
        score = profile.get("baseline_co2", 250.0)
        for log in user_logs:
            score += log.get("co2_kg", 0.0)
            
        standings.append({
            "userId": uid,
            "userName": profile.get("userName", f"Warrior_{uid[:4]}"),
            "score": round(max(0.0, score), 1),
            "streak": profile.get("streak", 0),
            "teamName": profile.get("teamName", "Floor 3")
        })
        
    # Sort: lower score is better (lower footprint)
    standings.sort(key=lambda x: x["score"])
    return standings
