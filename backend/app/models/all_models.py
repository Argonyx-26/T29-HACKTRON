import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from app.database import Base

class Student(Base):
    __tablename__ = "students"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    role = Column(String, default="student")
    email = Column(String, nullable=True)
    avatar_color = Column(String, default="#3B82F6")
    target_goal = Column(String, nullable=True)
    goal_description = Column(Text, nullable=True)
    target_mastery = Column(Float, default=0.85)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    attempts = relationship("Attempt", back_populates="student", cascade="all, delete-orphan")
    mastery_states = relationship("MasteryState", back_populates="student", cascade="all, delete-orphan")
    misconception_instances = relationship("StudentMisconceptionInstance", back_populates="student", cascade="all, delete-orphan")
    intervention_histories = relationship("InterventionHistory", back_populates="student", cascade="all, delete-orphan")
    emerging_gaps = relationship("EmergingGap", back_populates="student", cascade="all, delete-orphan")

class TeacherDemo(Base):
    __tablename__ = "teachers"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    classroom = Column(String, default="Cohort 101")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Chapter(Base):
    __tablename__ = "chapters"
    
    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    subject = Column(String, default="General")
    description = Column(Text, nullable=True)
    source_type = Column(String, default="curated") # "curated" or "uploaded_pdf"
    source_document_id = Column(String, nullable=True)
    creator_id = Column(String, nullable=True, index=True)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    skills = relationship("Skill", back_populates="chapter", cascade="all, delete-orphan", order_by="Skill.order")
    questions = relationship("Question", back_populates="chapter", cascade="all, delete-orphan")

class Skill(Base):
    __tablename__ = "skills"
    
    id = Column(String, primary_key=True, index=True)
    chapter_id = Column(String, ForeignKey("chapters.id"), nullable=False)
    code = Column(String, nullable=False) # e.g. "EQ-01", "DIST-04"
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    prerequisite_skill_ids = Column(JSON, default=list) # e.g. ["EQ-01", "SIMP-02"]
    difficulty = Column(String, default="medium") # "easy", "medium", "hard"
    order = Column(Integer, default=1)
    
    chapter = relationship("Chapter", back_populates="skills")
    questions = relationship("Question", back_populates="skill")
    patterns = relationship("MisconceptionPattern", back_populates="skill")
    mastery_states = relationship("MasteryState", back_populates="skill")

class Concept(Base):
    __tablename__ = "concepts"
    
    id = Column(String, primary_key=True, index=True)
    chapter_id = Column(String, ForeignKey("chapters.id"), nullable=False)
    skill_id = Column(String, ForeignKey("skills.id"), nullable=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    source_section = Column(String, nullable=True)

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(String, primary_key=True, index=True)
    chapter_id = Column(String, ForeignKey("chapters.id"), nullable=False)
    skill_id = Column(String, ForeignKey("skills.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    correct_answer = Column(String, nullable=False)
    expected_steps = Column(JSON, default=list) # List of step strings
    difficulty = Column(String, default="medium") # "easy", "medium", "hard"
    source_type = Column(String, default="curated") # "curated" or "uploaded_pdf"
    source_reference = Column(JSON, default=dict) # {"document": "...", "section": "..."}
    diagnostic_tags = Column(JSON, default=list)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    chapter = relationship("Chapter", back_populates="questions")
    skill = relationship("Skill", back_populates="questions")
    attempts = relationship("Attempt", back_populates="question")

class MisconceptionPattern(Base):
    __tablename__ = "misconception_patterns"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    subject = Column(String, default="Mathematics")
    skill_id = Column(String, ForeignKey("skills.id"), nullable=False)
    rule_type = Column(String, nullable=False) # DISTRIBUTION_CHECK, SIGN_CHECK, etc.
    rule_config = Column(JSON, default=dict) # Config parameters for deterministic engine
    classification = Column(String, default="procedural") # conceptual, procedural, careless, prerequisite_gap
    intervention_type = Column(String, default="worked_example") # worked_example, conceptual_review, guided_practice, prerequisite_remediation
    principle_text = Column(Text, nullable=True)
    example_wrong = Column(String, nullable=True)
    example_correct = Column(String, nullable=True)
    source = Column(String, default="curated") # "curated" or "llm_generalized"
    status = Column(String, default="active") # "active", "candidate", "deprecated"
    occurrences = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    skill = relationship("Skill", back_populates="patterns")

class Assessment(Base):
    __tablename__ = "assessments"
    
    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    chapter_id = Column(String, ForeignKey("chapters.id"), nullable=False)
    total_questions = Column(Integer, default=6)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AssessmentReport(Base):
    __tablename__ = "assessment_reports"
    
    id = Column(String, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("students.id"), nullable=False, index=True)
    chapter_id = Column(String, ForeignKey("chapters.id"), nullable=True)
    chapter_title = Column(String, nullable=False)
    total_questions = Column(Integer, default=0)
    attempted_count = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    incorrect_count = Column(Integer, default=0)
    score_percent = Column(Integer, default=0)
    evaluated_items = Column(JSON, default=list) # [{ question, studentAnswer, workShown, diagnosis }]
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    student = relationship("Student")
    chapter = relationship("Chapter")

class Attempt(Base):
    __tablename__ = "attempts"
    
    id = Column(String, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("students.id"), nullable=False)
    question_id = Column(String, ForeignKey("questions.id"), nullable=False)
    assessment_id = Column(String, nullable=True)
    answer = Column(String, nullable=False)
    work_shown = Column(JSON, default=list) # list of student steps
    input_mode = Column(String, default="steps") # "notebook_photo", "steps", "answer_only"
    correct = Column(Boolean, nullable=False)
    confidence = Column(Float, default=0.5)
    diagnosis = Column(JSON, default=dict) # {rule_id, engine, classification, explanation, ...}
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    student = relationship("Student", back_populates="attempts")
    question = relationship("Question", back_populates="attempts")

class StudentMisconceptionInstance(Base):
    __tablename__ = "student_misconception_instances"
    
    id = Column(String, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("students.id"), nullable=False)
    pattern_id = Column(String, ForeignKey("misconception_patterns.id"), nullable=False)
    skill_id = Column(String, ForeignKey("skills.id"), nullable=False)
    status = Column(String, default="active") # "active", "resolved", "recurring"
    occurrences = Column(Integer, default=1)
    evidence_examples = Column(JSON, default=list) # work snippets
    first_detected = Column(DateTime, default=datetime.datetime.utcnow)
    last_detected = Column(DateTime, default=datetime.datetime.utcnow)
    resolution_history = Column(JSON, default=list) # timestamps & delta
    
    student = relationship("Student", back_populates="misconception_instances")
    pattern = relationship("MisconceptionPattern")
    skill = relationship("Skill")

class MasteryState(Base):
    __tablename__ = "mastery_states"
    
    id = Column(String, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("students.id"), nullable=False)
    skill_id = Column(String, ForeignKey("skills.id"), nullable=False)
    mastery_probability = Column(Float, default=0.30)
    confidence = Column(Float, default=0.0)
    evidence_count = Column(Integer, default=0)
    history = Column(JSON, default=list) # [{timestamp, p_mastery, event}]
    last_updated = Column(DateTime, default=datetime.datetime.utcnow)
    
    student = relationship("Student", back_populates="mastery_states")
    skill = relationship("Skill", back_populates="mastery_states")

class EmergingGap(Base):
    __tablename__ = "emerging_gaps"
    
    id = Column(String, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("students.id"), nullable=False)
    skill_id = Column(String, ForeignKey("skills.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    risk_level = Column(String, default="moderate") # "low", "moderate", "high"
    trigger_reason = Column(String, nullable=False)
    detected_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="active") # "active", "mitigated"
    
    student = relationship("Student", back_populates="emerging_gaps")
    skill = relationship("Skill")

class Intervention(Base):
    __tablename__ = "interventions"
    
    id = Column(String, primary_key=True, index=True)
    pattern_id = Column(String, ForeignKey("misconception_patterns.id"), nullable=True)
    skill_id = Column(String, ForeignKey("skills.id"), nullable=False)
    intervention_type = Column(String, nullable=False) # "worked_example", "guided_practice", "conceptual_review", "prerequisite_remediation"
    title = Column(String, nullable=False)
    content = Column(JSON, nullable=False) # structured worked steps, tips, visual callouts
    target_misconception = Column(String, nullable=True)
    practice_question_ids = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class InterventionHistory(Base):
    __tablename__ = "intervention_histories"
    
    id = Column(String, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("students.id"), nullable=False)
    intervention_id = Column(String, ForeignKey("interventions.id"), nullable=False)
    skill_id = Column(String, ForeignKey("skills.id"), nullable=False)
    pattern_id = Column(String, nullable=True)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String, default="completed") # "in_progress", "completed"
    before_mastery = Column(Float, nullable=False)
    after_mastery = Column(Float, nullable=True)
    retest_attempt_id = Column(String, nullable=True)
    retest_result = Column(JSON, default=dict)
    
    student = relationship("Student", back_populates="intervention_histories")
    intervention = relationship("Intervention")
    skill = relationship("Skill")

class UploadedDocument(Base):
    __tablename__ = "uploaded_documents"
    
    id = Column(String, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size_bytes = Column(Integer, default=0)
    mime_type = Column(String, default="application/pdf")
    status = Column(String, default="processing") # "uploading", "reading", "extracting", "ready", "failed"
    progress_percent = Column(Integer, default=0)
    current_stage = Column(String, default="uploading")
    error_message = Column(Text, nullable=True)
    chapter_id = Column(String, nullable=True)
    student_id = Column(String, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ContentExtraction(Base):
    __tablename__ = "content_extractions"
    
    id = Column(String, primary_key=True, index=True)
    document_id = Column(String, ForeignKey("uploaded_documents.id"), nullable=False)
    extracted_text_preview = Column(Text, nullable=True)
    extracted_concepts = Column(JSON, default=list)
    extracted_skills = Column(JSON, default=list)
    extracted_questions = Column(JSON, default=list)
    raw_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String, primary_key=True, index=True)
    event_type = Column(String, nullable=False) # "assessment_started", "misconception_detected", etc.
    student_id = Column(String, nullable=True)
    details = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class LLMRequestLog(Base):
    __tablename__ = "llm_request_logs"
    
    id = Column(String, primary_key=True, index=True)
    request_id = Column(String, nullable=False)
    provider = Column(String, default="gemini")
    key_slot = Column(String, default="primary") # "primary", "secondary", "fallback"
    model = Column(String, default="gemini-2.5-flash")
    success = Column(Boolean, default=True)
    failure_reason = Column(String, nullable=True)
    latency_ms = Column(Integer, default=0)
    tokens_used = Column(Integer, default=0)
    classification_returned = Column(String, nullable=True)
    reusable_pattern_detected = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class StudyGroup(Base):
    __tablename__ = "study_groups"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    subject = Column(String, default="Mathematics")
    code = Column(String, unique=True, index=True, nullable=False) # e.g. "KT-ALG-742"
    description = Column(Text, nullable=True)
    target_goal = Column(String, nullable=True)
    goal_progress = Column(Integer, default=0)
    member_count = Column(Integer, default=1)
    shared_materials = Column(JSON, default=list) # [{title, type, date, url}]
    collaborative_prompts = Column(JSON, default=list) # [{prompt, skill, completedCount}]
    recent_activity = Column(JSON, default=list) # [{user, action, time}]
    creator_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

