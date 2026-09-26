from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.database import get_db, get_student_db
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
    """List all registered learners (from shared DB index)."""
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
def create_or_sync_student(payload: StudentCreate, shared_db: Session = Depends(get_db)):
    """
    Authoritative student registration / sync endpoint.
    Creates or resolves the student profile in:
      1. The shared DB (for teacher dashboards / admin views)
      2. The student's own private DB (for personal data isolation)
    """
    from sqlalchemy import func
    clean_name = payload.name.strip() if payload.name else ""

    student = None
    try:
        # 1. Match by ID first
        if payload.id:
            student = shared_db.query(Student).filter(Student.id == payload.id).first()

        # 2. If not matched by ID, match existing student by case-insensitive name
        if not student and clean_name:
            student = shared_db.query(Student).filter(
                func.lower(Student.name) == clean_name.lower()
            ).order_by(Student.created_at.desc()).first()

        if not student:
            student = Student(
                id=payload.id,
                name=clean_name or "Learner",
                role=payload.role or "student",
                email=payload.email,
                avatar_color=payload.avatar_color or "#3B82F6",
                target_mastery=0.85
            )
            shared_db.add(student)
            shared_db.commit()
            shared_db.refresh(student)
        else:
            if clean_name and student.name != clean_name:
                student.name = clean_name
            if payload.role and student.role != payload.role:
                student.role = payload.role
            shared_db.commit()
            shared_db.refresh(student)
    except Exception:
        shared_db.rollback()
        student = shared_db.query(Student).filter(Student.id == payload.id).first()
        if not student and clean_name:
            student = shared_db.query(Student).filter(
                func.lower(Student.name) == clean_name.lower()
            ).order_by(Student.created_at.desc()).first()

    target_id = student.id if student else payload.id
    target_name = student.name if student else (clean_name or "Learner")
    target_role = student.role if student else (payload.role or "student")

    # 3. Ensure student profile exists in their private DB
    student_db = get_student_db(target_id)
    try:
        private_student = student_db.query(Student).filter(Student.id == target_id).first()
        if not private_student:
            private_student = Student(
                id=target_id,
                name=target_name,
                role=target_role,
                email=student.email if student else payload.email,
                avatar_color=(student.avatar_color if student else payload.avatar_color) or "#3B82F6",
                target_mastery=0.85
            )
            student_db.add(private_student)
            student_db.commit()
        elif target_name and private_student.name != target_name:
            private_student.name = target_name
            student_db.commit()
    except Exception:
        student_db.rollback()
    finally:
        student_db.close()

    if not student:
        return {
            "id": target_id,
            "name": target_name,
            "role": target_role,
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
def get_student_twin(student_id: str, chapter_id: Optional[str] = None, shared_db: Session = Depends(get_db)):
    """
    Returns the living Knowledge Twin model for the student.
    Curriculum data from shared DB; personal progress from student's private DB.
    """
    student_db = get_student_db(student_id)
    try:
        # Pass both sessions to analytics service
        twin = AnalyticsService.get_student_knowledge_twin(
            db=shared_db,
            student_id=student_id,
            chapter_id=chapter_id,
            student_db=student_db
        )
        return twin
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    finally:
        student_db.close()


@router.get("/{student_id}/progress")
def get_student_progress(student_id: str, shared_db: Session = Depends(get_db)):
    """Returns authoritative learner progress from the student's private DB."""
    student_db = get_student_db(student_id)
    try:
        return AnalyticsService.get_student_progress(
            db=shared_db, student_id=student_id, student_db=student_db
        )
    finally:
        student_db.close()


@router.get("/{student_id}/activity")
def get_student_activity(student_id: str, shared_db: Session = Depends(get_db)):
    """Returns activity timeline from the student's private DB."""
    student_db = get_student_db(student_id)
    try:
        return AnalyticsService.get_student_activity(
            db=shared_db, student_id=student_id, student_db=student_db
        )
    finally:
        student_db.close()


@router.get("/{student_id}/goal")
def get_student_goal(student_id: str, _shared: Session = Depends(get_db)):
    """Get the learner's target profile / goal configuration from their private DB."""
    student_db = get_student_db(student_id)
    try:
        student = student_db.query(Student).filter(Student.id == student_id).first()
        if not student:
            return {
                "student_id": student_id,
                "target_goal": None,
                "goal_description": None,
                "target_mastery": 0.85
            }
        return {
            "student_id": student.id,
            "target_goal": student.target_goal,
            "goal_description": student.goal_description,
            "target_mastery": student.target_mastery or 0.85
        }
    finally:
        student_db.close()


@router.post("/{student_id}/goal")
def set_student_goal(student_id: str, payload: StudentGoalUpdate, _shared: Session = Depends(get_db)):
    """Update the learner's target profile in their private DB."""
    student_db = get_student_db(student_id)
    try:
        student = student_db.query(Student).filter(Student.id == student_id).first()
        if not student:
            student = Student(id=student_id, name="Learner")
            student_db.add(student)

        if payload.target_goal is not None:
            student.target_goal = payload.target_goal.strip() if payload.target_goal else None
        if payload.goal_description is not None:
            student.goal_description = payload.goal_description.strip() if payload.goal_description else None
        if payload.target_mastery is not None:
            student.target_mastery = max(0.5, min(1.0, payload.target_mastery))

        student_db.commit()
        student_db.refresh(student)

        return {
            "student_id": student.id,
            "target_goal": student.target_goal,
            "goal_description": student.goal_description,
            "target_mastery": student.target_mastery
        }
    finally:
        student_db.close()


@router.get("/{student_id}/skill-gaps")
def get_student_skill_gaps(student_id: str, chapter_id: Optional[str] = None, shared_db: Session = Depends(get_db)):
    """Returns the real database-backed Skill Gap Radar data."""
    student_db = get_student_db(student_id)
    try:
        twin = AnalyticsService.get_student_knowledge_twin(
            db=shared_db, student_id=student_id, chapter_id=chapter_id, student_db=student_db
        )
        return {
            "student_id": student_id,
            "target_mastery": twin.get("target_mastery", 0.85),
            "target_goal": twin.get("target_goal"),
            "skill_gaps": twin.get("skill_gaps", [])
        }
    finally:
        student_db.close()


@router.get("/{student_id}/mistakes")
def get_student_mistakes(student_id: str, shared_db: Session = Depends(get_db)):
    """Returns the personal Mistake Library from the student's private DB."""
    student_db = get_student_db(student_id)
    try:
        twin = AnalyticsService.get_student_knowledge_twin(
            db=shared_db, student_id=student_id, student_db=student_db
        )
        return {
            "student_id": student_id,
            "active_misconceptions": twin.get("active_misconceptions", []),
            "resolved_misconceptions": twin.get("resolved_misconceptions", [])
        }
    finally:
        student_db.close()


@router.get("/{student_id}/next-action")
def get_student_next_action(student_id: str, chapter_id: Optional[str] = None, shared_db: Session = Depends(get_db)):
    """Surfaces the single unified Next Best Action."""
    student_db = get_student_db(student_id)
    try:
        twin = AnalyticsService.get_student_knowledge_twin(
            db=shared_db, student_id=student_id, chapter_id=chapter_id, student_db=student_db
        )
        return {
            "student_id": student_id,
            "next_best_action": twin.get("next_best_action")
        }
    finally:
        student_db.close()
