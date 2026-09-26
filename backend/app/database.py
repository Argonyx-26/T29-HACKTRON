"""
database.py — Per-Student Database Architecture
================================================
SHARED DB  (knowledge_twin.db):
  Curriculum content — Chapter, Skill, Question, MisconceptionPattern, Intervention,
  UploadedDocument, ContentExtraction, LLMRequestLog, TeacherDemo, StudyGroup.
  Read by everyone; never contains personal learner data.

STUDENT DB (students/student_<safe_id>.db):
  Personal learner data — Student profile, Attempt, MasteryState,
  StudentMisconceptionInstance, InterventionHistory, AssessmentReport,
  EmergingGap, AuditLog.
  ONE DATABASE PER STUDENT — completely isolated.
  Student A physically cannot access Student B's data.
"""

import os
import re
import urllib.parse
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

from app.config import settings

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _normalize_url(url: str) -> str:
    cleaned = (url or "").strip()
    if cleaned.startswith("postgres://"):
        cleaned = cleaned.replace("postgres://", "postgresql://", 1)
    if "://" in cleaned and "@" in cleaned:
        proto, rest = cleaned.split("://", 1)
        creds, host_part = rest.rsplit("@", 1)
        if ":" in creds:
            user, raw_pass = creds.split(":", 1)
            encoded = urllib.parse.quote_plus(urllib.parse.unquote_plus(raw_pass))
            return f"{proto}://{user}:{encoded}@{host_part}"
    return cleaned


def _make_engine(url: str, is_sqlite: bool = False):
    kwargs = {}
    if is_sqlite:
        kwargs["connect_args"] = {"check_same_thread": False}
    else:
        kwargs["pool_pre_ping"] = True
        kwargs["pool_recycle"] = 300
    return create_engine(url, **kwargs)


def _safe_id(student_id: str) -> str:
    """Sanitise student_id so it can safely be used as a filename component."""
    return re.sub(r"[^a-zA-Z0-9_\-]", "_", student_id)[:64]


# ─────────────────────────────────────────────────────────────────────────────
# Shared (curriculum) engine  — knowledge_twin.db
# ─────────────────────────────────────────────────────────────────────────────

_shared_url = _normalize_url(settings.DATABASE_URL)
_shared_is_sqlite = "sqlite" in _shared_url

engine = _make_engine(_shared_url, is_sqlite=_shared_is_sqlite)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Canonical declarative base — all models in all_models.py use this
Base = declarative_base()


def get_db():
    """
    FastAPI dependency: yields a Session on the shared curriculum DB.
    Use for: chapters, skills, questions, patterns, interventions, documents.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# Per-student private database directory
# ─────────────────────────────────────────────────────────────────────────────

_BACKEND_DIR = Path(__file__).resolve().parent.parent
_STUDENT_DB_DIR = _BACKEND_DIR / "students"
_STUDENT_DB_DIR.mkdir(parents=True, exist_ok=True)
STUDENTS_DIR = _STUDENT_DB_DIR

# Engine cache — one engine per student_id (created once, reused)
_student_engines: dict = {}
# Track which student DBs have had tables created
_student_db_initialized: set = set()


def _student_db_path(student_id: str) -> Path:
    return _STUDENT_DB_DIR / f"student_{_safe_id(student_id)}.db"


def _get_student_engine(student_id: str):
    """Return (and cache) a SQLAlchemy engine for the given student's private DB."""
    safe = _safe_id(student_id)
    if safe not in _student_engines:
        db_path = _student_db_path(student_id)
        url = f"sqlite:///{db_path}"
        eng = _make_engine(url, is_sqlite=True)
        _student_engines[safe] = eng
    return _student_engines[safe]


def _ensure_student_tables(student_id: str):
    """Create student-specific tables in the student DB if they don't exist yet."""
    safe = _safe_id(student_id)
    if safe not in _student_db_initialized:
        from app.models.all_models import (
            Student, Attempt, MasteryState, StudentMisconceptionInstance,
            InterventionHistory, AssessmentReport, EmergingGap, AuditLog
        )
        eng = _get_student_engine(student_id)
        # Create only the student-scoped tables in the student's DB
        student_tables = [
            Student.__table__,
            Attempt.__table__,
            MasteryState.__table__,
            StudentMisconceptionInstance.__table__,
            InterventionHistory.__table__,
            AssessmentReport.__table__,
            EmergingGap.__table__,
            AuditLog.__table__,
        ]
        for table in student_tables:
            table.create(bind=eng, checkfirst=True)
        _student_db_initialized.add(safe)


def get_student_db(student_id: str):
    """
    Return a SQLAlchemy Session scoped to this student's PRIVATE database.

    Student data (attempts, mastery, misconceptions, reports) is written here.
    Curriculum data (questions, skills) must be fetched via get_db().

    Usage:
        db = get_student_db(student_id)
        try:
            ...
        finally:
            db.close()
    """
    _ensure_student_tables(student_id)
    eng = _get_student_engine(student_id)
    factory = sessionmaker(autocommit=False, autoflush=False, bind=eng)
    return factory()


def get_combined_db(student_id: str):
    """
    Returns (shared_db, student_db):
      - shared_db  → Session on the shared curriculum DB (chapters, skills, questions)
      - student_db → Session on this student's private DB (attempts, mastery, etc.)

    Both must be closed by the caller.
    """
    shared_db = SessionLocal()
    student_db = get_student_db(student_id)
    return shared_db, student_db


def reset_student_db(student_id: str):
    """Drop and recreate all tables in a student's private DB."""
    safe = _safe_id(student_id)
    eng = _get_student_engine(student_id)
    from app.models.all_models import (
        Student, Attempt, MasteryState, StudentMisconceptionInstance,
        InterventionHistory, AssessmentReport, EmergingGap, AuditLog
    )
    student_tables = [
        Student.__table__,
        Attempt.__table__,
        MasteryState.__table__,
        StudentMisconceptionInstance.__table__,
        InterventionHistory.__table__,
        AssessmentReport.__table__,
        EmergingGap.__table__,
        AuditLog.__table__,
    ]
    for table in reversed(student_tables):
        table.drop(bind=eng, checkfirst=True)
    for table in student_tables:
        table.create(bind=eng, checkfirst=True)
    _student_db_initialized.add(safe)


def reset_test_student_dbs():
    """Reset test student databases when force_reset is invoked."""
    import glob
    test_prefixes = ["student_test_", "student_harshit_", "student_alex_", "student_learner_", "student_e2e_", "student_usr_"]
    for prefix in test_prefixes:
        for db_file in glob.glob(str(_STUDENT_DB_DIR / f"{prefix}*.db")):
            p = Path(db_file)
            stem = p.stem
            safe = stem[len("student_"):] if stem.startswith("student_") else stem
            if safe in _student_engines:
                try:
                    _student_engines[safe].dispose()
                    del _student_engines[safe]
                except Exception:
                    pass
            _student_db_initialized.discard(safe)
            try:
                os.remove(db_file)
            except Exception:
                pass


def sync_student_from_shared(student_id: str, shared_db: Session):
    """Sync student profile, attempts, and masteries from shared DB to private student DB."""
    from app.models.all_models import (
        Student, Attempt, MasteryState, StudentMisconceptionInstance,
        InterventionHistory, AssessmentReport, EmergingGap, AuditLog
    )
    sdb = get_student_db(student_id)
    try:
        s = shared_db.query(Student).filter(Student.id == student_id).first()
        if s:
            existing_s = sdb.query(Student).filter(Student.id == student_id).first()
            if not existing_s:
                sdb.add(Student(
                    id=s.id, name=s.name, role=s.role or "student",
                    email=s.email, avatar_color=s.avatar_color or "#3B82F6",
                    target_goal=s.target_goal, goal_description=s.goal_description,
                    target_mastery=s.target_mastery or 0.85, created_at=s.created_at
                ))
            else:
                existing_s.name = s.name

        for m in shared_db.query(MasteryState).filter(MasteryState.student_id == student_id).all():
            existing_m = sdb.query(MasteryState).filter(MasteryState.id == m.id).first()
            if not existing_m:
                sdb.add(MasteryState(
                    id=m.id, student_id=m.student_id, skill_id=m.skill_id,
                    mastery_probability=m.mastery_probability, confidence=m.confidence,
                    evidence_count=m.evidence_count, history=m.history, last_updated=m.last_updated
                ))
            else:
                existing_m.mastery_probability = m.mastery_probability
                existing_m.evidence_count = m.evidence_count

        for smi in shared_db.query(StudentMisconceptionInstance).filter(StudentMisconceptionInstance.student_id == student_id).all():
            if not sdb.query(StudentMisconceptionInstance).filter(StudentMisconceptionInstance.id == smi.id).first():
                sdb.add(StudentMisconceptionInstance(
                    id=smi.id, student_id=smi.student_id, pattern_id=smi.pattern_id,
                    skill_id=smi.skill_id, status=smi.status, occurrences=smi.occurrences,
                    evidence_examples=smi.evidence_examples, first_detected=smi.first_detected,
                    last_detected=smi.last_detected
                ))

        for att in shared_db.query(Attempt).filter(Attempt.student_id == student_id).all():
            if not sdb.query(Attempt).filter(Attempt.id == att.id).first():
                sdb.add(Attempt(
                    id=att.id, student_id=att.student_id, question_id=att.question_id,
                    assessment_id=att.assessment_id, answer=att.answer,
                    work_shown=att.work_shown, input_mode=att.input_mode or "steps",
                    correct=att.correct, confidence=att.confidence or 0.5,
                    diagnosis=att.diagnosis, created_at=att.created_at
                ))

        for gap in shared_db.query(EmergingGap).filter(EmergingGap.student_id == student_id).all():
            if not sdb.query(EmergingGap).filter(EmergingGap.id == gap.id).first():
                sdb.add(EmergingGap(
                    id=gap.id, student_id=gap.student_id, skill_id=gap.skill_id,
                    title=gap.title, description=gap.description,
                    risk_level=gap.risk_level, trigger_reason=gap.trigger_reason,
                    detected_at=gap.detected_at, status=gap.status
                ))

        sdb.commit()
    finally:
        sdb.close()

