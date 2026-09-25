import {
  KnowledgeConcept,
  TwinMessage,
  DiagnosticAssessment,
  InterventionPlan,
  StudyGroup,
  UploadedMaterial,
  UserProfile,
} from '../types';

export const mockUser: UserProfile = {
  id: 'usr-101',
  name: 'Alex Rivera',
  email: 'alex.rivera@edu.org',
  role: 'student',
  gradeLevel: '10th Grade STEM',
  streakDays: 14,
  totalPoints: 2450,
};

export const mockConcepts: KnowledgeConcept[] = [
  {
    id: 'c-neural-nets',
    title: 'Neural Network Architectures',
    domain: 'Artificial Intelligence',
    description: 'Foundations of multi-layer perceptrons, forward propagation, and activation functions.',
    masteryLevel: 78,
    status: 'proficient',
    prerequisites: ['Linear Algebra Basics', 'Calculus Chain Rule'],
    cognitiveLoad: 'high',
    lastPracticed: '2 hours ago',
  },
  {
    id: 'c-gradient-descent',
    title: 'Gradient Descent Optimization',
    domain: 'Machine Learning',
    description: 'Loss function landscapes, learning rates, stochastic gradient descent and momentum.',
    masteryLevel: 62,
    status: 'developing',
    prerequisites: ['Partial Derivatives'],
    cognitiveLoad: 'medium',
    lastPracticed: 'Yesterday',
  },
  {
    id: 'c-attention-mechanisms',
    title: 'Attention & Transformers',
    domain: 'Deep Learning',
    description: 'Self-attention, multi-head projections, and positional encoding mechanisms.',
    masteryLevel: 35,
    status: 'emerging',
    prerequisites: ['Neural Network Architectures', 'Matrix Multiplication'],
    cognitiveLoad: 'high',
    lastPracticed: '3 days ago',
  },
  {
    id: 'c-data-normalization',
    title: 'Feature Scaling & Normalization',
    domain: 'Data Science',
    description: 'StandardScaler, MinMax scaling, and combating vanishing gradients.',
    masteryLevel: 94,
    status: 'mastered',
    prerequisites: ['Basic Statistics'],
    cognitiveLoad: 'low',
    lastPracticed: '5 days ago',
  },
];

export const mockInterventions: InterventionPlan[] = [
  {
    id: 'inv-1',
    studentId: 'usr-101',
    conceptId: 'c-attention-mechanisms',
    conceptTitle: 'Attention & Transformers',
    misconception: 'Confusing query-key dot product with element-wise value scaling.',
    recommendedAction: 'Complete 3D visual projection simulation and 3 micro-practice questions.',
    urgency: 'high',
    completed: false,
  },
  {
    id: 'inv-2',
    studentId: 'usr-101',
    conceptId: 'c-gradient-descent',
    conceptTitle: 'Gradient Descent Optimization',
    misconception: 'Overlooking saddle points and local minima traps during learning rate selection.',
    recommendedAction: 'Run adaptive learning rate sandbox (Adam vs SGD).',
    urgency: 'medium',
    completed: false,
  },
];

export const mockStudyGroups: StudyGroup[] = [
  {
    id: 'grp-1',
    name: 'Deep Learning Cohort Alpha',
    topic: 'Transformer Encoders & Decoders',
    membersCount: 8,
    activeNow: 4,
    nextSessionTime: 'Today, 4:00 PM',
  },
  {
    id: 'grp-2',
    name: 'Calculus for ML Working Group',
    topic: 'Backpropagation Vectorization',
    membersCount: 12,
    activeNow: 2,
    nextSessionTime: 'Tomorrow, 10:00 AM',
  },
];

export const mockUploadedMaterials: UploadedMaterial[] = [
  {
    id: 'mat-1',
    fileName: 'Lecture_04_Transformer_Attention.pdf',
    fileSize: '4.2 MB',
    uploadedAt: 'Sep 24, 2026',
    status: 'indexed',
    extractedConceptsCount: 14,
  },
  {
    id: 'mat-2',
    fileName: 'Syllabus_Machine_Learning_2026.docx',
    fileSize: '1.1 MB',
    uploadedAt: 'Sep 22, 2026',
    status: 'indexed',
    extractedConceptsCount: 38,
  },
];

export const mockDiagnostic: DiagnosticAssessment = {
  id: 'diag-1',
  title: 'Diagnostic: Neural Representations & Optimization',
  subject: 'Deep Learning Foundations',
  estimatedMinutes: 10,
  questions: [
    {
      id: 'q-1',
      conceptId: 'c-neural-nets',
      prompt: 'What happens to backpropagation gradients when using sigmoid activation in deep networks (10+ layers)?',
      options: [
        'Gradients grow exponentially causing overflow',
        'Gradients diminish exponentially (vanishing gradient problem)',
        'Gradients oscillate between positive and negative infinity',
        'Activation levels remain constant regardless of weights',
      ],
      correctIndex: 1,
      explanation: 'Sigmoid derivatives peak at 0.25; chaining multiple layers repeatedly scales gradients down exponentially.',
      difficulty: 'medium',
    },
    {
      id: 'q-2',
      conceptId: 'c-attention-mechanisms',
      prompt: 'Why are keys (K) and queries (Q) dot-product scaled by sqrt(d_k) in Scaled Dot-Product Attention?',
      options: [
        'To speed up GPU matrix operations',
        'To ensure output matrices are symmetric',
        'To prevent softmax gradients from becoming extremely small for large dimensions',
        'To invert negative attention weights',
      ],
      correctIndex: 2,
      explanation: 'For large d_k, dot products grow large in magnitude, pushing softmax into regions with extremely small gradients.',
      difficulty: 'hard',
    },
  ],
};

export const learningRepository = {
  getUser: async () => mockUser,
  getConcepts: async () => mockConcepts,
  getInterventions: async () => mockInterventions,
  getStudyGroups: async () => mockStudyGroups,
  getMaterials: async () => mockUploadedMaterials,
  getDiagnostic: async () => mockDiagnostic,
};
