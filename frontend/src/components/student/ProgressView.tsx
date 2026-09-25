import React from 'react';
import { mockConcepts } from '../../services/learningRepository';

export const ProgressView: React.FC = () => {
  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h2>Cognitive Mastery &amp; Retention Analytics</h2>
          <p className="subtitle">Longitudinal tracking of mental model depth and spaced repetition intervals</p>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">Mastered Concepts</span>
          <span className="stat-value">14 / 20</span>
          <span className="stat-trend positive">+3 this week</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Cognitive Velocity</span>
          <span className="stat-value">1.8x</span>
          <span className="stat-trend positive">Above benchmark</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Avg Knowledge Retention</span>
          <span className="stat-value">88.5%</span>
          <span className="stat-trend positive">Ebbinghaus stabilized</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active Interventions</span>
          <span className="stat-value">2</span>
          <span className="stat-trend neutral">Normal load</span>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header">
          <h3>Concept Mastery Breakdown</h3>
          <span className="badge badge-accent">Domain: Deep Learning</span>
        </div>

        <div className="progress-table">
          <div className="table-header-row">
            <span>Concept</span>
            <span>Domain</span>
            <span>Mastery Level</span>
            <span>Status</span>
            <span>Cognitive Load</span>
          </div>

          {mockConcepts.map((concept) => (
            <div key={concept.id} className="table-data-row">
              <span className="cell-title">{concept.title}</span>
              <span className="text-muted">{concept.domain}</span>
              <div className="cell-meter">
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${concept.masteryLevel}%` }}
                  ></div>
                </div>
                <span>{concept.masteryLevel}%</span>
              </div>
              <div>
                <span className={`badge badge-${concept.status}`}>
                  {concept.status}
                </span>
              </div>
              <span className="text-muted">{concept.cognitiveLoad}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressView;
