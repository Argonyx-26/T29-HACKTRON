"""
student_models.py — Per-Student Private Data Models
=====================================================
These models live in each student's private SQLite database (students/student_<id>.db).
No student can ever access another student's data — they're physically in separate files.

Shared curriculum models (Chapter, Skill, Question, MisconceptionPattern, Intervention)
remain in all_models.py and use the shared knowledge_twin.db.
"""

import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, JSON
)
from sqlalchemy.orm import declarative_base

# Separate Base so student tables are created in the student's own DB
StudentBase = declarative_base()


class StudentRecord(StudentBase):
    """Mirrors the Student row — one record per student's own DB."""
    __tablename__ = "student_profile"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    role = Column(String, default="student")
    email = Column(String, nullable=True)
    avatar_color = Column(String, default="#3B82F6")
    target_goal = Column(String, nullable=True)
    goal_description = Column(Text, nullable=True)
    target_mastery = Column(Float, default=0.85)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class StudentAttempt(StudentBase):
    """A single diagnostic / assessment attempt by this student."""
    __tablename__ = "attempts"

    id = Column(String, primary_key=True, index=True)
    student_id = Column(String, nullable=False, index=True)
    question_id = Column(String, nullable=False, index=True)
    assessment_id = Column(String, nullable=True)
    answer = Column(String, nullable=False)
    work_shown = Column(JSON, default=list)
    input_mode = Column(String, default="steps")
    correct = Column(Boolean, nullable=False)
    confidence = Column(Float, default=0.5)
    diagnosis = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class StudentMasteryState(StudentBase):
    """Bayesian Knowledge Tracing mastery estimate per skill."""
    __tablename__ = "mastery_states"

    id = Column(String, primary_key=True, index=True)
    student_id = Column(String, nullable=False, index=True)
    skill_id = Column(String, nullable=False, index=True)
    mastery_probability = Column(Float, default=0.30)
    confidence = Column(Float, default=0.0)
    evidence_count = Column(Integer, default=0)
    history = Column(JSON, default=list)
    last_updated = Column(DateTime, default=datetime.datetime.utcnow)


class StudentMisconceptionInstance(StudentBase):
    """A detected misconception instance for this student."""
    __tablename__ = "student_misconception_instances"

    id = Column(String, primary_key=True, index=True)
    student_id = Column(String, nullable=False, index=True)
    pattern_id = Column(String, nullable=False)
    skill_id = Column(String, nullable=False)
    status = Column(String, default="active")
    occurrences = Column(Integer, default=1)
    evidence_examples = Column(JSON, default=list)
    first_detected = Column(DateTime, default=datetime.datetime.utcnow)
    last_detected = Column(DateTime, default=datetime.datetime.utcnow)
    resolution_history = Column(JSON, default=list)


class StudentInterventionHistory(StudentBase):
    """Record of an intervention completed by this student."""
    __tablename__ = "intervention_histories"

    id = Column(String, primary_key=True, index=True)
    student_id = Column(String, nullable=False, index=True)
    intervention_id = Column(String, nullable=False)
    skill_id = Column(String, nullable=False)
    pattern_id = Column(String, nullable=True)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String, default="completed")
    before_mastery = Column(Float, nullable=False)
    after_mastery = Column(Float, nullable=True)
    retest_attempt_id = Column(String, nullable=True)
    retest_result = Column(JSON, default=dict)


class StudentAssessmentReport(StudentBase):
    """A completed diagnostic assessment report for this student."""
    __tablename__ = "assessment_reports"

    id = Column(String, primary_key=True, index=True)
    student_id = Column(String, nullable=False, index=True)
    chapter_id = Column(String, nullable=True)
    chapter_title = Column(String, nullable=False)
    total_questions = Column(Integer, default=0)
    attempted_count = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    incorrect_count = Column(Integer, default=0)
    score_percent = Column(Integer, default=0)
    evaluated_items = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class StudentEmergingGap(StudentBase):
    """An emerging knowledge gap detected for this student."""
    __tablename__ = "emerging_gaps"

    id = Column(String, primary_key=True, index=True)
    student_id = Column(String, nullable=False, index=True)
    skill_id = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    risk_level = Column(String, default="moderate")
    trigger_reason = Column(String, nullable=False)
    detected_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="active")


class StudentAuditLog(StudentBase):
    """Audit trail for this student's actions."""
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, index=True)
    event_type = Column(String, nullable=False)
    student_id = Column(String, nullable=True)
    details = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
