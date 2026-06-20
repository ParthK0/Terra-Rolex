import os
from typing import List, Dict, Any, Optional
from services.repository import DatabaseRepository
from services.mock_repository import MockRepository
from services.firestore_repository import FirestoreRepository

# Global repository instance
_repo: DatabaseRepository = None

def get_repository() -> DatabaseRepository:
    global _repo
    if _repo is not None:
        return _repo
        
    cred_path = os.environ.get("FIREBASE_CREDENTIALS_PATH")
    if cred_path and os.path.exists(cred_path):
        try:
            _repo = FirestoreRepository(cred_path)
            print("Firebase Admin successfully initialized via FirestoreRepository.")
            return _repo
        except Exception as e:
            print(f"Firebase Admin initialization failed: {e}. Falling back to MockRepository.")
            
    # Fallback to local mock database
    _repo = MockRepository()
    return _repo

# --- Facade Interface Methods ---
# These expose the exact same interface as the old firestore_service.py
# so that routers do not need to be refactored.

def get_user_profile(user_id: str) -> Dict[str, Any]:
    return get_repository().get_user_profile(user_id)

def update_user_profile(user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    return get_repository().update_user_profile(user_id, updates)

def get_user_logs(user_id: str, limit: int = 200, offset: int = 0) -> List[Dict[str, Any]]:
    return get_repository().get_user_logs(user_id, limit, offset)

def add_user_log(user_id: str, log_data: Dict[str, Any]) -> Dict[str, Any]:
    return get_repository().add_user_log(user_id, log_data)

def get_challenges(user_id: str) -> List[Dict[str, Any]]:
    return get_repository().get_challenges(user_id)

def complete_challenge(user_id: str, challenge_id: str) -> Optional[Dict[str, Any]]:
    return get_repository().complete_challenge(user_id, challenge_id)

def get_leaderboards() -> List[Dict[str, Any]]:
    return get_repository().get_leaderboards()

def get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    return get_repository().get_user_by_username(username)

def get_all_users() -> List[Dict[str, Any]]:
    return get_repository().get_all_users()

def delete_user(user_id: str) -> bool:
    return get_repository().delete_user(user_id)

def get_all_logs() -> List[Dict[str, Any]]:
    return get_repository().get_all_logs()

def add_challenge(challenge_data: Dict[str, Any]) -> Dict[str, Any]:
    return get_repository().add_challenge(challenge_data)

def update_challenge(challenge_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    return get_repository().update_challenge(challenge_id, updates)

def delete_challenge(challenge_id: str) -> bool:
    return get_repository().delete_challenge(challenge_id)

def get_all_challenges() -> List[Dict[str, Any]]:
    return get_repository().get_all_challenges()
