import React from 'react';
import { UserRole } from '../../types';

export type NavItem =
  | 'student-home'
  | 'learn'
  | 'progress'
  | 'twin-chat'
  | 'twin-graph'
  | 'assessment'
  | 'diagnostic'
  | 'interventions'
  | 'study-groups'
  | 'materials'
  | 'teacher-dashboard'
  | 'admin-content'
  | 'landing';

interface SidebarProps {
  currentNav: NavItem;
  role: UserRole;
  onSelectNav: (item: NavItem) => void;
  onOpenAccount: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentNav,
  role,
  onSelectNav,
  onOpenAccount,
  onLogout,
}) => {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand" onClick={() => onSelectNav('landing')}>
        <div className="sidebar-logo">🧠</div>
        <div className="sidebar-title">
          <span>Knowledge Twin</span>
          <span className="sidebar-sub">T29 Hacktron</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Core Learning</div>

        <button
          className={`nav-link ${currentNav === 'student-home' ? 'active' : ''}`}
          onClick={() => onSelectNav('student-home')}
        >
          <span className="nav-icon">🏠</span>
          <span>Home Dashboard</span>
        </button>

        <button
          className={`nav-link ${currentNav === 'learn' ? 'active' : ''}`}
          onClick={() => onSelectNav('learn')}
        >
          <span className="nav-icon">📖</span>
          <span>Adaptive Learn</span>
        </button>

        <button
          className={`nav-link ${currentNav === 'progress' ? 'active' : ''}`}
          onClick={() => onSelectNav('progress')}
        >
          <span className="nav-icon">📈</span>
          <span>Mastery Progress</span>
        </button>

        <div className="nav-section-title">Cognitive Twin</div>

        <button
          className={`nav-link ${currentNav === 'twin-chat' ? 'active' : ''}`}
          onClick={() => onSelectNav('twin-chat')}
        >
          <span className="nav-icon">🤖</span>
          <span>Twin Dialog</span>
        </button>

        <button
          className={`nav-link ${currentNav === 'twin-graph' ? 'active' : ''}`}
          onClick={() => onSelectNav('twin-graph')}
        >
          <span className="nav-icon">🕸️</span>
          <span>Knowledge Graph</span>
        </button>

        <button
          className={`nav-link ${currentNav === 'diagnostic' ? 'active' : ''}`}
          onClick={() => onSelectNav('diagnostic')}
        >
          <span className="nav-icon">🔬</span>
          <span>Diagnostic Engine</span>
        </button>

        <button
          className={`nav-link ${currentNav === 'interventions' ? 'active' : ''}`}
          onClick={() => onSelectNav('interventions')}
        >
          <span className="nav-icon">⚡</span>
          <span>Interventions</span>
        </button>

        <div className="nav-section-title">Community & Tools</div>

        <button
          className={`nav-link ${currentNav === 'assessment' ? 'active' : ''}`}
          onClick={() => onSelectNav('assessment')}
        >
          <span className="nav-icon">📝</span>
          <span>Assessment Runner</span>
        </button>

        <button
          className={`nav-link ${currentNav === 'study-groups' ? 'active' : ''}`}
          onClick={() => onSelectNav('study-groups')}
        >
          <span className="nav-icon">👥</span>
          <span>Study Groups</span>
        </button>

        <button
          className={`nav-link ${currentNav === 'materials' ? 'active' : ''}`}
          onClick={() => onSelectNav('materials')}
        >
          <span className="nav-icon">📤</span>
          <span>Upload Syllabus</span>
        </button>

        {(role === 'teacher' || role === 'admin') && (
          <>
            <div className="nav-section-title">Educator Portal</div>
            <button
              className={`nav-link ${currentNav === 'teacher-dashboard' ? 'active' : ''}`}
              onClick={() => onSelectNav('teacher-dashboard')}
            >
              <span className="nav-icon">👩‍🏫</span>
              <span>Teacher Dashboard</span>
            </button>
          </>
        )}

        {role === 'admin' && (
          <>
            <div className="nav-section-title">Administration</div>
            <button
              className={`nav-link ${currentNav === 'admin-content' ? 'active' : ''}`}
              onClick={() => onSelectNav('admin-content')}
            >
              <span className="nav-icon">⚙️</span>
              <span>Content Manager</span>
            </button>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-user-btn" onClick={onOpenAccount}>
          <div className="user-avatar-sm">AR</div>
          <div className="user-info-sm">
            <span className="user-name-sm">Alex Rivera</span>
            <span className="user-role-sm">{role.toUpperCase()}</span>
          </div>
        </button>
        <button className="logout-btn" onClick={onLogout} title="Logout / Switch Persona">
          🚪
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
