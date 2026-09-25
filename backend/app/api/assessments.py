import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database import get_db
from app.models.all_models import (
    Question,
    Skill,
    Attempt,
    StudentMisconceptionInstance,
    MisconceptionPattern,
    AuditLog,
)
from app.schemas.all_schemas import AttemptSubmission, DiagnosisResult
from app.services.deterministic_engine import DeterministicMisconceptionEngine
from app.services.llm_reasoning import LLMReasoningService
from app.services.mastery_service import MasteryService

router = APIRouter(prefix="/attempts", tags=["Assessment & Attempts"])

@router.post("/submit", response_model=DiagnosisResult)
def submit_attempt(submission: AttemptSubmission, db: Session = Depends(get_db)):
    """
    Core Evaluation Pipeline:
    Student Work -> Deterministic Misconception Engine -> If Unmatched -> LLM Fallback
    -> Knowledge Twin Update -> Mistake Card Generation.
    """
    question = db.query(Question).filter(Question.id == submission.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    skill = db.query(Skill).filter(Skill.id == question.skill_id).first()
    skill_name = skill.name if skill else "Algebra"

    # Fetch active pattern rules associated with this skill (or general patterns)
    patterns = db.query(MisconceptionPattern).filter(
        MisconceptionPattern.status == "active"
    ).all()
    pattern_rules = [{
        "id": p.id,
        "name": p.name,
        "description": p.description,
        "rule_type": p.rule_type,
        "rule_config": p.rule_config or {},
        "classification": p.classification,
        "intervention_type": p.intervention_type,
        "principle_text": p.principle_text,
        "skill_id": p.skill_id,
        "skill_name": skill_name
    } for p in patterns]

    # STEP 1: Execute Deterministic Misconception Engine FIRST
    engine = DeterministicMisconceptionEngine()
    diagnosis = engine.evaluate_attempt(
        question_text=question.question_text,
        correct_answer=question.correct_answer,
        student_answer=submission.answer,
        work_shown=submission.work_shown,
        skill_id=question.skill_id,
        pattern_rules=pattern_rules
    )

    new_pattern_discovered = False
    engine_used = diagnosis.get("engine_used", "deterministic")

    # STEP 2: If answer is incorrect and deterministic match was weak / unmatched -> ESCALATE TO LLM FALLBACK
    if not diagnosis.get("is_correct") and not diagnosis.get("matched"):
        known_names = [p["name"] for p in pattern_rules]
        llm_result = LLMReasoningService.diagnose_with_fallback(
            db=db,
            question_text=question.question_text,
            correct_answer=question.correct_answer,
            student_answer=submission.answer,
            work_shown=submission.work_shown,
            skill_name=skill_name,
            skill_id=question.skill_id,
            known_pattern_names=known_names
        )
        engine_used = "llm_fallback"
        new_pattern_discovered = llm_result.get("new_pattern_discovered", False)
        diagnosis["matched"] = True
        diagnosis["engine_used"] = "llm_fallback"
        diagnosis["classification"] = llm_result.get("classification")
        diagnosis["likely_misconception"] = llm_result.get("likely_misconception")
        diagnosis["explanation"] = llm_result.get("explanation")
        diagnosis["mistake_card"] = llm_result.get("mistake_card")

    # STEP 3: Record Attempt in Database
    attempt_id = f"att_{uuid.uuid4().hex[:8]}"
    attempt = Attempt(
        id=attempt_id,
        student_id=submission.student_id,
        question_id=submission.question_id,
        answer=submission.answer,
        work_shown=submission.work_shown,
        input_mode=submission.input_mode,
        correct=diagnosis.get("is_correct", False),
        confidence=diagnosis.get("confidence", 0.5),
        diagnosis=diagnosis
    )
    db.add(attempt)

    # STEP 4: Update Bayesian Knowledge Tracing (BKT) Mastery
    mastery_state = MasteryService.record_attempt(
        db=db,
        student_id=submission.student_id,
        skill_id=question.skill_id,
        is_correct=diagnosis.get("is_correct", False)
    )

    # STEP 5: If incorrect and misconception detected, record or update StudentMisconceptionInstance
    if not diagnosis.get("is_correct") and diagnosis.get("likely_misconception"):
        pat_id = diagnosis.get("pattern_id")
        if not pat_id:
            # Look up or use fallback pattern id
            matched_pat = db.query(MisconceptionPattern).filter(
                MisconceptionPattern.name == diagnosis.get("likely_misconception")
            ).first()
            pat_id = matched_pat.id if matched_pat else "PAT_GENERAL"

        existing_inst = db.query(StudentMisconceptionInstance).filter(
            StudentMisconceptionInstance.student_id == submission.student_id,
            StudentMisconceptionInstance.pattern_id == pat_id,
            StudentMisconceptionInstance.status == "active"
        ).first()

        now = datetime.datetime.utcnow()
        if existing_inst:
            existing_inst.occurrences += 1
            existing_inst.last_detected = now
            if submission.work_shown:
                existing_inst.evidence_examples = list(existing_inst.evidence_examples or []) + [
                    " → ".join(submission.work_shown)
                ]
        else:
            new_inst = StudentMisconceptionInstance(
                id=f"smi_{uuid.uuid4().hex[:8]}",
                student_id=submission.student_id,
                pattern_id=pat_id,
                skill_id=question.skill_id,
                status="active",
                occurrences=1,
                evidence_examples=[" → ".join(submission.work_shown)] if submission.work_shown else [submission.answer],
                first_detected=now,
                last_detected=now
            )
            db.add(new_inst)

    # STEP 6: Audit log
    audit = AuditLog(
        id=f"aud_{uuid.uuid4().hex[:8]}",
        event_type="attempt_diagnosed",
        student_id=submission.student_id,
        details={
            "attempt_id": attempt_id,
            "engine": engine_used,
            "correct": diagnosis.get("is_correct"),
            "misconception": diagnosis.get("likely_misconception"),
            "new_pattern_discovered": new_pattern_discovered
        }
    )
    db.add(audit)
    db.commit()

    # Pattern count in library
    pattern_count = db.query(MisconceptionPattern).filter(MisconceptionPattern.status == "active").count()

    return DiagnosisResult(
        attempt_id=attempt_id,
        correct=diagnosis.get("is_correct", False),
        evaluated_answer=submission.answer,
        engine_used=engine_used,
        rule_id=diagnosis.get("rule_type") or diagnosis.get("pattern_id"),
        classification=diagnosis.get("classification"),
        likely_misconception=diagnosis.get("likely_misconception"),
        explanation=diagnosis.get("explanation"),
        mistake_card=diagnosis.get("mistake_card"),
        twin_updated=True,
        new_pattern_discovered=new_pattern_discovered,
        pattern_library_count=pattern_count,
        mastery_delta={
            "skill_id": question.skill_id,
            "new_mastery": mastery_state.mastery_probability,
            "confidence": mastery_state.confidence,
            "evidence_count": mastery_state.evidence_count
        }
    )
