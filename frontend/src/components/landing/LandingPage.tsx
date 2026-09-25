import React from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="landing-wrapper">
      <header className="landing-nav">
        <div className="brand-logo">
          <span className="logo-glow">🧠</span>
          <span className="brand-text">Knowledge Twin <span className="badge badge-accent">T29</span></span>
        </div>
        <button className="btn btn-primary" onClick={onGetStarted}>
          Launch App
        </button>
      </header>

      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">Next-Gen Cognitive Architecture</div>
          <h1 className="hero-title">
            Your Personal <span className="gradient-text">AI Cognitive Twin</span> For Adaptive Learning
          </h1>
          <p className="hero-subtitle">
            Knowledge Twin builds a living, dynamic representation of your mental model.
            It diagnoses prerequisite blind spots, predicts forgetting curves, and guides mastery
            with laser-focused micro-interventions.
          </p>

          <div className="hero-cta-group">
            <button className="btn btn-primary btn-lg" onClick={onGetStarted}>
              Experience Your Twin &rarr;
            </button>
            <a href="#features" className="btn btn-secondary btn-lg">
              Explore Architecture
            </a>
          </div>
        </div>

        <div className="hero-preview-card">
          <div className="preview-top-bar">
            <span className="dot dot-red"></span>
            <span className="dot dot-yellow"></span>
            <span className="dot dot-green"></span>
            <span className="preview-title">Cognitive Twin Live Telemetry</span>
          </div>
          <div className="preview-body">
            <div className="telemetry-item">
              <span>Mental Model Coherence</span>
              <strong className="text-success">92.4%</strong>
            </div>
            <div className="telemetry-item">
              <span>Prerequisite Latency</span>
              <strong className="text-accent">18ms (Optimal)</strong>
            </div>
            <div className="telemetry-item">
              <span>Active Micro-Intervention</span>
              <strong className="text-warning">Attention Projection</strong>
            </div>
            <div className="telemetry-graph-visual">
              <div className="node node-1 active">Attention</div>
              <div className="edge edge-1"></div>
              <div className="node node-2">Vector Math</div>
              <div className="edge edge-2"></div>
              <div className="node node-3">Transformers</div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="features-section">
        <div className="section-title">
          <h2>Engineered For Cognitive Breakthroughs</h2>
          <p className="subtitle">Four foundational pillars of the T29 Knowledge Twin platform</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Latent Gap Diagnostics</h3>
            <p>Identifies not just what you got wrong, but the exact underlying conceptual distortion causing the error.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Socratic Twin Chat</h3>
            <p>An intelligent agent that calibrates tone, depth, and scaffolding according to your real-time mastery level.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Targeted Interventions</h3>
            <p>Bite-sized simulations and targeted drills that resolve confusion in minutes instead of re-reading chapters.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Educator Telemetry</h3>
            <p>Actionable cohort heatmaps that let instructors spot systemic classroom roadblocks instantly.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
