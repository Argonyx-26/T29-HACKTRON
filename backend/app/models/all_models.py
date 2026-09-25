from sqlalchemy import (
    Column, String, Integer, Float, Boolean, ForeignKey, DateTime, Text, JSON
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="student", nullable=False)  # student, teacher, admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    # Relationships
    twin = relationship("StudentTwin", back_populates="student", uselist=False, cascade="all, delete-orphan")
    submissions = relationship("AssessmentSubmission", back_populates="student", cascade="all, delete-orphan")
    interventions = relationship("Intervention", foreign_keys="Intervention.student_id", back_populates="student")
    group_memberships = relationship("GroupMember", back_populates="student", cascade="all, delete-orphan")

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    grade_level = Column(String(50), default="Grade 11-12")
    created_at = Column(DateTime(timezone=True), default=utc_now)

    # Relationships
    chapters = relationship("Chapter", back_populates="subject", cascade="all, delete-orphan")
    assessments = relationship("Assessment", back_populates="subject", cascade="all, delete-orphan")
    groups = relationship("Group", back_populates="subject", cascade="all, delete-orphan")

class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    subject_id = Column(String(36), ForeignKey("subjects.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    order_num = Column(Integer, default=1)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    # Relationships
    subject = relationship("Subject", back_populates="chapters")
    topics = relationship("Topic", back_populates="chapter", cascade="all, delete-orphan")
    assessments = relationship("Assessment", back_populates="chapter")

class Topic(Base):
    __tablename__ = "topics"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    chapter_id = Column(String(36), ForeignKey("chapters.id"), nullable=False, index=True)
    code = Column(String(50), index=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    difficulty = Column(Float, default=0.5)  # 0.0 (easiest) to 1.0 (hardest)
    prerequisite_topic_ids = Column(JSON, default=list)  # list of topic UUIDs
    created_at = Column(DateTime(timezone=True), default=utc_now)

    # Relationships
    chapter = relationship("Chapter", back_populates="topics")
    mastery_records = relationship("TopicMastery", back_populates="topic", cascade="all, delete-orphan")
    interventions = relationship("Intervention", back_populates="topic")

class StudentTwin(Base):
    """Digital Knowledge Twin representing the real-time cognitive model of a student."""
    __tablename__ = "student_twins"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False, index=True)
    overall_mastery = Column(Float, default=0.0)  # aggregate mastery 0.0 - 1.0
    cognitive_load = Column(Float, default=0.3)   # estimated cognitive strain 0.0 - 1.0
    learning_pace = Column(Float, default=1.0)    # relative speed multiplier
    retention_decay = Column(Float, default=0.05) # forgetting curve rate parameter
    last_synced_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    student = relationship("User", back_populates="twin")
    topic_masteries = relationship("TopicMastery", back_populates="twin", cascade="all, delete-orphan")

class TopicMastery(Base):
    """Deterministic mastery level of a single topic for a student's Knowledge Twin."""
    __tablename__ = "topic_masteries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    twin_id = Column(String(36), ForeignKey("student_twins.id"), nullable=False, index=True)
    topic_id = Column(String(36), ForeignKey("topics.id"), nullable=False, index=True)
    score = Column(Float, default=0.0)             # Mastery probability P(L_n), 0.0 - 1.0
    confidence = Column(Float, default=0.5)        # Confidence score 0.0 - 1.0
    attempts_count = Column(Integer, default=0)
    last_practiced = Column(DateTime(timezone=True), default=utc_now)
    status = Column(String(50), default="unseen")  # unseen, struggling, in_progress, mastered

    # Relationships
    twin = relationship("StudentTwin", back_populates="topic_masteries")
    topic = relationship("Topic", back_populates="mastery_records")

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    subject_id = Column(String(36), ForeignKey("subjects.id"), nullable=False, index=True)
    chapter_id = Column(String(36), ForeignKey("chapters.id"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    max_score = Column(Float, default=100.0)
    questions = Column(JSON, default=list)  # list of question schemas
    created_at = Column(DateTime(timezone=True), default=utc_now)

    # Relationships
    subject = relationship("Subject", back_populates="assessments")
    chapter = relationship("Chapter", back_populates="assessments")
    submissions = relationship("AssessmentSubmission", back_populates="assessment", cascade="all, delete-orphan")

class AssessmentSubmission(Base):
    __tablename__ = "assessment_submissions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    assessment_id = Column(String(36), ForeignKey("assessments.id"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    score = Column(Float, nullable=False)
    max_score = Column(Float, default=100.0)
    responses = Column(JSON, default=dict)
    submitted_at = Column(DateTime(timezone=True), default=utc_now)

    # Relationships
    assessment = relationship("Assessment", back_populates="submissions")
    student = relationship("User", back_populates="submissions")

class Group(Base):
    __tablename__ = "groups"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    subject_id = Column(String(36), ForeignKey("subjects.id"), nullable=True, index=True)
    description = Column(Text, nullable=True)
    cohort_year = Column(String(50), default="2026")
    created_at = Column(DateTime(timezone=True), default=utc_now)

    # Relationships
    subject = relationship("Subject", back_populates="groups")
    members = relationship("GroupMember", back_populates="group", cascade="all, delete-orphan")

class GroupMember(Base):
    __tablename__ = "group_members"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    group_id = Column(String(36), ForeignKey("groups.id"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    joined_at = Column(DateTime(timezone=True), default=utc_now)

    # Relationships
    group = relationship("Group", back_populates="members")
    student = relationship("User", back_populates="group_memberships")

class Intervention(Base):
    __tablename__ = "interventions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    topic_id = Column(String(36), ForeignKey("topics.id"), nullable=False, index=True)
    teacher_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    type = Column(String(50), default="remedial_material")  # peer_tutoring, remedial_material, teacher_1on1, practice_drill
    status = Column(String(50), default="recommended")       # recommended, scheduled, completed, dismissed
    recommendation_reason = Column(Text, nullable=True)
    action_plan = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    # Relationships
    student = relationship("User", foreign_keys=[student_id], back_populates="interventions")
    topic = relationship("Topic", back_populates="interventions")

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_size = Column(Integer, default=0)
    mime_type = Column(String(100), default="application/pdf")
    parsed_content = Column(Text, nullable=True)
    status = Column(String(50), default="uploaded")  # uploaded, processing, processed, failed
    uploaded_at = Column(DateTime(timezone=True), default=utc_now)
