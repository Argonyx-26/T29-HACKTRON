import {
  Subject,
  Chapter,
  Skill,
  Student,
  KnowledgeTwinView,
  Question,
  DiagnosisResult,
  RetestResult,
  TeacherOverview
} from '../types';

const API_BASE = '/api';

export const apiClient = {
  // Dynamic Subjects & Chapters
  async getSubjects(): Promise<Subject[]> {
    const res = await fetch(`${API_BASE}/subjects`);
    if (!res.ok) throw new Error('Failed to fetch subjects');
    return res.json();
  },

  async getSubjectChapters(subjectId: string): Promise<Chapter[]> {
    const res = await fetch(`${API_BASE}/subjects/${subjectId}/chapters`);
    if (!res.ok) throw new Error(`Failed to fetch chapters for subject ${subjectId}`);
    return res.json();
  },

  async getChapters(): Promise<Chapter[]> {
    const res = await fetch(`${API_BASE}/chapters`);
    if (!res.ok) throw new Error('Failed to fetch chapters');
    return res.json();
  },

  async getChapterDetail(id: string): Promise<Chapter> {
    const res = await fetch(`${API_BASE}/chapters/${id}`);
    if (!res.ok) throw new Error('Failed to fetch chapter details');
    return res.json();
  },

  async getChapterSkills(id: string): Promise<Skill[]> {
    const res = await fetch(`${API_BASE}/chapters/${id}/skills`);
    if (!res.ok) throw new Error('Failed to fetch skills');
    return res.json();
  },

  async getChapterQuestions(id: string): Promise<Question[]> {
    const res = await fetch(`${API_BASE}/chapters/${id}/questions`);
    if (!res.ok) throw new Error('Failed to fetch questions');
    return res.json();
  },

  // Students & Knowledge Twin
  async getStudents(): Promise<Student[]> {
    const res = await fetch(`${API_BASE}/students`);
    if (!res.ok) throw new Error('Failed to fetch students');
    return res.json();
  },

  async registerStudent(student: { id: string; name: string; role?: string; avatar_color?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student)
    });
    if (!res.ok) throw new Error('Failed to register student');
    return res.json();
  },

  async getStudentProgress(studentId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/students/${studentId}/progress`);
    if (!res.ok) throw new Error('Failed to fetch student progress');
    return res.json();
  },

  async getStudentActivity(studentId: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/students/${studentId}/activity`);
    if (!res.ok) throw new Error('Failed to fetch student activity');
    return res.json();
  },

  async getStudentTwin(studentId: string, chapterId?: string): Promise<KnowledgeTwinView> {
    const url = chapterId 
      ? `${API_BASE}/students/${studentId}/twin?chapter_id=${chapterId}`
      : `${API_BASE}/students/${studentId}/twin`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch student twin');
    return res.json();
  },

  // Attempts & Assessment
  async submitAttempt(payload: {
    student_id: string;
    question_id: string;
    answer: string;
    work_shown: string[];
    input_mode: string;
  }): Promise<DiagnosisResult> {
    const res = await fetch(`${API_BASE}/attempts/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to submit attempt');
    return res.json();
  },

  // Interventions & Retest
  async routeIntervention(params: {
    student_id: string;
    skill_id: string;
    pattern_id?: string;
    classification?: string;
  }): Promise<any> {
    const query = new URLSearchParams({
      student_id: params.student_id,
      skill_id: params.skill_id,
      classification: params.classification || 'procedural'
    });
    if (params.pattern_id) query.append('pattern_id', params.pattern_id);
    const res = await fetch(`${API_BASE}/interventions/route?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to route intervention');
    return res.json();
  },

  async submitRetest(payload: {
    student_id: string;
    intervention_id: string;
    question_id: string;
    answer: string;
    work_shown: string[];
  }): Promise<RetestResult> {
    const res = await fetch(`${API_BASE}/interventions/retest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to submit retest');
    return res.json();
  },

  // Bring Your Own Material (Document Ingestion)
  async uploadDocument(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Failed to upload document');
    return res.json();
  },

  async getDocumentStatus(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/documents/${id}/status`);
    if (!res.ok) throw new Error('Failed to fetch document status');
    return res.json();
  },

  async getDocumentReview(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/documents/${id}/review`);
    if (!res.ok) throw new Error('Failed to fetch document review');
    return res.json();
  },

  // Teacher Analytics
  async getTeacherOverview(): Promise<TeacherOverview> {
    const res = await fetch(`${API_BASE}/teacher/overview`);
    if (!res.ok) throw new Error('Failed to fetch teacher overview');
    return res.json();
  },

  // Admin & Observability
  async getAdminPatterns(): Promise<{ total_count: number; patterns: any[] }> {
    const res = await fetch(`${API_BASE}/admin/patterns`);
    if (!res.ok) throw new Error('Failed to fetch pattern library');
    return res.json();
  },

  async getAdminLogs(): Promise<{ audit_logs: any[]; llm_request_logs: any[] }> {
    const res = await fetch(`${API_BASE}/admin/logs`);
    if (!res.ok) throw new Error('Failed to fetch system logs');
    return res.json();
  },

};
