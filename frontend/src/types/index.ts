export interface User {
  user_id: string;
  display_name: string;
  role: 'student' | 'teacher';
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  chapters_count: number;
}

export interface Student {
  id: string;
  name: string;
  email?: string;
  avatar_color: string;
}

export interface Skill {
  id: string;
  code: string;
  name: string;
  description?: string;
  prerequisite_skill_ids: string[];
  difficulty: string;
  order: number;
}

export interface Question {
  id: string;
  chapter_id: string;
  skill_id: string;
  question_text: string;
  correct_answer: string;
  expected_steps: string[];
  difficulty: string;
  source_type: string;
  source_reference?: Record<string, any>;
  diagnostic_tags?: string[];
}

export interface Chapter {
  id: string;
  title: string;
  subject: string;
  description?: string;
  source_type: string;
  source_document_id?: string;
  skills_count?: number;
  questions_count?: number;
  skills?: Skill[];
}

export interface SkillMasteryInfo {
  skill_id: string;
  skill_code: string;
  skill_name: string;
  order: number;
  mastery_probability: number;
  confidence: number;
  confidence_label: string;
  evidence_count: number;
  trend: string;
  prerequisites: string[];
  prerequisite_gap: boolean;
}

export interface MistakeCard {
  misconception_name: string;
  skill_name: string;
  what_you_did: string;
  why_it_is_wrong: string;
  correct_principle: string;
  occurrences: number;
  status: string;
  recommended_intervention: string;
}

export interface ActiveMisconception {
  id: string;
  pattern_id: string;
  pattern_name: string;
  skill_name: string;
  skill_code: string;
  skill_id?: string;
  classification: string;
  occurrences: number;
  why_it_is_wrong: string;
  correct_principle: string;
  first_detected: string;
  last_detected: string;
  recommended_intervention: string;
}

export interface EmergingGap {
  id: string;
  title: string;
  description: string;
  risk_level: string;
  trigger_reason: string;
  skill_name: string;
}

export interface InterventionHistoryItem {
  id: string;
  title: string;
  type: string;
  before_mastery: number;
  after_mastery: number;
  delta: number;
  completed_at: string;
}

export interface KnowledgeTwinView {
  student_id: string;
  student_name: string;
  avatar_color: string;
  current_chapter_id?: string | null;
  current_chapter_title?: string | null;
  current_subject?: string | null;
  overall_score_percentage: number | null;
  overall_mastery: number | null;
  skills: SkillMasteryInfo[];
  active_misconceptions: ActiveMisconception[];
  resolved_misconceptions: Array<{
    id: string;
    pattern_name: string;
    skill_name: string;
    resolution_history: any[];
  }>;
  emerging_gaps: EmergingGap[];
  recent_interventions: InterventionHistoryItem[];
}

export interface DiagnosisResult {
  attempt_id: string;
  correct: boolean;
  evaluated_answer: string;
  engine_used: "deterministic" | "llm_fallback" | "none";
  rule_id?: string;
  classification?: string;
  likely_misconception?: string;
  explanation?: string;
  mistake_card?: MistakeCard;
  twin_updated: boolean;
  new_pattern_discovered: boolean;
  pattern_library_count: number;
  mastery_delta?: {
    skill_id: string;
    new_mastery: number;
    confidence: number;
    evidence_count: number;
  };
}

export interface RetestResult {
  correct: boolean;
  before_mastery: number;
  after_mastery: number;
  delta_percentage: number;
  improvement_delta?: number;
  misconception_resolved: boolean;
  skill_name: string;
  message: string;
}

export interface SameScoreComparison {
  target_score: number;
  headline: string;
  student_a: {
    id?: string;
    name: string;
    score: number;
    diagnosis_type: string;
    primary_weakness: string;
    strengths?: string;
    active_misconception: string;
    detected_via?: string;
    intervention_assigned?: string;
    recommended_next_step?: string;
    twin_color?: string;
  };
  student_b: {
    id?: string;
    name: string;
    score: number;
    diagnosis_type: string;
    primary_weakness: string;
    strengths?: string;
    active_misconception: string;
    detected_via?: string;
    intervention_assigned?: string;
    recommended_next_step?: string;
    twin_color?: string;
  };
  core_thesis: string;
}

export interface TeacherOverview {
  students: Array<{
    id: string;
    name: string;
    score_percentage: number;
    overall_mastery: number;
    active_misconceptions_count: number;
    primary_gap: string;
    skills_mastery: Record<string, number>;
  }>;
  heatmap: Array<{
    student_id: string;
    student_name: string;
    pattern_id: string;
    pattern_name: string;
    skill_id: string;
    status: string;
    occurrences: number;
  }>;
  patterns: Array<{ id: string; name: string }>;
  same_score_comparison: SameScoreComparison;
}

export interface EvaluatedTestItem {
  question: Question;
  studentAnswer: string;
  workShown: string[];
  diagnosis: DiagnosisResult;
}

export interface AssessmentReport {
  id: string;
  student_id: string;
  chapter_id?: string;
  chapter_title: string;
  total_questions: number;
  attempted_count: number;
  correct_count: number;
  incorrect_count: number;
  score_percent: number;
  evaluated_items: EvaluatedTestItem[];
  created_at?: string;
}

export type MemoryStatus = 'strong' | 'stable' | 'fading' | 'at_risk';

export interface MemorySkill {
  skill_id: string;
  skill_code: string;
  skill_name: string;
  chapter_id?: string;
  chapter_title?: string;
  current_mastery: number;
  retrievability: number;
  status: MemoryStatus;
  stability_days: number;
  days_since_review: number;
  next_review: string;
  review_urgency: 'low' | 'medium' | 'high';
  evidence_count: number;
}

export interface RevisionPracticeQuestion {
  question_id: string;
  skill_id: string;
  skill_code: string;
  skill_name: string;
  question_text: string;
  correct_answer: string;
  difficulty: string;
}

export interface RevisionOverview {
  student_id: string;
  student_name: string;
  retention_resilience_index: number;
  total_skills_tracked: number;
  needs_practice_today_count: number;
  status_counts: {
    strong: number;
    stable: number;
    fading: number;
    at_risk: number;
  };
  scheduled_session: {
    title: string;
    recommended_for: string;
    estimated_minutes: number;
    questions_count: number;
    rationale: string;
  };
  practice_questions: RevisionPracticeQuestion[];
  buckets: {
    strong: MemorySkill[];
    stable: MemorySkill[];
    fading: MemorySkill[];
    at_risk: MemorySkill[];
  };
  all_skills: MemorySkill[];
}

export interface RevisionPracticeResult {
  success: boolean;
  total_questions: number;
  correct_count: number;
  accuracy_percentage: number;
  message: string;
  results: Array<{
    question_id: string;
    skill_id: string;
    skill_code: string;
    skill_name: string;
    user_answer: string;
    correct_answer: string;
    is_correct: boolean;
    new_mastery: number;
    boosted_status: string;
  }>;
}

