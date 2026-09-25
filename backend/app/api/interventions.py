from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from app.database import get_db
from app.models.all_models import Intervention
from app.schemas.all_schemas import RetestSubmission, RetestResult
from app.services.intervention_service import InterventionService

router = APIRouter(prefix="/interventions", tags=["Interventions & Retest"])

@router.get("/route")
def route_intervention(
    student_id: str = Query(...),
    skill_id: str = Query(...),
    pattern_id: Optional[str] = Query(None),
    classification: str = Query("procedural"),
    db: Session = Depends(get_db)
):
    """
    Dynamically routes a student to an intervention based on their diagnostic classification:
    - prerequisite_gap -> foundational skill practice
    - careless -> precision review & retry
    - procedural -> worked example + guided practice
    - conceptual -> core concept visualization
    """
    intervention = InterventionService.get_or_create_intervention(
        db=db,
        skill_id=skill_id,
        pattern_id=pattern_id,
        classification=classification,
        student_id=student_id
    )
    return {
        "id": intervention.id,
        "skill_id": intervention.skill_id,
        "pattern_id": intervention.pattern_id,
        "intervention_type": intervention.intervention_type,
        "title": intervention.title,
        "content": intervention.content,
        "target_misconception": intervention.target_misconception
    }

@router.get("/{intervention_id}")
def get_intervention_detail(intervention_id: str, db: Session = Depends(get_db)):
    intervention = db.query(Intervention).filter(Intervention.id == intervention_id).first()
    if not intervention:
        raise HTTPException(status_code=404, detail="Intervention not found")
    return {
        "id": intervention.id,
        "skill_id": intervention.skill_id,
        "intervention_type": intervention.intervention_type,
        "title": intervention.title,
        "content": intervention.content
    }

@router.post("/retest", response_model=RetestResult)
def submit_retest(retest_data: RetestSubmission, db: Session = Depends(get_db)):
    """
    Submits an adaptive retest attempt after an intervention,
    evaluates response, calculates mastery delta (e.g. 42% -> 65%),
    and marks the misconception as resolved in the student's Twin.
    """
    try:
        result = InterventionService.process_retest_attempt(
            db=db,
            student_id=retest_data.student_id,
            intervention_id=retest_data.intervention_id,
            question_id=retest_data.question_id,
            student_answer=retest_data.answer,
            work_shown=retest_data.work_shown
        )
        return RetestResult(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
