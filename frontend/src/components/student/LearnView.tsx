import React, { useState } from 'react';
import { mockConcepts } from '../../services/learningRepository';
import { KnowledgeConcept } from '../../types';

export const LearnView: React.FC = () => {
  const [concepts] = useState<KnowledgeConcept[]>(mockConcepts);
  const [activeConcept, setActiveConcept] = useState<KnowledgeConcept>(mockConcepts[0]);
  const [twinHint, setTwinHint] = useState<string | null>(null);

  const requestHint = () => {
    setTwinHint(
      `Your Twin advises: Focus on connecting ${activeConcept.title} back to your mastered foundation in ${activeConcept.prerequisites[0] || 'Prerequisites'}. Avoid memorizing formulas—visualize how the vectors transform!`
    );
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h2>Adaptive Learning Workspace</h2>
          <p className="subtitle">Real-time scaffolded concept acquisition driven by your cognitive twin</p>
        </div>
      </div>

      <div className="learn-layout">
        <div className="concept-sidebar">
          <h3>Curriculum Nodes</h3>
          <div className="concept-nav-list">
            {concepts.map((c) => (
              <button
                key={c.id}
                className={`concept-nav-btn ${activeConcept.id === c.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveConcept(c);
                  setTwinHint(null);
                }}
              >
                <div className="c-nav-header">
                  <strong>{c.title}</strong>
                  <span className="badge badge-subtle">{c.masteryLevel}%</span>
                </div>
                <span className="text-muted small">{c.domain}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="concept-main-content">
          <div className="card">
            <div className="card-header">
              <div>
                <span className="badge badge-accent">{activeConcept.domain}</span>
                <h2>{activeConcept.title}</h2>
              </div>
              <div className="mastery-indicator">
                <span className="badge badge-success">{activeConcept.status.toUpperCase()}</span>
              </div>
            </div>

            <p className="concept-description">{activeConcept.description}</p>

            <div className="prereqs-box">
              <strong>Prerequisite Knowledge Graph Links:</strong>
              <div className="tag-cloud mt-2">
                {activeConcept.prerequisites.map((p, idx) => (
                  <span key={idx} className="tag tag-accent">
                    🔗 {p}
                  </span>
                ))}
              </div>
            </div>

            <div className="interactive-sandbox">
              <div className="sandbox-header">
                <h4>Interactive Concept Explorer</h4>
                <button className="btn btn-sm btn-secondary" onClick={requestHint}>
                  💡 Ask Twin For Scaffolded Hint
                </button>
              </div>

              {twinHint && (
                <div className="twin-hint-bubble">
                  {twinHint}
                </div>
              )}

              <div className="interactive-canvas-placeholder">
                <div className="canvas-elements">
                  <div className="input-node">Input Vector [x1, x2]</div>
                  <div className="arrow">&rarr;</div>
                  <div className="hidden-layer">Activation &sigma;(W&middot;x + b)</div>
                  <div className="arrow">&rarr;</div>
                  <div className="output-node">Prediction y&#770;</div>
                </div>
                <p className="text-muted small text-center mt-3">
                  Interactive dynamic simulation dynamically tuned to your cognitive pace.
                </p>
              </div>
            </div>

            <div className="learn-actions">
              <button className="btn btn-primary">Check Understanding</button>
              <button className="btn btn-secondary">Mark Complete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnView;
