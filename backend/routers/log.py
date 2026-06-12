from fastapi import APIRouter, Header, HTTPException
from typing import List
from models.schemas import LogEntryRequest, LogEntryResponse
from services.co2_engine import calculate_co2
from services.firestore_service import add_user_log, get_user_logs
from datetime import datetime

router = APIRouter(prefix="/log", tags=["Logs"])

@router.post("", response_model=LogEntryResponse)
def create_log(request: LogEntryRequest, x_user_id: str = Header(default="default_user")):
    try:
        co2_kg, equivalent = calculate_co2(request.category, request.subtype, request.amount)
        
        log_data = {
            "category": request.category,
            "subtype": request.subtype,
            "amount": request.amount,
            "co2_kg": co2_kg,
            "equivalent": equivalent,
            "description": request.description or f"Logged {request.subtype} ({request.amount} unit(s))",
            "timestamp": datetime.now().isoformat()
        }
        
        saved_log = add_user_log(x_user_id, log_data)
        return LogEntryResponse(
            id=saved_log["id"],
            userId=saved_log["userId"],
            category=saved_log["category"],
            subtype=saved_log["subtype"],
            amount=saved_log["amount"],
            co2_kg=saved_log["co2_kg"],
            equivalent=saved_log["equivalent"],
            description=saved_log.get("description"),
            timestamp=datetime.fromisoformat(saved_log["timestamp"])
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("", response_model=List[LogEntryResponse])
def get_logs(x_user_id: str = Header(default="default_user")):
    try:
        logs = get_user_logs(x_user_id)
        res = []
        for l in logs:
            res.append(LogEntryResponse(
                id=l["id"],
                userId=l["userId"],
                category=l["category"],
                subtype=l["subtype"],
                amount=l["amount"],
                co2_kg=l["co2_kg"],
                equivalent=l["equivalent"],
                description=l.get("description"),
                timestamp=datetime.fromisoformat(l["timestamp"]) if isinstance(l["timestamp"], str) else l["timestamp"]
            ))
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
