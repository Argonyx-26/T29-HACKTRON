import uuid
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from app.database import get_db
from app.models.all_models import MisconceptionPattern, Question, AuditLog, LLMRequestLog

router = APIRouter(prefix="/admin", tags=["Admin & Content Management"])

@router.get("/patterns")
def list_pattern_library(db: Session = Depends(get_db)):
    """
    Returns all misconception patterns in the library.
    Demonstrates dynamic pattern discovery (count growing e.g. 18 -> 19).
    """
    patterns = db.query(MisconceptionPattern).order_by(MisconceptionPattern.created_at.desc()).all()
    return {
        "total_count": len(patterns),
        "patterns": [{
            "id": p.id,
            "name": p.name,
            "skill_id": p.skill_id,
            "rule_type": p.rule_type,
            "classification": p.classification,
            "source": p.source,
            "status": p.status,
            "occurrences": p.occurrences,
            "description": p.description,
            "principle_text": p.principle_text,
            "created_at": p.created_at.isoformat() if p.created_at else None
        } for p in patterns]
    }

@router.post("/questions")
def create_question(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """
    Dynamically inserts a new question into the database.
    Demonstrates that the database is the source of truth without frontend hardcoding.
    """
    q_id = payload.get("id") or f"q_{uuid.uuid4().hex[:8]}"
    question = Question(
        id=q_id,
        chapter_id=payload["chapter_id"],
        skill_id=payload["skill_id"],
        question_text=payload["question_text"],
        correct_answer=payload["correct_answer"],
        expected_steps=payload.get("expected_steps", []),
        difficulty=payload.get("difficulty", "medium"),
        source_type="custom_admin",
        source_reference={"created_by": "admin_cms"},
        diagnostic_tags=payload.get("diagnostic_tags", []),
        active=True
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return {"status": "created", "question_id": question.id}

@router.post("/patterns")
def create_pattern(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """
    Dynamically inserts a new misconception rule pattern into the library.
    """
    p_id = payload.get("id") or f"PAT_CUSTOM_{uuid.uuid4().hex[:6].upper()}"
    pattern = MisconceptionPattern(
        id=p_id,
        name=payload["name"],
        description=payload["description"],
        subject=payload.get("subject", "Mathematics"),
        skill_id=payload["skill_id"],
        rule_type=payload["rule_type"],
        rule_config=payload.get("rule_config", {}),
        classification=payload.get("classification", "procedural"),
        intervention_type=payload.get("intervention_type", "worked_example"),
        principle_text=payload.get("principle_text", ""),
        source="admin",
        status="active",
        occurrences=0
    )
    db.add(pattern)
    db.commit()
    db.refresh(pattern)
    return {"status": "created", "pattern_id": pattern.id}

@router.get("/logs")
def get_system_logs(limit: int = 50, db: Session = Depends(get_db)):
    """
    Observability: Inspect real-time Audit and LLM failover request logs.
    """
    audits = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    llm_logs = db.query(LLMRequestLog).order_by(LLMRequestLog.timestamp.desc()).limit(limit).all()
    return {
        "audit_logs": [{
            "id": a.id,
            "event_type": a.event_type,
            "student_id": a.student_id,
            "details": a.details,
            "created_at": a.created_at.isoformat() if a.created_at else None
        } for a in audits],
        "llm_request_logs": [{
            "id": l.id,
            "request_id": l.request_id,
            "provider": l.provider,
            "key_slot": l.key_slot,
            "model": l.model,
            "success": l.success,
            "latency_ms": l.latency_ms,
            "failure_reason": l.failure_reason,
            "classification_returned": l.classification_returned,
            "reusable_pattern_detected": l.reusable_pattern_detected,
            "timestamp": l.timestamp.isoformat() if l.timestamp else None
        } for l in llm_logs]
    }
