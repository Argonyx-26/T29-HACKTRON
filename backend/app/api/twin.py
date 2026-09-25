from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database import get_db
from app.models.all_models import StudentTwin, TopicMastery, Topic, User
from app.schemas.all_schemas import StudentTwinResponse, KnowledgeGraphResponse
from app.services.mastery_service import mastery_service
from app.services.llm_reasoning import llm_reasoning_service
from app.services.analytics_service import analytics_service

router = APIRouter(prefix="/twin", tags=["Knowledge Twin"])

@router.get("/{student_id}", response_model=StudentTwinResponse)
def get_student_twin(student_id: str, db: Session = Depends(get_db)):
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    twin = mastery_service.get_or_create_twin(db, student_id)
    # Eagerly load topic info into response
    mastery_records = db.query(TopicMastery).filter(TopicMastery.twin_id == twin.id).all()
    for m in mastery_records:
        topic = db.query(Topic).filter(Topic.id == m.topic_id).first()
        if topic:
            m.topic_title = topic.title
            m.topic_code = topic.code

    twin.topic_masteries = mastery_records
    return twin

@router.get("/{student_id}/graph", response_model=KnowledgeGraphResponse)
def get_knowledge_graph(student_id: str, db: Session = Depends(get_db)):
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    graph_data = mastery_service.get_knowledge_graph(db, student_id)
    return graph_data

@router.post("/{student_id}/practice")
def record_practice_attempt(
    student_id: str,
    payload: Dict[str, Any] = Body(..., example={"topic_id": "uuid", "is_correct": True}),
    db: Session = Depends(get_db)
):
    topic_id = payload.get("topic_id")
    is_correct = payload.get("is_correct", False)
    if not topic_id:
        raise HTTPException(status_code=400, detail="topic_id is required")

    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    updated_record = mastery_service.record_practice_event(
        db=db,
        student_id=student_id,
        topic_id=topic_id,
        is_correct=is_correct
    )
    return {
        "message": "Practice event recorded and knowledge twin updated",
        "topic_id": topic_id,
        "new_mastery_score": updated_record.score,
        "status": updated_record.status,
        "attempts": updated_record.attempts_count
    }

@router.get("/{student_id}/diagnosis")
def get_student_twin_diagnosis(student_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    report = analytics_service.get_student_diagnostic_report(db, student_id)
    if not report:
        raise HTTPException(status_code=404, detail="Student not found")

    diagnosis = llm_reasoning_service.generate_twin_diagnosis(
        student_name=report["student_name"],
        overall_mastery=report["overall_mastery"],
        struggling_topics=report["struggling_topics"],
        mastered_topics=report["mastered_topics"]
    )
    return {
        "diagnostic_report": report,
        "ai_synthesis": diagnosis
    }
