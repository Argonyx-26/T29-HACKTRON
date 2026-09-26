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
  TeacherOverview,
  AssessmentReport
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

  async loginOrCreateUserAsync(displayName: string, role: 'student' | 'teacher', isRegisterMode: boolean = false): Promise<User> {
    const trimmed = displayName.trim() || (role === 'teacher' ? 'Teacher' : 'Student');
    const users = this.listUsers();

    let candidateId = generateUUID();
    if (!isRegisterMode) {
      const existing = users.find(
        u => u.display_name.trim().toLowerCase() === trimmed.toLowerCase() && u.role === role
      );
      if (existing) {
        candidateId = existing.user_id;
      }
    }

    try {
      const backendStudent = await apiClient.registerStudent({
        id: candidateId,
        name: trimmed,
        role
      });
      const resolvedId = backendStudent.id || candidateId;
      const resolvedUser: User = {
        user_id: resolvedId,
        display_name: backendStudent.name || trimmed,
        role: backendStudent.role || role,
        created_at: backendStudent.created_at || new Date().toISOString()
      };
      const updatedUsers = [resolvedUser, ...users.filter(u => u.user_id !== resolvedId && u.user_id !== candidateId)];
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedUsers));
      localStorage.setItem(STORAGE_KEY_CURRENT_USER_ID, resolvedId);
      return resolvedUser;
    } catch (err) {
      console.warn('Backend student sync notice:', err);
      const localUser: User = {
        user_id: candidateId,
        display_name: trimmed,
        role,
        created_at: new Date().toISOString()
      };
      const updatedUsers = [localUser, ...users.filter(u => u.user_id !== candidateId)];
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedUsers));
      localStorage.setItem(STORAGE_KEY_CURRENT_USER_ID, candidateId);
      return localUser;
    }
  },

  loginOrCreateUser(displayName: string, role: 'student' | 'teacher', isRegisterMode: boolean = false): User {
    const trimmed = displayName.trim() || (role === 'teacher' ? 'Teacher' : 'Student');
    const users = this.listUsers();

    if (!isRegisterMode) {
      // Find existing user with matching display name and role
      const existing = users.find(
        u => u.display_name.trim().toLowerCase() === trimmed.toLowerCase() && u.role === role
      );
      if (existing) {
        localStorage.setItem(STORAGE_KEY_CURRENT_USER_ID, existing.user_id);
        // Ensure backend knows about this user and has their individual database ready
        apiClient.registerStudent({
          id: existing.user_id,
          name: existing.display_name,
          role: existing.role
        }).catch(err => {
          console.warn('Backend student sync notice:', err);
        });
        return existing;
      }
    }

    // Otherwise create brand new isolated user with dedicated database ID
    const newUser: User = {
      user_id: generateUUID(),
      display_name: trimmed,
      role,
      created_at: new Date().toISOString()
    };

    const updatedUsers = [newUser, ...users.filter(u => u.user_id !== newUser.user_id)];
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedUsers));
    localStorage.setItem(STORAGE_KEY_CURRENT_USER_ID, newUser.user_id);

    apiClient.registerStudent({
      id: newUser.user_id,
      name: newUser.display_name,
      role: newUser.role
    }).then(backendStudent => {
      if (backendStudent?.id && backendStudent.id !== newUser.user_id) {
        const resolvedUser: User = {
          user_id: backendStudent.id,
          display_name: backendStudent.name || newUser.display_name,
          role: backendStudent.role || newUser.role,
          created_at: backendStudent.created_at || newUser.created_at
        };
        const currentList = this.listUsers();
        const fixedUsers = [resolvedUser, ...currentList.filter(u => u.user_id !== backendStudent.id && u.user_id !== newUser.user_id)];
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(fixedUsers));
        if (localStorage.getItem(STORAGE_KEY_CURRENT_USER_ID) === newUser.user_id) {
          localStorage.setItem(STORAGE_KEY_CURRENT_USER_ID, backendStudent.id);
        }
      }
    }).catch(err => {
      console.warn('Backend student sync notice:', err);
    });

    return newUser;
  },

  updateUser(userId: string, newDisplayName: string): User {
    const trimmed = newDisplayName.trim() || 'Learner';
    const users = this.listUsers();
    const target = users.find(u => u.user_id === userId);

    const updated: User = target
      ? { ...target, display_name: trimmed }
      : { user_id: userId, display_name: trimmed, role: 'student', created_at: new Date().toISOString() };

    const updatedUsers = [updated, ...users.filter(u => u.user_id !== userId)];
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedUsers));
    localStorage.setItem(STORAGE_KEY_CURRENT_USER_ID, updated.user_id);

    apiClient.registerStudent({
      id: updated.user_id,
      name: updated.display_name,
      role: updated.role
    }).catch(err => {
      console.warn('Backend student sync notice:', err);
    });

    return updated;
  },

  saveUser(displayName: string, role: 'student' | 'teacher'): User {
    return this.loginOrCreateUser(displayName, role, false);
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

  async saveAssessmentReport(report: AssessmentReport): Promise<AssessmentReport> {
    try {
      const storageKey = `kt_reports_${report.student_id}`;
      const existingRaw = localStorage.getItem(storageKey);
      const existingList: AssessmentReport[] = existingRaw ? JSON.parse(existingRaw) : [];
      const updatedList = [report, ...existingList.filter(r => r.id !== report.id)];
      localStorage.setItem(storageKey, JSON.stringify(updatedList));
    } catch (e) {
      console.warn('LocalStorage save failed for report:', e);
    }

    try {
      return await apiClient.saveAssessmentReport(report);
    } catch (err) {
      console.warn('Backend saveAssessmentReport notice:', err);
      return report;
    }
  },

  async getAssessmentReports(userId: string): Promise<AssessmentReport[]> {
    let localReports: AssessmentReport[] = [];
    try {
      const storageKey = `kt_reports_${userId}`;
      const raw = localStorage.getItem(storageKey);
      if (raw) localReports = JSON.parse(raw);
    } catch {
      localReports = [];
    }

    try {
      const remoteReports = await apiClient.getAssessmentReports(userId);
      const remoteIds = new Set(remoteReports.map(r => r.id));
      const merged = [...remoteReports];
      for (const loc of localReports) {
        if (!remoteIds.has(loc.id)) {
          merged.push(loc);
        }
      }
      merged.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      
      try {
        localStorage.setItem(`kt_reports_${userId}`, JSON.stringify(merged));
      } catch {}

      return merged;
    } catch (e) {
      console.warn('Failed to fetch assessment reports from backend, returning cached:', e);
      return localReports;
    }
  },

  async getAssessmentReportDetail(reportId: string, userId?: string): Promise<AssessmentReport | null> {
    try {
      return await apiClient.getAssessmentReportDetail(reportId);
    } catch (e) {
      if (userId) {
        const cached = await this.getAssessmentReports(userId);
        return cached.find(r => r.id === reportId) || null;
      }
      return null;
    }
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
