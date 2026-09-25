from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.database import get_db
from app.models.all_models import Student
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/students", tags=["Knowledge Twin"])

class StudentCreate(BaseModel):
    id: str
    name: str
    role: Optional[str] = "student"
    email: Optional[str] = None
    avatar_color: Optional[str] = "#3B82F6"

@router.get("", response_model=List[Dict[str, Any]])
def list_students(db: Session = Depends(get_db)):
    """List all registered learners."""
    students = db.query(Student).all()
    return [{
        "id": s.id,
        "name": s.name,
        "role": s.role,
        "email": s.email,
        "avatar_color": s.avatar_color
    } for s in students]

@router.post("", response_model=Dict[str, Any])
def create_or_sync_student(payload: StudentCreate, db: Session = Depends(get_db)):
    """
    Authoritative student registration / sync endpoint.
    Associates the stable user_id with the student record in PostgreSQL.
    """
    try:
        student = db.query(Student).filter(Student.id == payload.id).first()
        if not student:
            student = Student(
                id=payload.id,
                name=payload.name,
                role=payload.role or "student",
                email=payload.email,
                avatar_color=payload.avatar_color or "#3B82F6"
            )
            db.add(student)
            db.commit()
            db.refresh(student)
        else:
            if payload.name and payload.name != student.name:
                student.name = payload.name
            if payload.role and payload.role != student.role:
                student.role = payload.role
            db.commit()
            db.refresh(student)
    except Exception:
        db.rollback()
        student = db.query(Student).filter(Student.id == payload.id).first()
        if not student:
            # Fallback in-memory representation if DB lookup failed
            return {
                "id": payload.id,
                "name": payload.name,
                "role": payload.role or "student",
                "avatar_color": payload.avatar_color or "#3B82F6",
                "created_at": None
            }

    return {
        "id": student.id,
        "name": student.name,
        "role": student.role,
        "avatar_color": student.avatar_color,
        "created_at": student.created_at.isoformat() if student.created_at else None
    }

@router.get("/{student_id}/twin")
def get_student_twin(student_id: str, db: Session = Depends(get_db)):
    """
    Returns the living Knowledge Twin model for the student:
    mastery per skill, evidence-based confidence, active & resolved mistake cards,
    prerequisite gaps, and emerging risk alerts.
    """
    try:
        twin = AnalyticsService.get_student_knowledge_twin(db, student_id)
        return twin
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{student_id}/progress")
def get_student_progress(student_id: str, db: Session = Depends(get_db)):
    """
    Returns authoritative learner progress directly from database attempts and mastery.
    """
    return AnalyticsService.get_student_progress(db, student_id)

@router.get("/{student_id}/activity")
def get_student_activity(student_id: str, db: Session = Depends(get_db)):
    """
    Returns authoritative learner activity timeline directly from database attempts and retests.
    """
    return AnalyticsService.get_student_activity(db, student_id)

