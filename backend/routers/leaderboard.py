from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from models.schemas import LeaderboardEntry, GroupLeaderboard
from services.firestore_service import get_leaderboards, load_db
from routers.auth import get_current_user

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])

@router.get("", response_model=List[LeaderboardEntry])
def get_user_leaderboard(filter_period: str = "week"):
    try:
        # Fetch rankings computed from users/logs
        standings = get_leaderboards()
        res = []
        for s in standings:
            res.append(LeaderboardEntry(
                userId=s["userId"],
                userName=s["userName"],
                score=s["score"],
                streak=s["streak"],
                teamName=s["teamName"]
            ))
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/teams", response_model=List[GroupLeaderboard])
def get_team_leaderboard():
    try:
        standings = get_leaderboards()
        teams_data: Dict[str, List[float]] = {}
        
        for s in standings:
            team = s["teamName"] or "Unassigned"
            if team not in teams_data:
                teams_data[team] = []
            teams_data[team].append(s["score"])
            
        res = []
        for team, scores in teams_data.items():
            avg_score = round(sum(scores) / len(scores), 1)
            res.append(GroupLeaderboard(
                teamName=team,
                score=avg_score,
                memberCount=len(scores)
            ))
            
        # Sort teams (lower average score/emissions is better)
        res.sort(key=lambda x: x.score)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
@router.post("/join")
def join_team(team_name: str, current_user: dict = Depends(get_current_user)):
    try:
        from services.firestore_service import update_user_profile
        user_id = current_user["userId"]
        update_user_profile(user_id, {"teamName": team_name})
        return {"success": True, "teamName": team_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
