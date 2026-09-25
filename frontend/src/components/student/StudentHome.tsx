import React from 'react';
import { mockUser, mockConcepts, mockInterventions } from '../../services/learningRepository';
import { NavItem } from '../layout/Sidebar';

interface StudentHomeProps {
  onNavigate: (view: NavItem) => void;
}

export const StudentHome: React.FC<StudentHomeProps> = ({ onNavigate }) => {
  const pendingInterventions = mockInterventions.filter((i) => !i.completed);
  const avgMastery = Math.round(
    mockConcepts.reduce((acc, c) => acc + c.masteryLevel, 0) / mockConcepts.length
  );

  return (
    <div className="view-container">
      <div className="welcome-banner">
        <div>
          <h2>Welcome back, {mockUser.name}! 🚀</h2>
          <p className="subtitle">
            Your Knowledge Twin has calibrated your trajectory. Recommended next step: address high-priority misconception in Attention Mechanisms.
          </p>
        </div>
        <div className="banner-stats">
          <div className="b-stat">
            <span className="b-stat-num">{mockUser.streakDays}</span>
            <span className="b-stat-lbl">Day Streak 🔥</span>
          </div>
          <div className="b-stat">
            <span className="b-stat-num">{avgMastery}%</span>
            <span className="b-stat-lbl">Avg Mastery</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card next-action-card">
          <div className="card-header">
            <h3>⚡ Recommended Next Action</h3>
            <span className="badge badge-danger">Immediate Impact</span>
          </div>
          <div className="action-highlight">
            <h4>Scaled Dot-Product Attention: 3D Visualization</h4>
            <p>
              Your twin noticed confusion around why keys and queries are dot-product scaled by sqrt(d_k).
              A 3-minute interactive drill will lock in this prerequisite.
            </p>
            <div className="action-buttons">
              <button className="btn btn-primary" onClick={() => onNavigate('interventions')}>
                Start Micro-Intervention &rarr;
              </button>
              <button className="btn btn-secondary" onClick={() => onNavigate('twin-chat')}>
                Ask Twin To Explain
              </button>
            </div>
          </div>
        </div>

        <div className="card twin-status-card">
          <div className="card-header">
            <h3>🤖 Twin Cognitive State</h3>
            <span className="badge badge-accent">Synchronized</span>
          </div>
          <div className="twin-telemetry">
            <div className="telem-row">
              <span>Mental Model Stability</span>
              <div className="mini-bar">
                <div className="mini-fill" style={{ width: '84%' }}></div>
              </div>
              <span className="telem-val">84%</span>
            </div>
            <div className="telem-row">
              <span>Working Memory Retention</span>
              <div className="mini-bar">
                <div className="mini-fill" style={{ width: '91%' }}></div>
              </div>
              <span className="telem-val">91%</span>
            </div>
            <div className="telem-row">
              <span>Prerequisite Coverage</span>
              <div className="mini-bar">
                <div className="mini-fill" style={{ width: '70%' }}></div>
              </div>
              <span className="telem-val">70%</span>
            </div>
          </div>
          <button className="btn btn-secondary btn-block mt-3" onClick={() => onNavigate('diagnostic')}>
            Run Full Diagnostic Scan
          </button>
        </div>
      </div>

      <div className="two-col-grid mt-4">
        <div className="card">
          <div className="card-header">
            <h3>Active Concept Mastery</h3>
            <button className="btn btn-sm btn-secondary" onClick={() => onNavigate('progress')}>
              View All
            </button>
          </div>
          <div className="concepts-compact-list">
            {mockConcepts.slice(0, 3).map((concept) => (
              <div key={concept.id} className="concept-compact-row">
                <div className="c-info">
                  <strong>{concept.title}</strong>
                  <span className="text-muted small">{concept.domain}</span>
                </div>
                <div className="c-meter">
                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${concept.masteryLevel}%` }}
                    ></div>
                  </div>
                  <span className="c-pct">{concept.masteryLevel}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Pending Interventions ({pendingInterventions.length})</h3>
            <button className="btn btn-sm btn-secondary" onClick={() => onNavigate('interventions')}>
              Review
            </button>
          </div>
          <div className="interventions-compact">
            {pendingInterventions.map((inv) => (
              <div key={inv.id} className="inv-compact-item">
                <span className="badge badge-warning">{inv.urgency}</span>
                <div>
                  <strong>{inv.conceptTitle}</strong>
                  <p className="text-muted small">{inv.misconception}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentHome;
