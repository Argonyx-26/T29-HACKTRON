import React, { useState } from 'react';

export const DiagnosticRunner: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);

  const startDiagnostic = () => {
    setIsRunning(true);
    setProgress(15);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRunning(false);
          setCompleted(true);
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h2>Cognitive Twin Diagnostic Engine</h2>
          <p className="subtitle">Real-time deep scan of prerequisite understanding, blind spots, and mastery latency</p>
        </div>
      </div>

      <div className="card">
        <div className="diagnostic-hero">
          <div className="pulse-orb">
            <span className="orb-icon">🧠</span>
          </div>
          <h3>AI Cognitive State Tracer</h3>
          <p className="text-muted">
            The diagnostic scans across your knowledge topology to detect latent misconceptions
            and recommend high-impact micro-interventions before advanced coursework.
          </p>

          {!isRunning && !completed && (
            <button className="btn btn-primary btn-lg" onClick={startDiagnostic}>
              Launch Deep Diagnostic Scan
            </button>
          )}

          {isRunning && (
            <div className="diagnostic-progress-container">
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="progress-status-text">
                Analyzing cognitive paths... {progress}%
              </p>
            </div>
          )}

          {completed && (
            <div className="diagnostic-results">
              <div className="status-badge-ok">Diagnostic Analysis Completed</div>
              <div className="results-grid">
                <div className="res-card">
                  <h4>Identified Blindspot</h4>
                  <p>Scaled Dot-Product Attention: Dimension Scaling</p>
                  <span className="badge badge-warning">High Priority</span>
                </div>
                <div className="res-card">
                  <h4>Recommended Path</h4>
                  <p>Review Matrix Dot Products &gt; 3D Projection Sandbox</p>
                  <span className="badge badge-accent">Remediation Ready</span>
                </div>
                <div className="res-card">
                  <h4>Confidence Score</h4>
                  <p>87% Model Accuracy on Prerequisite Gaps</p>
                  <span className="badge badge-success">Calibrated</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiagnosticRunner;
