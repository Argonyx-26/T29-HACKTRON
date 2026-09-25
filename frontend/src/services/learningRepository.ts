import { apiClient } from '../api/client';
import {
  User,
  Subject,
  Chapter,
  Skill,
  Question,
  KnowledgeTwinView,
  DiagnosisResult,
  RetestResult,
  TeacherOverview
} from '../types';

export interface LearnerProgressSummary {
  user_id: string;
  total_attempts: number;
  correct_attempts: number;
  score_percentage: number | null;
  assessed_skills_count: number;
  recent_activity: LearnerActivityItem[];
}

export interface LearnerActivityItem {
  id: string;
  user_id: string;
  type: 'assessment' | 'retest';
  title: string;
  score_or_result?: string;
  timestamp: string;
}

const STORAGE_KEY_CURRENT_USER_ID = 'kt_current_user_id';
const STORAGE_KEY_USERS = 'kt_users_list';


function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 11);
}

export const learningRepository = {
  // ==========================================
  // 1. LOCAL LEARNER IDENTITY
  // ==========================================

  getCurrentUser(): User | null {
    try {
      const currentId = localStorage.getItem(STORAGE_KEY_CURRENT_USER_ID);
      if (!currentId) return null;
      const users = this.listUsers();
      return users.find(u => u.user_id === currentId) || null;
    } catch {
      return null;
    }
  },

  getLastUser(): User | null {
    const current = this.getCurrentUser();
    if (current) return current;
    const users = this.listUsers();
    return users.length > 0 ? users[0] : null;
  },

  listUsers(): User[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_USERS);
      if (!raw) return [];
      return JSON.parse(raw) as User[];
    } catch {
      return [];
    }
  },

  saveUser(displayName: string, role: 'student' | 'teacher'): User {
    const trimmed = displayName.trim() || (role === 'teacher' ? 'Teacher' : 'Student');
    const newUser: User = {
      user_id: generateUUID(),
      display_name: trimmed,
      role,
      created_at: new Date().toISOString()
    };

    const users = this.listUsers();
    const updatedUsers = [newUser, ...users.filter(u => u.user_id !== newUser.user_id)];
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedUsers));
    localStorage.setItem(STORAGE_KEY_CURRENT_USER_ID, newUser.user_id);

    // Synchronize identity with PostgreSQL authoritative backend
    apiClient.registerStudent({
      id: newUser.user_id,
      name: newUser.display_name,
      role: newUser.role
    }).catch(err => {
      console.warn('Backend student sync notice:', err);
    });

    return newUser;
  },

  switchUser(userId: string): User | null {
    const users = this.listUsers();
    const target = users.find(u => u.user_id === userId);
    if (target) {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER_ID, target.user_id);
      return target;
    }
    return null;
  },

  clearCurrentUser(): void {
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER_ID);
  },

  // ==========================================
  // 2. CURRICULUM (DELEGATES TO API CLIENT)
  // ==========================================

  async getSubjects(): Promise<Subject[]> {
    return apiClient.getSubjects();
  },

  async getChapters(subjectId?: string): Promise<Chapter[]> {
    if (subjectId) {
      return apiClient.getSubjectChapters(subjectId);
    }
    return apiClient.getChapters();
  },

  async getSkills(chapterId: string): Promise<Skill[]> {
    return apiClient.getChapterSkills(chapterId);
  },

  async getQuestions(chapterId: string): Promise<Question[]> {
    return apiClient.getChapterQuestions(chapterId);
  },

  // ==========================================
  // 3. LEARNER STATE & AUTHORITATIVE BACKEND PERSISTENCE
  // ==========================================

  async getTwin(userId: string, chapterId?: string): Promise<KnowledgeTwinView> {
    return apiClient.getStudentTwin(userId, chapterId);
  },

  async submitAttempt(payload: {
    student_id: string;
    question_id: string;
    answer: string;
    work_shown: string[];
    input_mode: string;
  }): Promise<DiagnosisResult> {
    // Authoritative submission: written directly to PostgreSQL via FastAPI
    return apiClient.submitAttempt(payload);
  },

  async submitRetest(payload: {
    student_id: string;
    intervention_id: string;
    question_id: string;
    answer: string;
    work_shown: string[];
  }): Promise<RetestResult> {
    // Authoritative retest: written directly to PostgreSQL via FastAPI
    return apiClient.submitRetest(payload);
  },

  async getActivity(userId: string): Promise<LearnerActivityItem[]> {
    try {
      return await apiClient.getStudentActivity(userId);
    } catch (e) {
      console.warn('Failed to fetch activity from backend:', e);
      return [];
    }
  },

  async getProgress(userId: string): Promise<LearnerProgressSummary> {
    try {
      return await apiClient.getStudentProgress(userId);
    } catch (e) {
      console.warn('Failed to fetch progress from backend:', e);
      return {
        user_id: userId,
        total_attempts: 0,
        correct_attempts: 0,
        score_percentage: null,
        assessed_skills_count: 0,
        recent_activity: []
      };
    }
  },

  // ==========================================
  // 4. TEACHER ANALYTICS
  // ==========================================

  async getTeacherOverview(): Promise<TeacherOverview> {
    return apiClient.getTeacherOverview();
  }
};
