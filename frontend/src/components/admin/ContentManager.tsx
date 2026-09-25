import React, { useState } from 'react';
import { mockUploadedMaterials, mockConcepts } from '../../services/learningRepository';
import { UploadedMaterial, KnowledgeConcept } from '../../types';

export const ContentManager: React.FC = () => {
  const [materials] = useState<UploadedMaterial[]>(mockUploadedMaterials);
  const [concepts] = useState<KnowledgeConcept[]>(mockConcepts);

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h2>Curriculum & Knowledge Graph Management</h2>
          <p className="subtitle">Administer learning domains, prerequisite edges, and raw knowledge ingest</p>
        </div>
        <button className="btn btn-primary">+ Add New Concept</button>
      </div>

      <div className="two-col-grid">
        <div className="card">
          <div className="card-header">
            <h3>Knowledge Nodes ({concepts.length})</h3>
            <span className="badge badge-accent">Active Ontology</span>
          </div>
          <div className="list-group">
            {concepts.map((c) => (
              <div key={c.id} className="list-item">
                <div className="list-item-content">
                  <div className="concept-title-row">
                    <strong>{c.title}</strong>
                    <span className="badge badge-subtle">{c.domain}</span>
                  </div>
                  <p className="text-muted small">{c.description}</p>
                  <div className="tag-cloud">
                    <span className="tag">Load: {c.cognitiveLoad}</span>
                    <span className="tag">Prereqs: {c.prerequisites.length}</span>
                  </div>
                </div>
                <div className="list-item-actions">
                  <button className="btn btn-sm btn-secondary">Edit Node</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Indexed Documents & Sources</h3>
            <span className="badge badge-success">RAG Pipeline</span>
          </div>
          <div className="list-group">
            {materials.map((m) => (
              <div key={m.id} className="list-item">
                <div className="list-item-content">
                  <strong>{m.fileName}</strong>
                  <p className="text-muted small">{m.fileSize} • Uploaded {m.uploadedAt}</p>
                  <span className="badge badge-success">{m.extractedConceptsCount} concepts extracted</span>
                </div>
                <button className="btn btn-sm btn-secondary">Re-index</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentManager;
