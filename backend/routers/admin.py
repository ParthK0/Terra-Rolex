from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from datetime import datetime, timedelta, timezone
from models.schemas import (
    AdminChallengeCreateRequest, 
    AdminChallengeUpdateRequest,
    AdminUserTeamUpdateRequest, 
    AdminUserRoleUpdateRequest,
    ChallengeResponse, 
    LogEntryResponse
)
from services import firestore_service
from routers.auth import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

def require_admin(current_user: dict = Depends(get_current_user)):
    role = current_user.get("role")
    username = current_user.get("userName", "")
    if role != "admin" and username.lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Administrative privileges required."
        )
    return current_user

# ── Manage Users ───────────────────────────────────────────────────────────────

@router.get("/users")
def get_all_users(admin: dict = Depends(require_admin)):
    try:
        users = firestore_service.get_all_users()
        # Clean password hashes from response for security
        cleaned_users = []
        for u in users:
            u_copy = u.copy()
            if "password_hash" in u_copy:
                del u_copy["password_hash"]
            cleaned_users.append(u_copy)
        return cleaned_users
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users/{user_id}/team")
def update_user_team(
    user_id: str, 
    payload: AdminUserTeamUpdateRequest, 
    admin: dict = Depends(require_admin)
):
    try:
        updated = firestore_service.update_user_profile(user_id, {"teamName": payload.team_name})
        if "password_hash" in updated:
            updated = updated.copy()
            del updated["password_hash"]
        return updated
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/users/{user_id}/role")
def update_user_role(
    user_id: str,
    payload: AdminUserRoleUpdateRequest,
    admin: dict = Depends(require_admin)
):
    if payload.role not in ["admin", "user"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'admin' or 'user'.")
    try:
        updated = firestore_service.update_user_profile(user_id, {"role": payload.role})
        if "password_hash" in updated:
            updated = updated.copy()
            del updated["password_hash"]
        return updated
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/users/{user_id}")
def delete_user(user_id: str, admin: dict = Depends(require_admin)):
    try:
        success = firestore_service.delete_user(user_id)
        if not success:
            raise HTTPException(status_code=404, detail="User not found.")
        return {"success": True, "message": f"User {user_id} and all their logs have been deleted."}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Manage Logs ────────────────────────────────────────────────────────────────

@router.get("/logs")
def get_all_logs(admin: dict = Depends(require_admin)):
    try:
        logs = firestore_service.get_all_logs()
        return logs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics")
def get_all_analytics(admin: dict = Depends(require_admin)):
    try:
        users = firestore_service.get_all_users()
        logs = firestore_service.get_all_logs()
        
        user_team_map = {}
        user_name_map = {}
        for u in users:
            user_team_map[u["userId"]] = u.get("teamName") or "Independent"
            user_name_map[u["userId"]] = u.get("userName") or "Unknown"

        # 1. category_totals
        category_totals = {}
        for log in logs:
            if (log.get("co2_kg") or 0) > 0:
                cat = log.get("category", "other").lower()
                category_totals[cat] = category_totals.get(cat, 0.0) + log["co2_kg"]
        
        for cat in category_totals:
            category_totals[cat] = round(category_totals[cat], 1)

        # 2. top_contributors
        contributor_totals = {}
        for log in logs:
            uid = log.get("userId")
            if uid:
                contributor_totals[uid] = contributor_totals.get(uid, 0.0) + (log.get("co2_kg") or 0)
        
        contributors_list = []
        for uid, total_co2 in contributor_totals.items():
            contributors_list.append({
                "userId": uid,
                "userName": user_name_map.get(uid, "Unknown"),
                "totalCo2": round(total_co2, 1)
            })
        contributors_list.sort(key=lambda x: x["totalCo2"], reverse=True)
        top_contributors = contributors_list[:5]

        # 3. daily_co2_by_team
        daily_co2_by_team = []
        for i in range(6, -1, -1):
            date_dt = datetime.now(timezone.utc) - timedelta(days=i)
            date_str = date_dt.strftime("%Y-%m-%d")
            
            day_data = {"date": date_dt.strftime("%b %d")}
            
            # Find logs for this day
            day_logs = [l for l in logs if l.get("timestamp", "").startswith(date_str)]
            
            for log in day_logs:
                uid = log.get("userId")
                team = user_team_map.get(uid, "Independent")
                day_data[team] = day_data.get(team, 0.0) + (log.get("co2_kg") or 0)
            
            # Round values
            for key in list(day_data.keys()):
                if key != "date":
                    day_data[key] = round(day_data[key], 1)
            
            daily_co2_by_team.append(day_data)

        return {
            "daily_co2_by_team": daily_co2_by_team,
            "category_totals": category_totals,
            "top_contributors": top_contributors
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Manage Challenges ──────────────────────────────────────────────────────────

@router.get("/challenges")
def get_all_challenges_admin(admin: dict = Depends(require_admin)):
    """Return full challenge list without per-user completion status (admin context)."""
    try:
        return firestore_service.get_all_challenges()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/challenges")
def create_challenge(
    payload: AdminChallengeCreateRequest, 
    admin: dict = Depends(require_admin)
):
    try:
        challenge_data = {
            "id": payload.id,
            "title": payload.title,
            "description": payload.description,
            "co2_savings_kg": payload.co2_savings_kg,
            "category": payload.category
        }
        added = firestore_service.add_challenge(challenge_data)
        return added
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/challenges/{challenge_id}")
def update_challenge(
    challenge_id: str, 
    payload: AdminChallengeUpdateRequest, 
    admin: dict = Depends(require_admin)
):
    try:
        updates = {k: v for k, v in payload.dict().items() if v is not None}
        updated = firestore_service.update_challenge(challenge_id, updates)
        if not updated:
            raise HTTPException(status_code=404, detail="Challenge not found.")
        return updated
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/challenges/{challenge_id}")
def delete_challenge(challenge_id: str, admin: dict = Depends(require_admin)):
    try:
        success = firestore_service.delete_challenge(challenge_id)
        if not success:
            raise HTTPException(status_code=404, detail="Challenge not found.")
        return {"success": True, "message": f"Challenge {challenge_id} has been deleted."}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
