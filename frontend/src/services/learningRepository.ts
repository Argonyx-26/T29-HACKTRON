import {
  KnowledgeConcept,
  DiagnosticAssessment,
  InterventionPlan,
  StudyGroup,
  UploadedMaterial,
  UserProfile,
  MasteryState,
} from '../types';
import ApiClient from '../api/client';

export const mockUser: UserProfile = {
  id: 'usr-101',
  name: 'Alice Zhang',
  email: 'alice@knowledge-twin.edu',
  role: 'student',
  gradeLevel: 'Grade 11-12 STEM',
  streakDays: 14,
  totalPoints: 2450,
};

export const mockConcepts: KnowledgeConcept[] = [
  {
    id: 'c-vectors',
    title: 'Vector Decomposition',
    domain: 'Classical Mechanics',
    description: 'Resolving vectors into orthogonal Cartesian components using trigonometry.',
    masteryLevel: 92,
    status: 'mastered',
    prerequisites: ['Basic Trigonometry'],
    cognitiveLoad: 'low',
    lastPracticed: '2 hours ago',
  },
  {
    id: 'c-kinematics',
    title: 'Velocity & Acceleration Profiles',
    domain: 'Classical Mechanics',
    description: 'Interpreting instantaneous velocity, acceleration curves, and jerk in 1D kinematics.',
    masteryLevel: 88,
    status: 'proficient',
    prerequisites: ['Vector Decomposition'],
    cognitiveLoad: 'medium',
    lastPracticed: 'Yesterday',
  },
  {
    id: 'c-projectile',
    title: '2D Projectile Motion',
    domain: 'Classical Mechanics',
    description: 'Parabolic trajectories, time of flight, horizontal range, and launch angle optimizations.',
    masteryLevel: 86,
    status: 'proficient',
    prerequisites: ['Vector Decomposition', 'Velocity & Acceleration Profiles'],
    cognitiveLoad: 'high',
    lastPracticed: '3 days ago',
  },
  {
    id: 'c-friction',
    title: 'Friction & Drag Forces',
    domain: 'Newtonian Dynamics',
    description: 'Static vs kinetic friction coefficients, normal reaction forces, and terminal velocity modeling.',
    masteryLevel: 62,
    status: 'developing',
    prerequisites: ['Newton Laws & Free-Body Diagrams'],
    cognitiveLoad: 'medium',
    lastPracticed: '5 days ago',
  },
];

export const mockInterventions: InterventionPlan[] = [
  {
    id: 'inv-1',
    studentId: 'usr-101',
    conceptId: 'c-friction',
    conceptTitle: 'Friction & Drag Forces',
    misconception: 'Confusing normal contact force with gravitational weight on inclined planes.',
    recommendedAction: 'Review free-body diagrams on 30-degree inclines and complete 3 micro-practice drills.',
    urgency: 'medium',
    completed: false,
  },
];

export const mockStudyGroups: StudyGroup[] = [
  {
    id: 'grp-1',
    name: 'Section A - Physics 2026',
    topic: 'Classical Mechanics & Dynamics',
    membersCount: 6,
    activeNow: 4,
    nextSessionTime: 'Today, 4:00 PM',
  },
];

export const mockUploadedMaterials: UploadedMaterial[] = [
  {
    id: 'mat-1',
    fileName: 'Lecture_01_Vectors_and_Kinematics.pdf',
    fileSize: '3.2 MB',
    uploadedAt: 'Sep 25, 2026',
    status: 'indexed',
    extractedConceptsCount: 5,
  },
];

export const mockDiagnostic: DiagnosticAssessment = {
  id: 'diag-1',
  title: 'Diagnostic: Kinematics & Vector Fundamentals',
  subject: 'Classical Mechanics',
  estimatedMinutes: 10,
  questions: [
    {
      id: 'q-1',
      conceptId: 'c-vectors',
      prompt: 'If a vector of magnitude 50 N is oriented at 30° above the horizontal, what is its horizontal component?',
      options: [
        '25.0 N',
        '43.3 N',
        '50.0 N',
        '35.4 N',
      ],
      correctIndex: 1,
      explanation: 'Horizontal component = 50 * cos(30°) = 50 * 0.866 = 43.3 N.',
      difficulty: 'easy',
    },
    {
      id: 'q-2',
      conceptId: 'c-projectile',
      prompt: 'At the apex of a projectile trajectory (ignoring air resistance), which quantity is zero?',
      options: [
        'Total acceleration',
        'Horizontal velocity',
        'Vertical component of velocity',
        'Gravitational potential energy',
      ],
      correctIndex: 2,
      explanation: 'At the peak of flight, vertical velocity momentarily reaches zero before reversing direction.',
      difficulty: 'medium',
    },
  ],
};

function scoreToMasteryState(score: number): MasteryState {
  if (score >= 85) return 'mastered';
  if (score >= 70) return 'proficient';
  if (score >= 50) return 'developing';
  if (score > 0) return 'emerging';
  return 'not_started';
}

export const learningRepository = {
  getUser: async (): Promise<UserProfile> => {
    try {
      const cohort = await ApiClient.get<any[]>('/teacher/cohort');
      if (cohort && cohort.length > 0) {
        const student = cohort[0];
        return {
          id: student.student_id,
          name: student.full_name,
          email: student.email,
          role: 'student',
          gradeLevel: 'Grade 11-12 STEM',
          streakDays: 14,
          totalPoints: Math.round(student.overall_mastery * 3000),
        };
      }
    } catch {
      // Backend unavailable or database unseeded, fallback to mockUser
    }
    return mockUser;
  },

  getConcepts: async (studentId: string = mockUser.id): Promise<KnowledgeConcept[]> => {
    try {
      const graph = await ApiClient.get<any>(`/twin/${studentId}/graph`);
      if (graph && graph.nodes && graph.nodes.length > 0) {
        return graph.nodes.map((n: any) => {
          const scorePercent = Math.round(n.mastery * 100);
          return {
            id: n.id,
            title: n.label,
            domain: 'Curriculum Concept',
            description: `Concept Code: ${n.code}. Difficulty index: ${n.difficulty}`,
            masteryLevel: scorePercent,
            status: scoreToMasteryState(scorePercent),
            prerequisites: n.prerequisites || [],
            cognitiveLoad: n.difficulty > 0.6 ? 'high' : (n.difficulty > 0.35 ? 'medium' : 'low'),
            lastPracticed: 'Recently updated',
          };
        });
      }
    } catch {
      // Backend offline, fallback to mockConcepts
    }
    return mockConcepts;
  },

  getInterventions: async (studentId: string = mockUser.id): Promise<InterventionPlan[]> => {
    try {
      const res = await ApiClient.get<any[]>(`/interventions?student_id=${studentId}`);
      if (res && res.length > 0) {
        return res.map((item) => ({
          id: item.id,
          studentId: item.student_id,
          conceptId: item.topic_id,
          conceptTitle: item.topic_title || 'Targeted Concept',
          misconception: item.recommendation_reason || 'Identified learning bottleneck.',
          recommendedAction: item.action_plan || 'Practice reinforcement exercises.',
          urgency: item.type === 'teacher_1on1' ? 'high' : 'medium',
          completed: item.status === 'completed',
        }));
      }
    } catch {
      // Fallback
    }
    return mockInterventions;
  },

  getStudyGroups: async (): Promise<StudyGroup[]> => {
    try {
      const groups = await ApiClient.get<any[]>('/groups');
      if (groups && groups.length > 0) {
        return groups.map((g) => ({
          id: g.id,
          name: g.name,
          topic: g.description || 'Active Study Cohort',
          membersCount: (g.members && g.members.length) || 6,
          activeNow: 3,
          nextSessionTime: 'Cohort Session: Today',
        }));
      }
    } catch {
      // Fallback
    }
    return mockStudyGroups;
  },

  getMaterials: async (): Promise<UploadedMaterial[]> => {
    try {
      const docs = await ApiClient.get<any[]>('/documents');
      if (docs && docs.length > 0) {
        return docs.map((d) => ({
          id: d.id,
          fileName: d.title,
          fileSize: `${Math.round(d.file_size / 1024)} KB`,
          uploadedAt: new Date(d.uploaded_at).toLocaleDateString(),
          status: d.status === 'processed' ? 'indexed' : 'processing',
          extractedConceptsCount: 6,
        }));
      }
    } catch {
      // Fallback
    }
    return mockUploadedMaterials;
  },

  uploadMaterial: async (file: File): Promise<UploadedMaterial> => {
    const formData = new FormData();
    formData.append('file', file);
    const doc = await ApiClient.uploadFile<any>('/documents/upload', formData);
    return {
      id: doc.id,
      fileName: doc.title,
      fileSize: `${Math.round(doc.file_size / 1024)} KB`,
      uploadedAt: 'Just now',
      status: 'indexed',
      extractedConceptsCount: 5,
    };
  },

  getDiagnostic: async (): Promise<DiagnosticAssessment> => {
    try {
      const assessments = await ApiClient.get<any[]>('/assessments');
      if (assessments && assessments.length > 0) {
        const a = assessments[0];
        return {
          id: a.id,
          title: a.title,
          subject: 'Physics Mechanics Diagnostic',
          estimatedMinutes: 10,
          questions: mockDiagnostic.questions,
        };
      }
    } catch {
      // Fallback
    }
    return mockDiagnostic;
  },

  recordPractice: async (studentId: string, topicId: string, isCorrect: boolean) => {
    return ApiClient.post(`/twin/${studentId}/practice`, {
      topic_id: topicId,
      is_correct: isCorrect,
    });
  },

  getTwinDiagnosis: async (studentId: string) => {
    return ApiClient.get<any>(`/twin/${studentId}/diagnosis`);
  },

  seedDemoCohort: async () => {
    return ApiClient.post<any>('/admin/seed');
  },
};
