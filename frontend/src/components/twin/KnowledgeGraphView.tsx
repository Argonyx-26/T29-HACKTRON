import React, { useState } from 'react';
import { mockConcepts } from '../../services/learningRepository';
import { KnowledgeConcept } from '../../types';

export const KnowledgeGraphView: React.FC = () => {
  const [selectedConcept, setSelectedConcept] = useState<KnowledgeConcept | null>(mockConcepts[0]);

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h2>Cognitive Topology &amp; Knowledge Graph</h2>
          <p className="subtitle">Visualizing concept dependencies, mastery density, and learning trajectories</p>
        </div>
      </div>

      <div className="graph-view-layout">
        <div className="card graph-canvas-card">
          <div className="graph-toolbar">
            <span className="badge badge-accent">Interactive Visualizer</span>
            <div className="legend-items">
              <span className="legend-dot dot-green"></span> Mastered
              <span className="legend-dot dot-yellow"></span> Developing
              <span className="legend-dot dot-red"></span> Emerging / Gaps
            </div>
          </div>

          <div className="graph-visual-area">
            <svg className="graph-svg" viewBox="0 0 700 400">
              <defs>
                <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0.3" />
                </linearGradient>
              </defs>

              {/* Connecting lines */}
              <line x1="150" y1="120" x2="350" y2="100" stroke="url(#edgeGrad)" strokeWidth="3" />
              <line x1="350" y1="100" x2="550" y2="160" stroke="url(#edgeGrad)" strokeWidth="3" />
              <line x1="150" y1="280" x2="350" y2="280" stroke="url(#edgeGrad)" strokeWidth="3" />
              <line x1="350" y1="280" x2="550" y2="160" stroke="url(#edgeGrad)" strokeWidth="3" />

              {/* Node 1 */}
              <g
                className="graph-node-group"
                onClick={() => setSelectedConcept(mockConcepts[3])}
                style={{ cursor: 'pointer' }}
              >
                <circle cx="150" cy="120" r="38" className="node-circle node-mastered" />
                <text x="150" y="125" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="600">
                  Norm &amp; Scale
                </text>
              </g>

              {/* Node 2 */}
              <g
                className="graph-node-group"
                onClick={() => setSelectedConcept(mockConcepts[0])}
                style={{ cursor: 'pointer' }}
              >
                <circle cx="350" cy="100" r="44" className="node-circle node-proficient" />
                <text x="350" y="105" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="600">
                  Neural Nets
                </text>
              </g>

              {/* Node 3 */}
              <g
                className="graph-node-group"
                onClick={() => setSelectedConcept(mockConcepts[1])}
                style={{ cursor: 'pointer' }}
              >
                <circle cx="350" cy="280" r="40" className="node-circle node-developing" />
                <text x="350" y="285" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="600">
                  Gradient Desc.
                </text>
              </g>

              {/* Node 4 (Target) */}
              <g
                className="graph-node-group"
                onClick={() => setSelectedConcept(mockConcepts[2])}
                style={{ cursor: 'pointer' }}
              >
                <circle cx="550" cy="160" r="48" className="node-circle node-emerging active-glow" />
                <text x="550" y="165" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="600">
                  Attention
                </text>
              </g>
            </svg>
          </div>
        </div>

        <div className="card node-inspector-card">
          <div className="card-header">
            <h3>Concept Inspector</h3>
          </div>

          {selectedConcept ? (
            <div className="node-inspector-body">
              <span className="badge badge-accent">{selectedConcept.domain}</span>
              <h4 className="mt-2">{selectedConcept.title}</h4>
              <p className="text-muted small">{selectedConcept.description}</p>

              <div className="inspector-stat-grid mt-3">
                <div className="i-stat">
                  <span className="stat-label">Mastery Level</span>
                  <strong>{selectedConcept.masteryLevel}%</strong>
                </div>
                <div className="i-stat">
                  <span className="stat-label">Cognitive Status</span>
                  <strong>{selectedConcept.status.toUpperCase()}</strong>
                </div>
                <div className="i-stat">
                  <span className="stat-label">Cognitive Load</span>
                  <strong>{selectedConcept.cognitiveLoad}</strong>
                </div>
              </div>

              <div className="prereqs-section mt-3">
                <strong>Prerequisites:</strong>
                <ul className="bullet-list">
                  {selectedConcept.prerequisites.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>

              <button className="btn btn-primary btn-block mt-4">
                Practice This Concept &rarr;
              </button>
            </div>
          ) : (
            <p className="text-muted">Click a graph node to inspect details.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraphView;
