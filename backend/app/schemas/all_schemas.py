from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, ConfigDict
import datetime

# --- Strict LLM Diagnosis Schema ---
class LLMDiagnosisSchema(BaseModel):
    classification: Literal["conceptual", "procedural", "careless", "prerequisite_gap"] = Field(
        ..., description="Root cause taxonomy of student error"
    )
    likely_misconception: str = Field(
        ..., description="Clear concise title of the misconception identified"
    )
    confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Confidence in diagnosis between 0.0 and 1.0"
    )
    reasoning: str = Field(
        ..., description="Detailed diagnostic reasoning referencing student's step transition"
    )
    reusable_pattern: bool = Field(
        ..., description="Whether this represents a generalizable pattern to save to the library"
    )
    principle_violated: Optional[str] = Field(
        None, description="The formal mathematical/scientific law or principle violated"
    )

# --- Curriculum & Question Schemas ---
class SkillBase(BaseModel):
    id: str
    code: str
    name: str
    description: Optional[str] = None
    prerequisite_skill_ids: List[str] = []
    difficulty: str = "medium"
    order: int = 1

    model_config = ConfigDict(from_attributes=True)

class QuestionBase(BaseModel):
    id: str
    chapter_id: str
    skill_id: str
    question_text: str
    correct_answer: str
    expected_steps: List[str] = []
    difficulty: str = "medium"
    source_type: str = "curated"
    source_reference: Dict[str, Any] = {}
    diagnostic_tags: List[str] = []
    active: bool = True

    model_config = ConfigDict(from_attributes=True)

class ChapterDetail(BaseModel):
    id: str
    title: str
    subject: str
    description: Optional[str] = None
    source_type: str = "curated"
    skills: List[SkillBase] = []

    model_config = ConfigDict(from_attributes=True)

# --- Student Goal Schema ---
class StudentGoalUpdate(BaseModel):
    target_goal: Optional[str] = None
    goal_description: Optional[str] = None
    target_mastery: Optional[float] = 0.85

# --- Student Attempt & Diagnosis Schemas ---
class AttemptSubmission(BaseModel):
    student_id: str
    question_id: str
    answer: str
    work_shown: List[str] = []
    input_mode: str = "steps" # "notebook_photo", "steps", "answer_only"
    confidence: Optional[float] = 0.5 # Student-reported confidence before submitting (0.0 to 1.0)

class MistakeCard(BaseModel):
    misconception_name: str
    skill_name: str
    what_you_did: str
    why_it_is_wrong: str
    correct_principle: str
    occurrences: int = 1
    status: str = "active"
    recommended_intervention: str

class DiagnosisResult(BaseModel):
    attempt_id: str
    correct: bool
    evaluated_answer: str
    engine_used: Literal["deterministic", "llm_fallback", "none"]
    rule_id: Optional[str] = None
    classification: Optional[str] = None
    likely_misconception: Optional[str] = None
    explanation: Optional[str] = None
    mistake_card: Optional[MistakeCard] = None
    twin_updated: bool = True
    new_pattern_discovered: bool = False
    pattern_library_count: int = 18
    mastery_delta: Dict[str, Any] = {}

# --- Knowledge Twin Schemas ---
class SkillMasteryInfo(BaseModel):
    skill_id: str
    skill_code: str
    skill_name: str
    order: int
    mastery_probability: float
    confidence: float
    confidence_label: str # "Low", "Moderate", "High", "Not yet assessed"
    evidence_count: int
    trend: str # "improving", "steady", "declining", "unassessed"
    prerequisites: List[str] = []
    prerequisite_gap: bool = False

class SkillGapInfo(BaseModel):
    skill_id: str
    skill_code: str
    skill_name: str
    current_mastery: float
    target_mastery: float
    gap_size: float
    confidence: float
    confidence_label: str
    evidence_count: int
    is_blocking: bool = False
    blocked_by: List[str] = []
    goal_relevance: str = "Medium" # "High", "Medium", "Low"
    recommended_action: str # "Intervention", "Prerequisite Review", "Practice", "Mastered"

class NextBestActionInfo(BaseModel):
    action_type: str # "complete_diagnostic", "targeted_intervention", "prerequisite_rescue", "practice_skill", "advance_next_chapter"
    title: str
    subtitle: str
    reason: str
    button_label: str
    target_skill_id: Optional[str] = None
    target_skill_code: Optional[str] = None
    target_chapter_id: Optional[str] = None
    pattern_id: Optional[str] = None
    classification: Optional[str] = None

class CalibrationInsight(BaseModel):
    status: str # "calibrated", "overconfident", "underconfident", "insufficient_evidence"
    sample_count: int
    supported_knowledge_pct: float
    overconfidence_pct: float
    underconfidence_pct: float
    summary: str

class KnowledgeTwinView(BaseModel):
    student_id: str
    student_name: str
    avatar_color: Optional[str] = "#3B82F6"
    current_chapter_id: Optional[str] = None
    current_chapter_title: Optional[str] = None
    current_subject: Optional[str] = None
    overall_score_percentage: Optional[float] = None
    overall_mastery: Optional[float] = None
    target_goal: Optional[str] = None
    goal_description: Optional[str] = None
    target_mastery: float = 0.85
    skills: List[SkillMasteryInfo] = []
    skill_gaps: List[SkillGapInfo] = []
    next_best_action: Optional[NextBestActionInfo] = None
    calibration_insight: Optional[CalibrationInsight] = None
    prerequisite_rescues: List[Dict[str, Any]] = []
    active_misconceptions: List[Dict[str, Any]] = []
    resolved_misconceptions: List[Dict[str, Any]] = []
    emerging_gaps: List[Dict[str, Any]] = []
    recent_interventions: List[Dict[str, Any]] = []

# --- Intervention & Retest Schemas ---
class RetestSubmission(BaseModel):
    student_id: str
    intervention_id: str
    question_id: str
    answer: str
    work_shown: List[str] = []

class RetestResult(BaseModel):
    correct: bool
    before_mastery: float
    after_mastery: float
    delta_percentage: float
    misconception_resolved: bool
    skill_name: str
    message: str

# --- Teacher & Analytics Schemas ---
class StudentSummary(BaseModel):
    id: str
    name: str
    score_percentage: float
    overall_mastery: float
    confidence_avg: float
    active_misconceptions_count: int
    primary_gap: Optional[str] = None
    recent_intervention: Optional[str] = None

class HeatmapCell(BaseModel):
    student_id: str
    student_name: str
    pattern_id: str
    pattern_name: str
    skill_code: str
    status: str # "active", "resolved", "none"
    occurrences: int

class SameScoreComparison(BaseModel):
    target_score: float = 60.0
    student_a: Dict[str, Any] # Maya
    student_b: Dict[str, Any] # Arjun
    key_takeaway: str

# --- Document Upload Schemas ---
class DocumentUploadResponse(BaseModel):
    document_id: str
    filename: str
    status: str
    current_stage: str
    progress_percent: int

class DocumentStatusResponse(BaseModel):
    document_id: str
    filename: str
    status: str
    current_stage: str
    progress_percent: int
    chapter_id: Optional[str] = None
    extracted_summary: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

# --- Assessment Report Schemas ---
class AssessmentReportCreate(BaseModel):
    id: Optional[str] = None
    student_id: str
    chapter_id: Optional[str] = None
    chapter_title: str
    total_questions: int
    attempted_count: int
    correct_count: int
    incorrect_count: int
    score_percent: int
    evaluated_items: List[Dict[str, Any]] = []

class AssessmentReportResponse(BaseModel):
    id: str
    student_id: str
    chapter_id: Optional[str] = None
    chapter_title: str
    total_questions: int
    attempted_count: int
    correct_count: int
    incorrect_count: int
    score_percent: int
    evaluated_items: List[Dict[str, Any]] = []
    created_at: Optional[Any] = None

    model_config = ConfigDict(from_attributes=True)
