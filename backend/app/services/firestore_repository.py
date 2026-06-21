import os
from datetime import datetime
from typing import List, Dict, Any, Optional
import firebase_admin
from firebase_admin import credentials, firestore
from app.services.repository import DatabaseRepository

class FirestoreRepository(DatabaseRepository):
    def __init__(self, cred_path: str):
        cred = credentials.Certificate(cred_path)
        # Check if already initialized to avoid ValueError
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
        self.db = firestore.client()

    def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        doc = self.db.collection("users").document(user_id).get()
        if doc.exists:
            return doc.to_dict()
        # Fallback to create default profile if it doesn't exist
        default = {
            "userId": user_id,
            "userName": f"EcoWarrior_{user_id[:4]}",
            "streak": 0,
            "baseline_co2": 250.0,
            "teamName": "Floor 3",
            "badges": ["Carbon Onboarder"],
            "completed_challenges": [],
            "role": "admin" if f"EcoWarrior_{user_id[:4]}".lower() == "admin" else "user"
        }
        self.db.collection("users").document(user_id).set(default)
        return default

    def update_user_profile(self, user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        self.db.collection("users").document(user_id).set(updates, merge=True)
        
        # Invalidate cache if streak/userName/completed_challenges/badges are updated and not setting cached_nudges
        cache_affecting_keys = {"streak", "userName", "completed_challenges", "badges"}
        if any(k in updates for k in cache_affecting_keys) and "cached_nudges" not in updates:
            self.db.collection("users").document(user_id).set({
                "cached_nudges": None,
                "cached_logs_count": -1,
                "cached_streak": -1
            }, merge=True)
            
        return self.get_user_profile(user_id)

    def get_user_logs(self, user_id: str, limit: int = 200, offset: int = 0) -> List[Dict[str, Any]]:
        docs = (
            self.db.collection("logs")
            .where("userId", "==", user_id)
            .order_by("timestamp", direction=firestore.Query.DESCENDING)
            .offset(offset)
            .limit(limit)
            .stream()
        )
        return [doc.to_dict() for doc in docs]

    def add_user_log(self, user_id: str, log_data: Dict[str, Any]) -> Dict[str, Any]:
        log_id = f"log_{int(datetime.now().timestamp() * 1000)}"
        log_data["id"] = log_id
        log_data["userId"] = user_id
        if "timestamp" not in log_data:
            log_data["timestamp"] = datetime.now().isoformat()

        self.db.collection("logs").document(log_id).set(log_data)
        
        # Clear cached nudges in Firestore profile to force regeneration
        self.db.collection("users").document(user_id).set({
            "cached_nudges": None,
            "cached_logs_count": -1,
            "cached_streak": -1
        }, merge=True)
        
        return log_data

    def get_challenges(self, user_id: str) -> List[Dict[str, Any]]:
        user = self.get_user_profile(user_id)
        completed = user.get("completed_challenges", [])
        
        docs = self.db.collection("challenges").stream()
        result = []
        for doc in docs:
            c = doc.to_dict()
            c["completed"] = c.get("id") in completed
            result.append(c)
        return result

    def complete_challenge(self, user_id: str, challenge_id: str) -> Optional[Dict[str, Any]]:
        user = self.get_user_profile(user_id)
        
        docs = self.db.collection("challenges").where("id", "==", challenge_id).limit(1).stream()
        challenge = None
        for doc in docs:
            challenge = doc.to_dict()
            break
            
        if not challenge:
            return None
            
        completed = user.get("completed_challenges", [])
        if challenge_id not in completed:
            completed.append(challenge_id)
            user["completed_challenges"] = completed
            user["streak"] = user.get("streak", 0) + 1
            
            badges = user.get("badges", [])
            if len(completed) >= 3 and "Eco Enthusiast" not in badges:
                badges.append("Eco Enthusiast")
            if user["streak"] >= 5 and "Streak Master" not in badges:
                badges.append("Streak Master")
            user["badges"] = badges
            
            self.update_user_profile(user_id, user)
            
            log_entry = {
                "category": challenge.get("category"),
                "subtype": challenge.get("title"),
                "amount": 1,
                "co2_kg": -challenge.get("co2_savings_kg", 0),
                "equivalent": f"Saved {challenge.get('co2_savings_kg', 0)} kg CO2. {challenge.get('description', '')}",
                "description": f"Completed Challenge: {challenge.get('title')}"
            }
            self.add_user_log(user_id, log_entry)
            
        return challenge

    def get_leaderboards(self) -> List[Dict[str, Any]]:
        from app.services.co2_engine import calculate_co2
        # A simple implementation for Firebase; aggregate scores locally for now
        users_docs = self.db.collection("users").stream()
        standings = []
        challenges = self.get_all_challenges()
        
        for doc in users_docs:
            profile = doc.to_dict()
            uid = profile.get("userId", doc.id)
            completed = profile.get("completed_challenges", [])
            
            logs_docs = self.db.collection("logs").where("userId", "==", uid).stream()
            score = profile.get("baseline_co2", 250.0)
            for log in logs_docs:
                log_data = log.to_dict()
                co2_val = log_data.get("co2_kg", 0.0)
                desc = log_data.get("description", "")
                
                # Check for challenge offsets
                if co2_val < 0 or desc.startswith("Completed Challenge:"):
                    title = log_data.get("subtype")
                    challenge = next((c for c in challenges if c.get("title") == title or c.get("id") == title), None)
                    if challenge and challenge.get("id") in completed:
                        score -= abs(challenge.get("co2_savings_kg", 0.0))
                else:
                    # Recalculate regular emissions
                    recalc_val, _ = calculate_co2(
                        log_data.get("category", ""),
                        log_data.get("subtype", ""),
                        float(log_data.get("amount", 0.0)),
                        log_data.get("fuel_type"),
                        log_data.get("region")
                    )
                    score += recalc_val
                
            standings.append({
                "userId": uid,
                "userName": profile.get("userName", f"Warrior_{uid[:4]}"),
                "score": round(max(0.0, score), 1),
                "streak": profile.get("streak", 0),
                "teamName": profile.get("teamName", "Floor 3")
            })
            
        standings.sort(key=lambda x: x["score"])
        return standings

    def get_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        docs = self.db.collection("users").where("userName", "==", username).limit(1).stream()
        for doc in docs:
            data = doc.to_dict()
            if "userId" not in data:
                data["userId"] = doc.id
            return data
            
        # Case insensitive
        docs_all = self.db.collection("users").stream()
        for doc in docs_all:
            data = doc.to_dict()
            if data.get("userName", "").lower() == username.lower():
                if "userId" not in data:
                    data["userId"] = doc.id
                return data
        return None

    def get_all_users(self) -> List[Dict[str, Any]]:
        docs = self.db.collection("users").stream()
        return [doc.to_dict() for doc in docs]

    def delete_user(self, user_id: str) -> bool:
        self.db.collection("users").document(user_id).delete()
        logs_ref = self.db.collection("logs").where("userId", "==", user_id).stream()
        for log in logs_ref:
            log.reference.delete()
        return True

    def get_all_logs(self) -> List[Dict[str, Any]]:
        docs = self.db.collection("logs").order_by("timestamp", direction=firestore.Query.DESCENDING).stream()
        return [doc.to_dict() for doc in docs]

    def add_challenge(self, challenge_data: Dict[str, Any]) -> Dict[str, Any]:
        self.db.collection("challenges").document(challenge_data["id"]).set(challenge_data)
        return challenge_data

    def update_challenge(self, challenge_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        self.db.collection("challenges").document(challenge_id).set(updates, merge=True)
        doc = self.db.collection("challenges").document(challenge_id).get()
        return doc.to_dict() if doc.exists else None

    def delete_challenge(self, challenge_id: str) -> bool:
        self.db.collection("challenges").document(challenge_id).delete()
        return True

    def get_all_challenges(self) -> List[Dict[str, Any]]:
        docs = self.db.collection("challenges").stream()
        return [doc.to_dict() for doc in docs]
