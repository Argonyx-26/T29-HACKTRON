export type UserRole = 'student' | 'teacher' | 'admin' | 'guest';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  gradeLevel?: string;
  streakDays: number;
  totalPoints: number;
}

export type MasteryState = 'not_started' | 'emerging' | 'developing' | 'proficient' | 'mastered';

export interface KnowledgeConcept {
  id: string;
  title: string;
  domain: string;
  description: string;
  masteryLevel: number; // 0 - 100
  status: MasteryState;
  prerequisites: string[];
  cognitiveLoad: 'low' | 'medium' | 'high';
  lastPracticed?: string;
}

export interface TwinMessage {
  id: string;
  sender: 'user' | 'twin' | 'system';
  content: string;
  timestamp: string;
  conceptRefs?: string[];
  suggestedActions?: { label: string; action: string }[];
}

export interface Question {
  id: string;
  conceptId: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface DiagnosticAssessment {
  id: string;
  title: string;
  subject: string;
  estimatedMinutes: number;
  questions: Question[];
}

export interface InterventionPlan {
  id: string;
  studentId: string;
  conceptId: string;
  conceptTitle: string;
  misconception: string;
  recommendedAction: string;
  urgency: 'low' | 'medium' | 'high';
  completed: boolean;
}

export interface StudyGroup {
  id: string;
  name: string;
  topic: string;
  membersCount: number;
  activeNow: number;
  nextSessionTime: string;
}

export interface UploadedMaterial {
  id: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  status: 'processing' | 'indexed' | 'failed';
  extractedConceptsCount: number;
}
