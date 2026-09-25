from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.models.all_models import User, StudentTwin, Intervention
from app.services.analytics_service import analytics_service

router = APIRouter(prefix="/teacher", tags=["Teacher Dashboard"])

@router.get("/overview")
def get_teacher_overview(db: Session = Depends(get_db)):
    return analytics_service.get_cohort_overview(db)

@router.get("/cohort")
def get_cohort_students(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    students = db.query(User).filter(User.role == "student").all()
    results = []

    for s in students:
        twin = db.query(StudentTwin).filter(StudentTwin.student_id == s.id).first()
        active_interventions = (
            db.query(Intervention)
            .filter(Intervention.student_id == s.id, Intervention.status.in_(["recommended", "scheduled"]))
            .count()
        )
        mastery = twin.overall_mastery if twin else 0.0
        load = twin.cognitive_load if twin else 0.2

        results.append({
            "student_id": s.id,
            "full_name": s.full_name,
            "email": s.email,
            "overall_mastery": mastery,
            "cognitive_load": load,
            "risk_status": "high_risk" if mastery < 0.50 else ("moderate" if mastery < 0.75 else "good"),
            "active_interventions_count": active_interventions
        })
    return results

@router.get("/struggling-topics")
def get_struggling_topics(db: Session = Depends(get_db)):
    return analytics_service.get_topic_struggle_ranking(db)

@router.get("/student/{student_id}")
def get_student_details(student_id: str, db: Session = Depends(get_db)):
    report = analytics_service.get_student_diagnostic_report(db, student_id)
    if not report:
        raise HTTPException(status_code=404, detail="Student not found")
    return report
