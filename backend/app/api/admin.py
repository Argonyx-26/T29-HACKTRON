from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database import get_db, check_db_connection, Base, engine
from app.seed.seed_data import seed_database
from app.models.all_models import User, Subject, Topic, StudentTwin, Intervention, Assessment

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/health")
def admin_health_check() -> Dict[str, Any]:
    db_alive = check_db_connection()
    return {
        "status": "healthy" if db_alive else "degraded",
        "database_connected": db_alive,
        "service": "Knowledge Twin Backend"
    }

@router.post("/seed")
def seed_cohort_data(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Populates the database with demo cohort and curriculum data."""
    try:
        result = seed_database(db)
        return {"message": "Database seed executed", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Seed failed: {str(e)}")

@router.get("/stats")
def get_system_stats(db: Session = Depends(get_db)) -> Dict[str, int]:
    return {
        "users_count": db.query(User).count(),
        "students_count": db.query(User).filter(User.role == "student").count(),
        "subjects_count": db.query(Subject).count(),
        "topics_count": db.query(Topic).count(),
        "student_twins_count": db.query(StudentTwin).count(),
        "interventions_count": db.query(Intervention).count(),
        "assessments_count": db.query(Assessment).count(),
    }

@router.post("/reset")
def reset_database() -> Dict[str, str]:
    """Drops and re-creates all tables. Use with caution in testing/dev."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    return {"message": "All tables dropped and recreated successfully"}
