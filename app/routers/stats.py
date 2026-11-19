"""Statistics endpoint."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import StatsOut
from app.services.stats_service import get_stats

router = APIRouter(prefix="/api/stats", tags=["Статистика"])


@router.get("", response_model=StatsOut)
def stats(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> StatsOut:
    return get_stats(db, current_user.id)
