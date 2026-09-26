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
    - Cohort metrics: total_students, avg_cohort_mastery, at_risk_percentage, etc.
    """
    overview = AnalyticsService.get_teacher_class_overview(db)
    return overview

@router.get("/cohort")
def get_teacher_cohort(db: Session = Depends(get_db)):
    """
    Returns list of all students in cohort with overall mastery,
    risk status, and active interventions count.
    """
    return AnalyticsService.get_teacher_cohort(db)

@router.get("/struggling-topics")
def get_teacher_struggling_topics(db: Session = Depends(get_db)):
    """
    Returns performance by topic across the cohort, highlighting
    areas with the highest rate of learning struggles.
    """
    return AnalyticsService.get_teacher_struggling_topics(db)

