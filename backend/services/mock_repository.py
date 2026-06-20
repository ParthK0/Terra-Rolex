import os
import json
import threading
from datetime import datetime
from typing import List, Dict, Any, Optional
from services.repository import DatabaseRepository

DB_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "mock_db.json")

class MockRepository(DatabaseRepository):
    def __init__(self):
        self._db_lock = threading.Lock()
        self._local_db = {
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
        self.load_db()

    def load_db(self) -> Dict[str, Any]:
        with self._db_lock:
            if not os.path.exists(DB_FILE):
                try:
                    with open(DB_FILE, "w") as f:
                        json.dump(self._local_db, f, indent=4, default=str)
                except Exception as e:
                    print(f"Error initializing mock_db: {e}")
                return self._local_db
            try:
                with open(DB_FILE, "r") as f:
                    data = json.load(f)
                    self._local_db = data
                    return data
            except Exception as e:
                print(f"Error loading mock_db: {e}")
                return self._local_db

    def save_db(self) -> None:
        with self._db_lock:
            try:
                with open(DB_FILE, "w") as f:
                    json.dump(self._local_db, f, indent=4, default=str)
            except Exception as e:
                print(f"Error saving mock_db: {e}")

    def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        if user_id not in self._local_db["users"]:
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
            self._local_db["users"][user_id] = default
            self.save_db()
        return self._local_db["users"][user_id]

    def update_user_profile(self, user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        if user_id not in self._local_db["users"]:
            self._local_db["users"][user_id] = {
                "userId": user_id,
                "userName": f"EcoWarrior_{user_id[:4]}",
                "streak": 0,
                "completed_challenges": [],
                "badges": [],
                "role": "admin" if f"EcoWarrior_{user_id[:4]}".lower() == "admin" else "user"
            }
        
        self._local_db["users"][user_id].update(updates)
        if "userName" in updates:
            username = updates["userName"]
            self._local_db["users"][user_id]["role"] = "admin" if username.lower() == "admin" else updates.get("role", self._local_db["users"][user_id].get("role", "user"))
        elif "role" in updates:
            self._local_db["users"][user_id]["role"] = updates["role"]

        cache_affecting_keys = {"streak", "userName", "completed_challenges", "badges"}
        if any(k in updates for k in cache_affecting_keys) and "cached_nudges" not in updates:
            self._local_db["users"][user_id]["cached_nudges"] = None
            self._local_db["users"][user_id]["cached_logs_count"] = -1
            self._local_db["users"][user_id]["cached_streak"] = -1

        self.save_db()
        return self._local_db["users"][user_id]

    def get_user_logs(self, user_id: str, limit: int = 200, offset: int = 0) -> List[Dict[str, Any]]:
        user_logs = [log for log in self._local_db["logs"] if log.get("userId") == user_id]
        user_logs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return user_logs[offset: offset + limit]

    def add_user_log(self, user_id: str, log_data: Dict[str, Any]) -> Dict[str, Any]:
        log_id = f"log_{int(datetime.now().timestamp() * 1000)}"
        log_data["id"] = log_id
        log_data["userId"] = user_id
        if "timestamp" not in log_data:
            log_data["timestamp"] = datetime.now().isoformat()

        self._local_db["logs"].append(log_data)
        
        # Clear cached nudges to force regeneration
        profile = self.get_user_profile(user_id)
        profile["cached_nudges"] = None
        profile["cached_logs_count"] = -1
        profile["cached_streak"] = -1
        self._local_db["users"][user_id] = profile
        
        self.save_db()
        return log_data

    def get_challenges(self, user_id: str) -> List[Dict[str, Any]]:
        user = self.get_user_profile(user_id)
        completed = user.get("completed_challenges", [])
        
        result = []
        for c in self._local_db["challenges"]:
            item = c.copy()
            item["completed"] = c["id"] in completed
            result.append(item)
        return result

    def complete_challenge(self, user_id: str, challenge_id: str) -> Optional[Dict[str, Any]]:
        user = self.get_user_profile(user_id)
        challenge = next((c for c in self._local_db["challenges"] if c["id"] == challenge_id), None)
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
                "category": challenge["category"],
                "subtype": challenge["title"],
                "amount": 1,
                "co2_kg": -challenge["co2_savings_kg"],
                "equivalent": f"Saved {challenge['co2_savings_kg']} kg CO2. {challenge['description']}",
                "description": f"Completed Challenge: {challenge['title']}"
            }
            self.add_user_log(user_id, log_entry)
            
        return challenge

    def get_leaderboards(self) -> List[Dict[str, Any]]:
        from services.co2_engine import calculate_co2
        standings = []
        challenges = self.get_all_challenges()
        
        for uid, profile in self._local_db["users"].items():
            user_logs = [log for log in self._local_db["logs"] if log.get("userId") == uid]
            completed = profile.get("completed_challenges", [])
            score = profile.get("baseline_co2", 250.0)
            
            for log in user_logs:
                co2_val = log.get("co2_kg", 0.0)
                desc = log.get("description", "")
                
                # Check for challenge offsets
                if co2_val < 0 or desc.startswith("Completed Challenge:"):
                    title = log.get("subtype")
                    challenge = next((c for c in challenges if c.get("title") == title or c.get("id") == title), None)
                    if challenge and challenge.get("id") in completed:
                        score -= abs(challenge.get("co2_savings_kg", 0.0))
                else:
                    # Recalculate regular emissions
                    recalc_val, _ = calculate_co2(
                        log.get("category", ""),
                        log.get("subtype", ""),
                        float(log.get("amount", 0.0)),
                        log.get("fuel_type"),
                        log.get("region")
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
        for u in self._local_db["users"].values():
            if u.get("userName", "").lower() == username.lower():
                return u
        return None

    def get_all_users(self) -> List[Dict[str, Any]]:
        return list(self._local_db["users"].values())

    def delete_user(self, user_id: str) -> bool:
        if user_id in self._local_db["users"]:
            del self._local_db["users"][user_id]
            self._local_db["logs"] = [log for log in self._local_db["logs"] if log.get("userId") != user_id]
            self.save_db()
            return True
        return False

    def get_all_logs(self) -> List[Dict[str, Any]]:
        logs = list(self._local_db["logs"])
        logs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return logs

    def add_challenge(self, challenge_data: Dict[str, Any]) -> Dict[str, Any]:
        self._local_db["challenges"].append(challenge_data)
        self.save_db()
        return challenge_data

    def update_challenge(self, challenge_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        for c in self._local_db["challenges"]:
            if c["id"] == challenge_id:
                c.update(updates)
                self.save_db()
                return c
        return None

    def delete_challenge(self, challenge_id: str) -> bool:
        initial_len = len(self._local_db["challenges"])
        self._local_db["challenges"] = [c for c in self._local_db["challenges"] if c["id"] != challenge_id]
        if len(self._local_db["challenges"]) < initial_len:
            self.save_db()
            return True
        return False

    def get_all_challenges(self) -> List[Dict[str, Any]]:
        return self._local_db["challenges"]
