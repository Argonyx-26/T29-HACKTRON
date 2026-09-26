import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Dict, Any, List, Optional

from app.database import get_db, get_student_db, get_combined_db
from app.models.all_models import (
    Student,
    Question,
    Skill,
    Attempt,
    AssessmentReport,
    StudentMisconceptionInstance,
    MisconceptionPattern,
    AuditLog,
)
from app.schemas.all_schemas import (
    AttemptSubmission,
    DiagnosisResult,
    AssessmentReportCreate,
    AssessmentReportResponse,
)
from app.services.deterministic_engine import DeterministicMisconceptionEngine
from app.services.llm_reasoning import LLMReasoningService
from app.services.mastery_service import MasteryService

router = APIRouter(prefix="/attempts", tags=["Assessment & Attempts"])
reports_router = APIRouter(prefix="/assessments", tags=["Assessment Reports"])


def _ensure_student(student_db: Session, student_id: str) -> Student:
    """Ensure the student exists in their private DB."""
    student = student_db.query(Student).filter(Student.id == student_id).first()
    if not student:
        try:
            student = Student(id=student_id, name="Learner", avatar_color="#2563EB", target_mastery=0.85)
            student_db.add(student)
            student_db.commit()
            student_db.refresh(student)
        except IntegrityError:
            student_db.rollback()
            student = student_db.query(Student).filter(Student.id == student_id).first()
    return student


@router.post("/submit", response_model=DiagnosisResult)
def submit_attempt(submission: AttemptSubmission, shared_db: Session = Depends(get_db)):
    """
    Core Evaluation Pipeline:
    Student Work -> Deterministic Misconception Engine -> If Unmatched -> LLM Fallback
    -> Knowledge Twin Update -> Mistake Card Generation.

    Curriculum data read from shared DB; student data written to student's private DB.
    """
    # Open the student's private database
    student_db = get_student_db(submission.student_id)

    try:
        # Ensure student exists in their private DB
        _ensure_student(student_db, submission.student_id)

        # Read question and skill from shared curriculum DB
        question = shared_db.query(Question).filter(Question.id == submission.question_id).first()
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")

        skill = shared_db.query(Skill).filter(Skill.id == question.skill_id).first()
        skill_name = skill.name if skill else "Algebra"

        # Fetch active pattern rules from shared DB
        patterns = shared_db.query(MisconceptionPattern).filter(
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

        # STEP 1: Execute Deterministic Misconception Engine
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

        # STEP 2: LLM fallback if deterministic didn't match
        if not diagnosis.get("is_correct") and not diagnosis.get("matched"):
            known_names = [p["name"] for p in pattern_rules]
            llm_result = LLMReasoningService.diagnose_with_fallback(
                db=shared_db,
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

        # STEP 3: Record Attempt in student's private DB
        attempt_id = f"att_{uuid.uuid4().hex[:8]}"
        attempt = Attempt(
            id=attempt_id,
            student_id=submission.student_id,
            question_id=submission.question_id,
            answer=submission.answer,
            work_shown=submission.work_shown,
            input_mode=submission.input_mode,
            correct=diagnosis.get("is_correct", False),
            confidence=submission.confidence if submission.confidence is not None else diagnosis.get("confidence", 0.5),
            diagnosis=diagnosis
        )
        student_db.add(attempt)

        # STEP 4: Update BKT Mastery in student's private DB
        mastery_state = MasteryService.record_attempt(
            db=student_db,
            student_id=submission.student_id,
            skill_id=question.skill_id,
            is_correct=diagnosis.get("is_correct", False),
            shared_db=shared_db
        )

        # STEP 5: Record StudentMisconceptionInstance if incorrect
        if not diagnosis.get("is_correct") and diagnosis.get("likely_misconception"):
            pat_id = diagnosis.get("pattern_id")
            if not pat_id:
                matched_pat = shared_db.query(MisconceptionPattern).filter(
                    MisconceptionPattern.name == diagnosis.get("likely_misconception")
                ).first()
                pat_id = matched_pat.id if matched_pat else "PAT_GENERAL"

            existing_inst = student_db.query(StudentMisconceptionInstance).filter(
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
                student_db.add(new_inst)

        # STEP 6: Audit log in student DB
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
        student_db.add(audit)
        student_db.commit()

        # Pattern count from shared DB
        pattern_count = shared_db.query(MisconceptionPattern).filter(MisconceptionPattern.status == "active").count()

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

    finally:
        student_db.close()


# =========================================================================
# ASSESSMENT PAPERS & COMPREHENSIVE DIAGNOSTIC REPORTS
# =========================================================================

def _handle_save_report(report_in: AssessmentReportCreate, student_db: Session) -> AssessmentReportResponse:
    _ensure_student(student_db, report_in.student_id)

    report_id = report_in.id or f"rep_{uuid.uuid4().hex[:10]}"

    existing = student_db.query(AssessmentReport).filter(AssessmentReport.id == report_id).first()
    if existing:
        existing.chapter_id = report_in.chapter_id
        existing.chapter_title = report_in.chapter_title
        existing.total_questions = report_in.total_questions
        existing.attempted_count = report_in.attempted_count
        existing.correct_count = report_in.correct_count
        existing.incorrect_count = report_in.incorrect_count
        existing.score_percent = report_in.score_percent
        existing.evaluated_items = report_in.evaluated_items
        student_db.commit()
        student_db.refresh(existing)
        return existing

    new_report = AssessmentReport(
        id=report_id,
        student_id=report_in.student_id,
        chapter_id=report_in.chapter_id,
        chapter_title=report_in.chapter_title,
        total_questions=report_in.total_questions,
        attempted_count=report_in.attempted_count,
        correct_count=report_in.correct_count,
        incorrect_count=report_in.incorrect_count,
        score_percent=report_in.score_percent,
        evaluated_items=report_in.evaluated_items,
        created_at=datetime.datetime.utcnow()
    )
    student_db.add(new_report)

    audit = AuditLog(
        id=f"aud_{uuid.uuid4().hex[:8]}",
        event_type="assessment_report_saved",
        student_id=report_in.student_id,
        details={
            "report_id": report_id,
            "chapter_title": report_in.chapter_title,
            "total_questions": report_in.total_questions,
            "score_percent": report_in.score_percent
        }
    )
    student_db.add(audit)
    student_db.commit()
    student_db.refresh(new_report)
    return new_report


def _handle_get_reports(student_id: str, shared_db: Session, student_db: Session) -> List[AssessmentReportResponse]:
    from sqlalchemy import func
    from app.database import get_student_db

    clean_sid = (student_id or "").strip()
    target_ids = {clean_sid} if clean_sid else set()

    # Discover all aliases / accounts matching this student by ID, email, or name
    st = None
    if clean_sid:
        st = shared_db.query(Student).filter(Student.id == clean_sid).first()
        if not st:
            st = shared_db.query(Student).filter(func.lower(Student.name) == clean_sid.lower()).first()

    if st:
        target_ids.add(st.id)
        if st.name:
            for s in shared_db.query(Student).filter(func.lower(Student.name) == st.name.lower()).all():
                target_ids.add(s.id)
        if st.email:
            for s in shared_db.query(Student).filter(func.lower(Student.email) == st.email.lower()).all():
                target_ids.add(s.id)

    # 1. First check persisted AssessmentReport records
    reports: List[AssessmentReport] = []
    seen_report_ids = set()

    # From student's own DB
    for r in student_db.query(AssessmentReport).all():
        if r.id not in seen_report_ids:
            seen_report_ids.add(r.id)
            reports.append(r)

    # From shared DB for matching student IDs
    if target_ids:
        for r in shared_db.query(AssessmentReport).filter(AssessmentReport.student_id.in_(target_ids)).all():
            if r.id not in seen_report_ids:
                seen_report_ids.add(r.id)
                reports.append(r)

    # From related student DBs if multiple IDs exist
    for tid in target_ids:
        if tid != clean_sid:
            try:
                sdb = get_student_db(tid)
                for r in sdb.query(AssessmentReport).all():
                    if r.id not in seen_report_ids:
                        seen_report_ids.add(r.id)
                        reports.append(r)
                sdb.close()
            except Exception:
                pass

    if reports:
        reports.sort(key=lambda x: str(x.created_at or ""), reverse=True)
        return reports

    # 2. Fallback: synthesise reports from attempts in student DB and shared DB
    attempts_map = {}

    # All attempts in primary student DB
    for a in student_db.query(Attempt).all():
        attempts_map[a.id] = a

    # All attempts in shared DB matching target_ids
    if target_ids:
        for a in shared_db.query(Attempt).filter(Attempt.student_id.in_(target_ids)).all():
            attempts_map[a.id] = a

    # From related student DBs
    for tid in target_ids:
        if tid != clean_sid:
            try:
                sdb = get_student_db(tid)
                for a in sdb.query(Attempt).all():
                    attempts_map[a.id] = a
                sdb.close()
            except Exception:
                pass

    attempts = list(attempts_map.values())
    if not attempts:
        return []

    # Sort newest first
    attempts.sort(key=lambda a: a.created_at or datetime.min, reverse=True)

    grouped: Dict[str, List[Attempt]] = {}
    for a in attempts:
        # Look up question metadata from shared DB
        q_obj = shared_db.query(Question).filter(Question.id == a.question_id).first()
        chap_id = q_obj.chapter_id if q_obj else None
        date_key = a.created_at.strftime("%Y-%m-%d %H") if a.created_at else "recent"
        group_key = f"{chap_id or 'diagnostic'}_{date_key}"
        if group_key not in grouped:
            grouped[group_key] = []
        grouped[group_key].append((a, q_obj))

    synthetic_reports = []
    for g_key, att_pairs in grouped.items():
        total_q = len(att_pairs)
        corr_q = sum(1 for a, _ in att_pairs if a.correct)
        inc_q = total_q - corr_q
        first_a, first_q = att_pairs[0]

        chap_title = "Diagnostic Assessment"
        chap_id = None
        if first_q:
            if first_q.chapter_id:
                from app.models.all_models import Chapter
                chapter = shared_db.query(Chapter).filter(Chapter.id == first_q.chapter_id).first()
                if chapter:
                    chap_title = f"{chapter.subject}: {chapter.title}"
                    chap_id = chapter.id

        score_pct = round((corr_q / total_q) * 100) if total_q > 0 else 0

        eval_items = []
        for a, q in att_pairs:
            q_data = {
                "id": a.question_id,
                "question_text": q.question_text if q else "Diagnostic Question",
                "correct_answer": q.correct_answer if q else "",
                "expected_steps": q.expected_steps if q else [],
                "difficulty": q.difficulty if q else "medium",
                "skill_id": q.skill_id if q else ""
            }
            eval_items.append({
                "question": q_data,
                "studentAnswer": a.answer,
                "workShown": a.work_shown or [],
                "diagnosis": a.diagnosis or {
                    "correct": a.correct,
                    "likely_misconception": None,
                    "explanation": f"Correct answer: {q.correct_answer if q else 'N/A'}"
                }
            })

        synthetic_reports.append(AssessmentReportResponse(
            id=f"rep_synth_{first_a.id}",
            student_id=student_id,
            chapter_id=chap_id,
            chapter_title=chap_title,
            total_questions=total_q,
            attempted_count=total_q,
            correct_count=corr_q,
            incorrect_count=inc_q,
            score_percent=score_pct,
            evaluated_items=eval_items,
            created_at=first_a.created_at.isoformat() if first_a.created_at else None
        ))

    return synthetic_reports


def _handle_get_report_detail(report_id: str, student_id: str, student_db: Session) -> AssessmentReportResponse:
    report = student_db.query(AssessmentReport).filter(AssessmentReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Assessment report not found")
    return report


# ─────────────────────────────────────────────────────────────────────────────
# Route endpoints — student data goes to student's private DB
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/reports", response_model=AssessmentReportResponse)
@reports_router.post("/reports", response_model=AssessmentReportResponse)
def save_assessment_report(report_in: AssessmentReportCreate, _shared: Session = Depends(get_db)):
    """Save an assessment report to the student's private database."""
    student_db = get_student_db(report_in.student_id)
    try:
        return _handle_save_report(report_in, student_db)
    finally:
        student_db.close()


@router.get("/reports", response_model=List[AssessmentReportResponse])
@reports_router.get("/reports", response_model=List[AssessmentReportResponse])
def get_assessment_reports(student_id: str, shared_db: Session = Depends(get_db)):
    """Fetch all assessment reports from the student's private database."""
    student_db = get_student_db(student_id)
    try:
        return _handle_get_reports(student_id, shared_db, student_db)
    finally:
        student_db.close()


@router.get("/reports/{report_id}", response_model=AssessmentReportResponse)
@reports_router.get("/reports/{report_id}", response_model=AssessmentReportResponse)
def get_assessment_report_detail(
    report_id: str,
    student_id: Optional[str] = Query(None),
    shared_db: Session = Depends(get_db)
):
    """Fetch a single assessment report from the student's private database (or search student DBs if student_id not specified)."""
    import glob
    from pathlib import Path
    from app.database import STUDENTS_DIR

    if student_id:
        student_db = get_student_db(student_id)
        try:
            report = student_db.query(AssessmentReport).filter(AssessmentReport.id == report_id).first()
            if report:
                return report
        finally:
            student_db.close()

    # Search all student databases if student_id was not provided or not found
    db_files = glob.glob(str(STUDENTS_DIR / "student_*.db"))
    for db_f in db_files:
        stem = Path(db_f).stem
        s_id = stem[len("student_"):] if stem.startswith("student_") else stem
        s_db = get_student_db(s_id)
        try:
            report = s_db.query(AssessmentReport).filter(AssessmentReport.id == report_id).first()
            if report:
                return report
        finally:
            s_db.close()

    # Fallback to shared database
    report = shared_db.query(AssessmentReport).filter(AssessmentReport.id == report_id).first()
    if report:
        return report

    raise HTTPException(status_code=404, detail="Assessment report not found")

