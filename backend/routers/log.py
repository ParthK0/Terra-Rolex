from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from models.schemas import LogEntryRequest, LogEntryResponse
from services.co2_engine import calculate_co2
from services.firestore_service import add_user_log, get_user_logs
from datetime import datetime
from routers.auth import get_current_user

router = APIRouter(prefix="/log", tags=["Logs"])

@router.post("", response_model=LogEntryResponse)
def create_log(request: LogEntryRequest, current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["userId"]
        co2_kg, equivalent = calculate_co2(
            request.category, 
            request.subtype, 
            request.amount, 
            request.fuel_type, 
            request.region
        )
        
        log_data = {
            "category": request.category,
            "subtype": request.subtype,
            "amount": request.amount,
            "co2_kg": co2_kg,
            "equivalent": equivalent,
            "description": request.description or f"Logged {request.subtype} ({request.amount} unit(s))",
            "timestamp": datetime.now().isoformat(),
            "fuel_type": request.fuel_type,
            "region": request.region
        }
        
        saved_log = add_user_log(user_id, log_data)
        return LogEntryResponse(
            id=saved_log["id"],
            userId=saved_log["userId"],
            category=saved_log["category"],
            subtype=saved_log["subtype"],
            amount=saved_log["amount"],
            co2_kg=saved_log["co2_kg"],
            equivalent=saved_log["equivalent"],
            description=saved_log.get("description"),
            timestamp=datetime.fromisoformat(saved_log["timestamp"]),
            fuel_type=saved_log.get("fuel_type"),
            region=saved_log.get("region")
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("", response_model=List[LogEntryResponse])
def get_logs(
    user_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    limit: int = 50,
    offset: int = 0
):
    try:
        session_user_id = current_user["userId"]
        target_user_id = user_id or session_user_id
        
        is_admin = current_user.get("role") == "admin"
        if target_user_id != session_user_id and not is_admin:
            raise HTTPException(status_code=403, detail="Forbidden: You cannot access another user's logs.")
            
        logs = get_user_logs(target_user_id)
        paginated = logs[offset: offset + limit]
        res = []
        for l in paginated:
            res.append(LogEntryResponse(
                id=l["id"],
                userId=l["userId"],
                category=l["category"],
                subtype=l["subtype"],
                amount=l["amount"],
                co2_kg=l["co2_kg"],
                equivalent=l["equivalent"],
                description=l.get("description"),
                timestamp=datetime.fromisoformat(l["timestamp"]) if isinstance(l["timestamp"], str) else l["timestamp"],
                fuel_type=l.get("fuel_type"),
                region=l.get("region")
            ))
        return res
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
