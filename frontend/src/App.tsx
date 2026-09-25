import { useState } from 'react';
import './App.css';
import { UserRole, UserProfile } from './types';
import { mockUser } from './services/learningRepository';
import Sidebar, { NavItem } from './components/layout/Sidebar';
import LandingPage from './components/landing/LandingPage';
import LoginView from './components/auth/LoginView';
import StudentHome from './components/student/StudentHome';
import LearnView from './components/student/LearnView';
import ProgressView from './components/student/ProgressView';
import TwinChat from './components/twin/TwinChat';
import KnowledgeGraphView from './components/twin/KnowledgeGraphView';
import AssessmentView from './components/assessment/AssessmentView';
import DiagnosticRunner from './components/assessment/DiagnosticRunner';
import InterventionView from './components/intervention/InterventionView';
import StudyGroupsView from './components/groups/StudyGroupsView';
import MaterialUploader from './components/upload/MaterialUploader';
import TeacherDashboard from './components/teacher/TeacherDashboard';
import ContentManager from './components/admin/ContentManager';
import AccountModal from './components/account/AccountModal';

export function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(mockUser);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [currentNav, setCurrentNav] = useState<NavItem>('student-home');
  const [isAccountOpen, setIsAccountOpen] = useState<boolean>(false);

  const handleLogin = (role: UserRole) => {
    setCurrentUser((prev) => ({ ...prev, role }));
    setIsAuthenticated(true);
    if (role === 'teacher') {
      setCurrentNav('teacher-dashboard');
    } else if (role === 'admin') {
      setCurrentNav('admin-content');
    } else {
      setCurrentNav('student-home');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  if (currentNav === 'landing') {
    return (
      <LandingPage
        onGetStarted={() => {
          setCurrentNav('student-home');
        }}
      />
    );
  }

  return (
    <div className="app-root">
      <Sidebar
        currentNav={currentNav}
        role={currentUser.role}
        onSelectNav={(item) => setCurrentNav(item)}
        onOpenAccount={() => setIsAccountOpen(true)}
        onLogout={handleLogout}
      />

      <main className="main-content-area">
        {currentNav === 'student-home' && (
          <StudentHome onNavigate={(nav) => setCurrentNav(nav)} />
        )}
        {currentNav === 'learn' && <LearnView />}
        {currentNav === 'progress' && <ProgressView />}
        {currentNav === 'twin-chat' && <TwinChat />}
        {currentNav === 'twin-graph' && <KnowledgeGraphView />}
        {currentNav === 'assessment' && <AssessmentView />}
        {currentNav === 'diagnostic' && <DiagnosticRunner />}
        {currentNav === 'interventions' && <InterventionView />}
        {currentNav === 'study-groups' && <StudyGroupsView />}
        {currentNav === 'materials' && <MaterialUploader />}
        {currentNav === 'teacher-dashboard' && <TeacherDashboard />}
        {currentNav === 'admin-content' && <ContentManager />}
      </main>

      <AccountModal
        user={currentUser}
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
      />
    </div>
  );
}

export default App;
