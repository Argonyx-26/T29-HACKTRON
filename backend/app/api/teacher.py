from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database import get_db
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/teacher", tags=["Teacher Analytics"])

@router.get("/overview")
def get_teacher_overview(db: Session = Depends(get_db)):
    """
    Teacher Analytics Surface:
    - View 1: Student Mastery Table
    - View 2: Class Misconception Heatmap Matrix
    - View 3: Same-Score Different-Twins Proof (Maya vs Arjun)
    """
    overview = AnalyticsService.get_teacher_class_overview(db)
    return overview
