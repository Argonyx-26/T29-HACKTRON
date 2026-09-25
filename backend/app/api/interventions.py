from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.all_models import Intervention, Topic, User
from app.schemas.all_schemas import (
    InterventionResponse, InterventionCreate, InterventionStatusUpdate, UserResponse
)
from app.services.intervention_service import intervention_service

router = APIRouter(prefix="/interventions", tags=["Interventions"])

@router.get("", response_model=List[InterventionResponse])
def list_interventions(
    student_id: Optional[str] = Query(None, description="Filter by student ID"),
    status: Optional[str] = Query(None, description="Filter by status (recommended, scheduled, completed)"),
    db: Session = Depends(get_db)
):
    query = db.query(Intervention)
    if student_id:
        query = query.filter(Intervention.student_id == student_id)
    if status:
        query = query.filter(Intervention.status == status)

    interventions = query.order_by(Intervention.created_at.desc()).all()
    # Populate readable student & topic names
    for i in interventions:
        student = db.query(User).filter(User.id == i.student_id).first()
        topic = db.query(Topic).filter(Topic.id == i.topic_id).first()
        if student:
            i.student_name = student.full_name
        if topic:
            i.topic_title = topic.title

    return interventions

@router.post("/generate", response_model=List[InterventionResponse])
def trigger_intervention_generation(db: Session = Depends(get_db)):
    """Scans all student twins to automatically detect gaps and recommend interventions."""
    new_interventions = intervention_service.scan_and_generate_interventions(db)
    for i in new_interventions:
        student = db.query(User).filter(User.id == i.student_id).first()
        topic = db.query(Topic).filter(Topic.id == i.topic_id).first()
        if student:
            i.student_name = student.full_name
        if topic:
            i.topic_title = topic.title
    return new_interventions

@router.get("/{intervention_id}/mentors", response_model=List[UserResponse])
def get_recommended_peer_mentors(intervention_id: str, db: Session = Depends(get_db)):
    intervention = db.query(Intervention).filter(Intervention.id == intervention_id).first()
    if not intervention:
        raise HTTPException(status_code=404, detail="Intervention not found")

    mentors = intervention_service.find_peer_mentors(db, intervention.topic_id)
    return mentors

@router.patch("/{intervention_id}/status", response_model=InterventionResponse)
def update_status(
    intervention_id: str,
    status_update: InterventionStatusUpdate,
    db: Session = Depends(get_db)
):
    updated = intervention_service.update_intervention_status(
        db, intervention_id, status_update.status
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Intervention not found")
    return updated
