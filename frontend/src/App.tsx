import React, { useState, useEffect } from 'react';
import { apiClient } from './api/client';
import { User, Chapter, KnowledgeTwinView as KnowledgeTwinType } from './types';
import { learningRepository } from './services/learningRepository';

// Components
import { LandingPage } from './components/landing/LandingPage';
import { LoginView } from './components/auth/LoginView';
import { Sidebar } from './components/layout/Sidebar';
import { StudentHome } from './components/student/StudentHome';
import { LearnView } from './components/student/LearnView';
import { KnowledgeTwinView } from './components/twin/KnowledgeTwinView';
import { AssessmentView } from './components/assessment/AssessmentView';
import { ProgressView } from './components/student/ProgressView';
import { InterventionView } from './components/intervention/InterventionView';
import { RevisionEngineView } from './components/student/RevisionEngineView';
import { DocumentUploadModal } from './components/upload/DocumentUploadModal';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { ContentManager } from './components/admin/ContentManager';

import { Settings } from 'lucide-react';

export const App: React.FC = () => {
  // Local identity state
  const [currentUser, setCurrentUser] = useState<User | null>(() => learningRepository.getCurrentUser());

  // Role state: 'landing' | 'login' | 'student' | 'teacher' | 'admin'
  const [role, setRole] = useState<'landing' | 'login' | 'student' | 'teacher' | 'admin'>(() => {
    const params = new URLSearchParams(window.location.search);
    const paramRole = params.get('role');
    if (paramRole === 'teacher' || paramRole === 'admin' || paramRole === 'student' || paramRole === 'login' || paramRole === 'landing') {
      return paramRole as any;
    }
    const savedRole = localStorage.getItem('kt_active_role');
    if (savedRole === 'teacher' || savedRole === 'admin' || savedRole === 'student' || savedRole === 'login' || savedRole === 'landing') {
      return savedRole as any;
    }
    const user = learningRepository.getCurrentUser();
    if (user?.role) {
      return user.role as any;
    }
    // Default to 'landing' so Landing Page comes first before login!
    return 'landing';
  });

  // Student Navigation: 'home' | 'learn' | 'assess' | 'twin' | 'revision' | 'progress' | 'upload' | 'intervention'
  const [studentTab, setStudentTab] = useState<'home' | 'learn' | 'assess' | 'twin' | 'revision' | 'progress' | 'upload' | 'intervention'>(() => {
    const savedTab = localStorage.getItem('kt_student_tab');
    const valid = ['home', 'learn', 'assess', 'twin', 'revision', 'progress', 'upload', 'intervention'];
    if (savedTab && valid.includes(savedTab)) {
      return savedTab as any;
    }
    return 'home';
  });
  const [learnSearchQuery, setLearnSearchQuery] = useState('');

  // Teacher Navigation: overview, students, insights, and content.
  const [teacherTab, setTeacherTab] = useState<'overview' | 'students' | 'insights' | 'content'>(() => {
    const savedTab = localStorage.getItem('kt_teacher_tab');
    const valid = ['overview', 'students', 'insights', 'content'];
    if (savedTab && valid.includes(savedTab)) {
      return savedTab as any;
    }
    return 'overview';
  });

  // Active Chapter being learned / assessed - starts null for new learner
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);

  // Twin state for the current student
  const [twinData, setTwinData] = useState<KnowledgeTwinType | null>(null);
  const [loadingTwin, setLoadingTwin] = useState<boolean>(false);

  // Active intervention target
  const [interventionTarget, setInterventionTarget] = useState<{
    skillId: string;
    patternId?: string;
    classification?: string;
  }>(() => {
    try {
      const saved = localStorage.getItem('kt_intervention_target');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      skillId: 'sk_dist_04',
      patternId: 'PAT_DIST_PARTIAL',
      classification: 'procedural'
    };
  });

  // Persist navigation states across reloads / page refreshes
  useEffect(() => {
    localStorage.setItem('kt_active_role', role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem('kt_student_tab', studentTab);
  }, [studentTab]);

  useEffect(() => {
    localStorage.setItem('kt_teacher_tab', teacherTab);
  }, [teacherTab]);

  useEffect(() => {
    if (activeChapter?.id) {
      localStorage.setItem('kt_active_chapter_id', activeChapter.id);
    } else if (activeChapter === null) {
      localStorage.removeItem('kt_active_chapter_id');
    }
  }, [activeChapter]);

  useEffect(() => {
    if (interventionTarget) {
      localStorage.setItem('kt_intervention_target', JSON.stringify(interventionTarget));
    }
  }, [interventionTarget]);

  useEffect(() => {
    // Check URL parameters for direct role specification
    const params = new URLSearchParams(window.location.search);
    const paramRole = params.get('role');

    if (paramRole === 'teacher') {
      setRole('teacher');
    } else if (paramRole === 'admin') {
      setRole('admin');
    } else if (paramRole === 'student') {
      setRole('student');
    }

    loadInitialData();
  }, []);

  useEffect(() => {
    if (currentUser?.user_id && role === 'student') {
      loadStudentTwin(currentUser.user_id, activeChapter?.id);
    }

    // Verify / auto-heal authoritative student ID from backend database
    if (currentUser?.display_name && role === 'student') {
      apiClient.registerStudent({
        id: currentUser.user_id,
        name: currentUser.display_name,
        role: currentUser.role
      }).then((backendStudent) => {
        if (backendStudent?.id && backendStudent.id !== currentUser.user_id) {
          const updatedUser = { ...currentUser, user_id: backendStudent.id };
          setCurrentUser(updatedUser);
          localStorage.setItem('kt_current_user_id', backendStudent.id);
        }
      }).catch(() => {});
    }
  }, [currentUser?.user_id, currentUser?.display_name, activeChapter, role]);

  const loadInitialData = async () => {
    try {
      const chaps = await apiClient.getChapters();
      const savedChapterId = localStorage.getItem('kt_active_chapter_id');
      if (savedChapterId && chaps && chaps.length) {
        const found = chaps.find(c => c.id === savedChapterId || c.source_document_id === savedChapterId);
        if (found) {
          setActiveChapter(found);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadStudentTwin = async (userId: string, chapterId?: string) => {
    setLoadingTwin(true);
    try {
      const data = await apiClient.getStudentTwin(userId, chapterId);
      setTwinData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTwin(false);
    }
  };

  const handleStartIntervention = (skillId: string, patternId: string, classification: string) => {
    const nextTarget = { skillId, patternId, classification };
    setInterventionTarget(nextTarget);
    localStorage.setItem('kt_intervention_target', JSON.stringify(nextTarget));
    setStudentTab('intervention');
  };

  const handleSelectChapterFromLearn = (chapter: Chapter) => {
    setActiveChapter(chapter);
    localStorage.setItem('kt_active_chapter_id', chapter.id);
    setStudentTab('assess');
  };

  const handleUserLogin = (user: User) => {
    setCurrentUser(user);
    setRole(user.role);
    localStorage.setItem('kt_active_role', user.role);
    if (user.role === 'student') {
      setStudentTab('home');
      localStorage.setItem('kt_student_tab', 'home');
      setActiveChapter(null);
      localStorage.removeItem('kt_active_chapter_id');
    } else if (user.role === 'teacher') {
      setTeacherTab('overview');
      localStorage.setItem('kt_teacher_tab', 'overview');
    }
  };

  const handleSwitchAccount = () => {
    learningRepository.clearCurrentUser();
    localStorage.removeItem('kt_active_role');
    localStorage.removeItem('kt_student_tab');
    localStorage.removeItem('kt_teacher_tab');
    localStorage.removeItem('kt_active_chapter_id');
    localStorage.removeItem('kt_intervention_target');
    setCurrentUser(null);
    setTwinData(null);
    setActiveChapter(null);
    setRole('landing');
  };

  const handleSidebarNavigate = (tab: string) => {
    if (role === 'student') {
      setStudentTab(tab as any);
    } else if (role === 'teacher') {
      setTeacherTab(tab as any);
    }
  };

  // 1. PUBLIC LANDING PAGE (Exact Stitch Animated Hero Artwork)
  if (role === 'landing') {
    return (
      <LandingPage
        onNavigateToLogin={() => setRole('login')}
        onGetStarted={() => {
          if (currentUser) {
            setRole(currentUser.role);
          } else {
            setRole('login');
          }
        }}
        onViewCurriculum={() => {
          if (currentUser) {
            setRole('student');
            setStudentTab('learn');
          } else {
            setRole('login');
          }
        }}
      />
    );
  }

  // 2. LOGIN SCREEN (When user clicked Log In or has no session)
  if (role === 'login' || !currentUser) {
    return (
      <LoginView
        onLogin={handleUserLogin}
        onBackToLanding={() => setRole('landing')}
      />
    );
  }

  return (
    <div className={`app-shell ${role === 'student' && studentTab === 'home' ? 'student-home-shell' : role === 'student' && studentTab === 'learn' ? 'student-learn-shell' : studentTab === 'assess' ? 'student-assess-shell' : studentTab === 'twin' ? 'student-twin-shell' : studentTab === 'progress' ? 'student-progress-shell' : studentTab === 'revision' ? 'student-revision-shell' : ''}`} style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-primary)' }}>
      {/* Persistent Left Navigation Sidebar */}
      <Sidebar
        user={currentUser}
        activeTab={role === 'teacher' ? teacherTab : studentTab}
        onNavigate={handleSidebarNavigate}
        onSwitchAccount={handleSwitchAccount}
        onGoToLanding={() => setRole('landing')}
        onUpdateUser={(updated) => setCurrentUser(updated)}
      />

      {/* Main Workspace Column */}
      <div className={`app-workspace ${role === 'student' && (studentTab === 'home' || studentTab === 'revision') ? (studentTab === 'home' ? 'student-home-workspace' : 'student-revision-workspace') : ''}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}>
        <main className={`app-main ${role === 'student' && studentTab === 'home' ? 'student-home-main' : role === 'student' && studentTab === 'learn' ? 'student-learn-main' : studentTab === 'assess' ? 'student-assess-main' : studentTab === 'twin' ? 'student-twin-main' : studentTab === 'progress' ? 'student-progress-main' : studentTab === 'revision' ? 'student-revision-main' : ''}`} style={{ maxWidth: '1440px', width: '100%', margin: '28px auto', padding: '0 32px', flex: 1, boxSizing: 'border-box' }}>
          {/* STUDENT FLOW */}
          {role === 'student' && (
            <>
              {studentTab === 'home' && (
                <StudentHome
                  twin={twinData}
                  activeChapter={activeChapter}
                  onNavigateToLearn={() => setStudentTab('learn')}
                  onNavigateToAssess={() => setStudentTab('assess')}
                  onNavigateToTwin={() => setStudentTab('twin')}
                  onNavigateToProgress={() => setStudentTab('progress')}
                  onNavigateToIntervention={handleStartIntervention}
                  onSearchTopics={(query) => { setLearnSearchQuery(query); setStudentTab('learn'); }}
                />
              )}

              {studentTab === 'learn' && (
                <LearnView
                  onSelectChapter={handleSelectChapterFromLearn}
                  onNavigateToUpload={() => setStudentTab('upload')}
                  onNavigateToHome={() => setStudentTab('home')}
                  initialSearchQuery={learnSearchQuery}
                />
              )}

              {studentTab === 'assess' && (
                <AssessmentView
                  studentId={currentUser.user_id}
                  activeChapterId={activeChapter?.id}
                  onAttemptCompleted={() => loadStudentTwin(currentUser.user_id, activeChapter?.id)}
                  onNavigateToIntervention={handleStartIntervention}
                  onNavigateToLearn={() => setStudentTab('learn')}
                  onNavigateToHome={() => setStudentTab('home')}
                />
              )}

              {studentTab === 'twin' && (
                <KnowledgeTwinView
                  twin={twinData}
                  onNavigateToDiagnostic={() => setStudentTab('assess')}
                  onNavigateToUpload={() => setStudentTab('upload')}
                  onStartIntervention={handleStartIntervention}
                  onNavigateToHome={() => setStudentTab('home')}
                />
              )}

              {studentTab === 'revision' && (
                <RevisionEngineView
                  studentId={currentUser.user_id}
                  onNavigateToTwin={() => setStudentTab('twin')}
                  onNavigateToAssess={() => setStudentTab('assess')}
                  onNavigateToHome={() => setStudentTab('home')}
                />
              )}

              {studentTab === 'progress' && (
                <ProgressView
                  userId={currentUser.user_id}
                  onNavigateToAssess={() => setStudentTab('assess')}
                  onNavigateToLearn={() => setStudentTab('learn')}
                  onNavigateToHome={() => setStudentTab('home')}
                />
              )}

              {studentTab === 'intervention' && (
                <InterventionView
                  studentId={currentUser.user_id}
                  skillId={interventionTarget.skillId}
                  patternId={interventionTarget.patternId}
                  classification={interventionTarget.classification}
                  onRetestCompleted={() => loadStudentTwin(currentUser.user_id, activeChapter?.id)}
                  onNavigateToTwin={() => setStudentTab('twin')}
                  onNavigateToHome={() => setStudentTab('home')}
                />
              )}

              {studentTab === 'upload' && (
                <DocumentUploadModal
                  onClose={() => setStudentTab('learn')}
                  onChapterReady={async (newChapterId) => {
                    await loadInitialData();
                    const chaps = await apiClient.getChapters();
                    const matched = chaps.find(c => c.id === newChapterId || c.source_document_id === newChapterId);
                    if (matched) {
                      setActiveChapter(matched);
                    } else if (newChapterId) {
                      try {
                        const direct = await apiClient.getChapterDetail(newChapterId);
                        if (direct) setActiveChapter(direct);
                      } catch {}
                    }
                    setStudentTab('assess');
                  }}
                />
              )}
            </>
          )}

          {/* TEACHER FLOW */}
          {role === 'teacher' && (
            <TeacherDashboard
              activeTab={teacherTab}
              onTabChange={(t) => setTeacherTab(t)}
            />
          )}

          {/* ADMIN FLOW */}
          {role === 'admin' && (
            <ContentManager />
          )}
        </main>

        {/* Minimal Pitch Black Footer */}
        <footer style={{
          background: '#000000',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          padding: '18px 24px',
          marginTop: 'auto'
        }}>
          <div style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ fontSize: '0.82rem', color: '#9496a8' }}>
              Knowledge Twin · <span style={{ color: '#d7baff' }}>Electric Intelligence</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.78rem', color: '#71707d' }}>
              <span>Continuous Cognitive Diagnostics</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
