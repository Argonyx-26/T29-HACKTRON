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
import { DocumentUploadModal } from './components/upload/DocumentUploadModal';
import { StudyGroupsView } from './components/groups/StudyGroupsView';
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
    if (paramRole === 'teacher' || paramRole === 'admin' || paramRole === 'student' || paramRole === 'login') {
      return paramRole;
    }
    // Default to 'landing' so Landing Page comes first before login!
    return 'landing';
  });

  // Student Navigation: 'home' | 'learn' | 'assess' | 'twin' | 'progress' | 'groups' | 'upload' | 'intervention'
  const [studentTab, setStudentTab] = useState<'home' | 'learn' | 'assess' | 'twin' | 'progress' | 'groups' | 'upload' | 'intervention'>('home');
  const [learnSearchQuery, setLearnSearchQuery] = useState('');

  // Teacher Navigation: overview, students, insights, and content.
  const [teacherTab, setTeacherTab] = useState<'overview' | 'students' | 'insights' | 'content'>('overview');

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
  }>({
    skillId: 'sk_dist_04',
    patternId: 'PAT_DIST_PARTIAL',
    classification: 'procedural'
  });

  useEffect(() => {
    // Check URL parameters for direct role specification
    const params = new URLSearchParams(window.location.search);
    const paramRole = params.get('role');

    if (paramRole === 'teacher') {
      setRole('teacher');
      setTeacherTab('overview');
    } else if (paramRole === 'admin') {
      setRole('admin');
    } else if (paramRole === 'student') {
      setRole('student');
      setStudentTab('home');
    }

    loadInitialData();
  }, []);

  useEffect(() => {
    if (currentUser?.user_id && role === 'student') {
      loadStudentTwin(currentUser.user_id, activeChapter?.id);
    }
  }, [currentUser, activeChapter, role]);

  const loadInitialData = async () => {
    try {
      await apiClient.getChapters();
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
    setInterventionTarget({ skillId, patternId, classification });
    setStudentTab('intervention');
  };

  const handleSelectChapterFromLearn = (chapter: Chapter) => {
    setActiveChapter(chapter);
    setStudentTab('assess');
  };

  const handleUserLogin = (user: User) => {
    setCurrentUser(user);
    setRole(user.role);
    if (user.role === 'student') {
      setStudentTab('home');
      setActiveChapter(null);
    } else if (user.role === 'teacher') {
      setTeacherTab('overview');
    }
  };

  const handleSwitchAccount = () => {
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
    <div className={`app-shell ${role === 'student' && studentTab === 'home' ? 'student-home-shell' : ''}`} style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-primary)' }}>
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
      <div className={`app-workspace ${role === 'student' && studentTab === 'home' ? 'student-home-workspace' : ''}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}>
        <main className={`app-main ${role === 'student' && studentTab === 'home' ? 'student-home-main' : ''}`} style={{ maxWidth: '1440px', width: '100%', margin: '28px auto', padding: '0 32px', flex: 1, boxSizing: 'border-box' }}>
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
                />
              )}

              {studentTab === 'twin' && (
                <KnowledgeTwinView
                  twin={twinData}
                  onNavigateToDiagnostic={() => setStudentTab('assess')}
                  onNavigateToUpload={() => setStudentTab('upload')}
                  onStartIntervention={handleStartIntervention}
                />
              )}

              {studentTab === 'progress' && (
                <ProgressView
                  userId={currentUser.user_id}
                  onNavigateToAssess={() => setStudentTab('assess')}
                  onNavigateToLearn={() => setStudentTab('learn')}
                />
              )}

              {studentTab === 'groups' && (
                <StudyGroupsView
                  role="student"
                  userId={currentUser.user_id}
                  userName={currentUser.display_name}
                  onNavigateToLearn={() => setStudentTab('learn')}
                  onNavigateToAssess={() => setStudentTab('assess')}
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
                />
              )}

              {studentTab === 'upload' && (
                <DocumentUploadModal
                  onClose={() => setStudentTab('learn')}
                  onChapterReady={async (newChapterId) => {
                    await loadInitialData();
                    const chaps = await apiClient.getChapters();
                    const matched = chaps.find(c => c.id === newChapterId);
                    if (matched) setActiveChapter(matched);
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
