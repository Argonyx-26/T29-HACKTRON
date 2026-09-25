import React, { useState } from 'react';
import { UserRole } from '../../types';

interface LoginViewProps {
  onLogin: (role: UserRole) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-badge">T29</div>
          <h2>Knowledge Twin</h2>
          <p className="subtitle">Select your persona to enter the adaptive cognitive platform</p>
        </div>

        <div className="role-selector-grid">
          <button
            className={`role-choice-card ${selectedRole === 'student' ? 'active' : ''}`}
            onClick={() => setSelectedRole('student')}
          >
            <span className="role-icon">🎓</span>
            <div className="role-meta">
              <strong>Student</strong>
              <span>Interactive learning, Twin Chat, personalized path</span>
            </div>
          </button>

          <button
            className={`role-choice-card ${selectedRole === 'teacher' ? 'active' : ''}`}
            onClick={() => setSelectedRole('teacher')}
          >
            <span className="role-icon">👩‍🏫</span>
            <div className="role-meta">
              <strong>Educator</strong>
              <span>Cohort analytics, intervention triggers, curriculum heatmaps</span>
            </div>
          </button>

          <button
            className={`role-choice-card ${selectedRole === 'admin' ? 'active' : ''}`}
            onClick={() => setSelectedRole('admin')}
          >
            <span className="role-icon">⚡</span>
            <div className="role-meta">
              <strong>Curriculum Admin</strong>
              <span>Ontology manager, RAG indexing &amp; knowledge sources</span>
            </div>
          </button>
        </div>

        <button
          className="btn btn-primary btn-block btn-lg"
          onClick={() => onLogin(selectedRole)}
        >
          Enter as {selectedRole.toUpperCase()} &rarr;
        </button>
      </div>
    </div>
  );
};

export default LoginView;
