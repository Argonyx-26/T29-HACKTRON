from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.database import get_db
from app.models.all_models import Student
from app.schemas.all_schemas import StudentGoalUpdate
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
        "avatar_color": s.avatar_color,
        "target_goal": s.target_goal,
        "target_mastery": s.target_mastery or 0.85
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
                avatar_color=payload.avatar_color or "#3B82F6",
                target_mastery=0.85
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
            return {
                "id": payload.id,
                "name": payload.name,
                "role": payload.role or "student",
                "avatar_color": payload.avatar_color or "#3B82F6",
                "target_goal": None,
                "target_mastery": 0.85,
                "created_at": None
            }

    return {
        "id": student.id,
        "name": student.name,
        "role": student.role,
        "avatar_color": student.avatar_color,
        "target_goal": student.target_goal,
        "goal_description": student.goal_description,
        "target_mastery": student.target_mastery or 0.85,
        "created_at": student.created_at.isoformat() if student.created_at else None
    }

@router.get("/{student_id}/twin")
def get_student_twin(student_id: str, chapter_id: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Returns the living Knowledge Twin model for the student:
    mastery per skill, evidence-based confidence, active & resolved mistake cards,
    skill gap radar data, Next Best Action, and calibration insight.
    """
    try:
        twin = AnalyticsService.get_student_knowledge_twin(db, student_id, chapter_id)
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

@router.get("/{student_id}/goal")
def get_student_goal(student_id: str, db: Session = Depends(get_db)):
    """
    Get the learner's target profile / goal configuration.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return {
        "student_id": student.id,
        "target_goal": student.target_goal,
        "goal_description": student.goal_description,
        "target_mastery": student.target_mastery or 0.85
    }

@router.post("/{student_id}/goal")
def set_student_goal(student_id: str, payload: StudentGoalUpdate, db: Session = Depends(get_db)):
    """
    Update the learner's target profile / goal configuration.
    Influences skill prioritization and Next Best Action.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        student = Student(id=student_id, name="Learner")
        db.add(student)

    if payload.target_goal is not None:
        student.target_goal = payload.target_goal.strip() if payload.target_goal else None
    if payload.goal_description is not None:
        student.goal_description = payload.goal_description.strip() if payload.goal_description else None
    if payload.target_mastery is not None:
        student.target_mastery = max(0.5, min(1.0, payload.target_mastery))

    db.commit()
    db.refresh(student)

    return {
        "student_id": student.id,
        "target_goal": student.target_goal,
        "goal_description": student.goal_description,
        "target_mastery": student.target_mastery
    }

@router.get("/{student_id}/skill-gaps")
def get_student_skill_gaps(student_id: str, chapter_id: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Returns the real database-backed Skill Gap Radar data:
    Current State vs Target State = Gap.
    """
    twin = AnalyticsService.get_student_knowledge_twin(db, student_id, chapter_id)
    return {
        "student_id": student_id,
        "target_mastery": twin.get("target_mastery", 0.85),
        "target_goal": twin.get("target_goal"),
        "skill_gaps": twin.get("skill_gaps", [])
    }

@router.get("/{student_id}/mistakes")
def get_student_mistakes(student_id: str, db: Session = Depends(get_db)):
    """
    Returns the personal Mistake Library:
    Active and resolved misconception instances backed by real DB evidence.
    """
    twin = AnalyticsService.get_student_knowledge_twin(db, student_id)
    return {
        "student_id": student_id,
        "active_misconceptions": twin.get("active_misconceptions", []),
        "resolved_misconceptions": twin.get("resolved_misconceptions", [])
    }

@router.get("/{student_id}/next-action")
def get_student_next_action(student_id: str, chapter_id: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Surfaces the single unified Next Best Action with its evidence-based 'Why?'.
    """
    twin = AnalyticsService.get_student_knowledge_twin(db, student_id, chapter_id)
    return {
        "student_id": student_id,
        "next_best_action": twin.get("next_best_action")
    }
