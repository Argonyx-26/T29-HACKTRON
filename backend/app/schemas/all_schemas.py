from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

# ----------------- User Schemas -----------------
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "student"

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ----------------- Topic Schemas -----------------
class TopicBase(BaseModel):
    code: str
    title: str
    description: Optional[str] = None
    difficulty: float = 0.5
    prerequisite_topic_ids: List[str] = Field(default_factory=list)

class TopicCreate(TopicBase):
    chapter_id: str

class TopicResponse(TopicBase):
    id: str
    chapter_id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ----------------- Chapter Schemas -----------------
class ChapterBase(BaseModel):
    title: str
    order_num: int = 1
    description: Optional[str] = None

class ChapterCreate(ChapterBase):
    subject_id: str

class ChapterResponse(ChapterBase):
    id: str
    subject_id: str
    created_at: datetime
    topics: List[TopicResponse] = Field(default_factory=list)
    model_config = ConfigDict(from_attributes=True)

# ----------------- Subject Schemas -----------------
class SubjectBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    grade_level: str = "Grade 11-12"

class SubjectCreate(SubjectBase):
    pass

class SubjectResponse(SubjectBase):
    id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class SubjectDetailResponse(SubjectResponse):
    chapters: List[ChapterResponse] = Field(default_factory=list)

# ----------------- Knowledge Twin & Mastery Schemas -----------------
class TopicMasteryBase(BaseModel):
    score: float = Field(ge=0.0, le=1.0)
    confidence: float = Field(default=0.5, ge=0.0, le=1.0)
    attempts_count: int = 0
    status: str = "unseen"

class TopicMasteryResponse(TopicMasteryBase):
    id: str
    twin_id: str
    topic_id: str
    topic_title: Optional[str] = None
    topic_code: Optional[str] = None
    last_practiced: datetime
    model_config = ConfigDict(from_attributes=True)

class StudentTwinResponse(BaseModel):
    id: str
    student_id: str
    overall_mastery: float
    cognitive_load: float
    learning_pace: float
    retention_decay: float
    last_synced_at: datetime
    topic_masteries: List[TopicMasteryResponse] = Field(default_factory=list)
    model_config = ConfigDict(from_attributes=True)

class KnowledgeNode(BaseModel):
    id: str
    label: str
    code: str
    mastery: float
    status: str
    difficulty: float
    prerequisites: List[str]

class KnowledgeGraphResponse(BaseModel):
    student_id: str
    twin_id: str
    overall_mastery: float
    nodes: List[KnowledgeNode]
    edges: List[Dict[str, str]]

# ----------------- Assessment Schemas -----------------
class AssessmentBase(BaseModel):
    title: str
    subject_id: str
    chapter_id: Optional[str] = None
    description: Optional[str] = None
    max_score: float = 100.0
    questions: List[Dict[str, Any]] = Field(default_factory=list)

class AssessmentCreate(AssessmentBase):
    pass

class AssessmentResponse(AssessmentBase):
    id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class SubmissionCreate(BaseModel):
    assessment_id: str
    student_id: str
    score: float
    max_score: float = 100.0
    responses: Dict[str, Any] = Field(default_factory=dict)

class SubmissionResponse(BaseModel):
    id: str
    assessment_id: str
    student_id: str
    score: float
    max_score: float
    submitted_at: datetime
    twin_mastery_updated: bool = True
    model_config = ConfigDict(from_attributes=True)

# ----------------- Group Schemas -----------------
class GroupBase(BaseModel):
    name: str
    subject_id: Optional[str] = None
    description: Optional[str] = None
    cohort_year: str = "2026"

class GroupCreate(GroupBase):
    pass

class GroupMemberResponse(BaseModel):
    id: str
    group_id: str
    student_id: str
    joined_at: datetime
    model_config = ConfigDict(from_attributes=True)

class GroupResponse(GroupBase):
    id: str
    created_at: datetime
    members: List[GroupMemberResponse] = Field(default_factory=list)
    model_config = ConfigDict(from_attributes=True)

# ----------------- Intervention Schemas -----------------
class InterventionBase(BaseModel):
    student_id: str
    topic_id: str
    teacher_id: Optional[str] = None
    type: str = "remedial_material"
    recommendation_reason: Optional[str] = None
    action_plan: Optional[str] = None

class InterventionCreate(InterventionBase):
    pass

class InterventionStatusUpdate(BaseModel):
    status: str

class InterventionResponse(InterventionBase):
    id: str
    status: str
    created_at: datetime
    student_name: Optional[str] = None
    topic_title: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# ----------------- Document Schemas -----------------
class DocumentResponse(BaseModel):
    id: str
    title: str
    file_path: str
    file_size: int
    mime_type: str
    status: str
    uploaded_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ----------------- Analytics Schemas -----------------
class CohortOverview(BaseModel):
    total_students: int
    avg_cohort_mastery: float
    struggling_students_count: int
    mastered_students_count: int
    at_risk_percentage: float

class TopicStruggleAnalysis(BaseModel):
    topic_id: str
    topic_code: str
    topic_title: str
    avg_mastery: float
    students_struggling_count: int
