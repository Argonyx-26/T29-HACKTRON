import React from 'react';
import { mockConcepts, mockInterventions } from '../../services/learningRepository';

export const TeacherDashboard: React.FC = () => {
  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h2>Educator Mastery &amp; Telemetry Hub</h2>
          <p className="subtitle">Real-time cohort insights, systemic bottleneck detection, and intervention triggers</p>
        </div>
        <button className="btn btn-primary">+ Broadcast Class Intervention</button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">Enrolled Students</span>
          <span className="stat-value">34</span>
          <span className="stat-trend neutral">Cohort Alpha</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Systemic Roadblocks</span>
          <span className="stat-value text-danger">1 Critical</span>
          <span className="stat-trend negative">Attention Dot-Product</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Intervention Completion</span>
          <span className="stat-value text-success">74%</span>
          <span className="stat-trend positive">+12% vs last week</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active Twins Synced</span>
          <span className="stat-value">31 / 34</span>
          <span className="stat-trend positive">91% active today</span>
        </div>
      </div>

      <div className="two-col-grid mt-4">
        <div className="card">
          <div className="card-header">
            <h3>Class Concept Heatmap</h3>
            <span className="badge badge-accent">Curriculum Progress</span>
          </div>
          <div className="heatmap-list">
            {mockConcepts.map((concept) => (
              <div key={concept.id} className="heatmap-item">
                <div className="heatmap-info">
                  <strong>{concept.title}</strong>
                  <span className="text-muted small">{concept.domain}</span>
                </div>
                <div className="heatmap-bar-container">
                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${concept.masteryLevel}%`,
                        backgroundColor:
                          concept.masteryLevel < 50
                            ? 'var(--color-danger)'
                            : concept.masteryLevel < 75
                            ? 'var(--color-warning)'
                            : 'var(--color-success)',
                      }}
                    ></div>
                  </div>
                  <span className="heatmap-pct">{concept.masteryLevel}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Active High-Urgency Interventions</h3>
            <span className="badge badge-danger">Needs Attention</span>
          </div>
          <div className="teacher-alerts-list">
            {mockInterventions.map((inv) => (
              <div key={inv.id} className="teacher-alert-card">
                <div className="alert-header">
                  <strong>{inv.conceptTitle}</strong>
                  <span className="badge badge-danger">{inv.urgency}</span>
                </div>
                <p className="small text-muted">{inv.misconception}</p>
                <div className="alert-actions mt-2">
                  <button className="btn btn-sm btn-secondary">Assign Review Session</button>
                  <button className="btn btn-sm btn-primary">Review Twin Trace</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
