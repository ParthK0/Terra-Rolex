from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class DatabaseRepository(ABC):
    @abstractmethod
    def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    def update_user_profile(self, user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    def get_user_logs(self, user_id: str, limit: int = 200, offset: int = 0) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def add_user_log(self, user_id: str, log_data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    def get_challenges(self, user_id: str) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def complete_challenge(self, user_id: str, challenge_id: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    def get_leaderboards(self) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def get_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    def get_all_users(self) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def delete_user(self, user_id: str) -> bool:
        pass

    @abstractmethod
    def get_all_logs(self) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def add_challenge(self, challenge_data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    def update_challenge(self, challenge_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    def delete_challenge(self, challenge_id: str) -> bool:
        pass

    @abstractmethod
    def get_all_challenges(self) -> List[Dict[str, Any]]:
        pass
