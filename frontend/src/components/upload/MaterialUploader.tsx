import React, { useState } from 'react';
import { mockUploadedMaterials } from '../../services/learningRepository';
import { UploadedMaterial } from '../../types';

export const MaterialUploader: React.FC = () => {
  const [materials, setMaterials] = useState<UploadedMaterial[]>(mockUploadedMaterials);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleSimulatedUpload = (fileName: string) => {
    setUploading(true);
    setTimeout(() => {
      const newMat: UploadedMaterial = {
        id: `mat-${Date.now()}`,
        fileName: fileName || 'Custom_Curriculum_Document.pdf',
        fileSize: '2.4 MB',
        uploadedAt: 'Just now',
        status: 'indexed',
        extractedConceptsCount: 9,
      };
      setMaterials([newMat, ...materials]);
      setUploading(false);
    }, 1200);
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h2>Curriculum &amp; Syllabus Document Ingestion</h2>
          <p className="subtitle">Upload lecture notes, textbooks, and problem sets to automatically extract knowledge nodes</p>
        </div>
      </div>

      <div
        className={`upload-dropzone card ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const files = e.dataTransfer.files;
          if (files.length > 0) {
            handleSimulatedUpload(files[0].name);
          }
        }}
      >
        <div className="dropzone-content">
          <div className="upload-icon">📁</div>
          <h3>Drag and drop your study materials here</h3>
          <p className="text-muted">Supports PDF, PPTX, DOCX, Markdown, and LaTeX files up to 50MB</p>

          <div className="upload-btn-row">
            <button
              className="btn btn-primary"
              disabled={uploading}
              onClick={() => handleSimulatedUpload('Chapter_6_Attention_Mechanisms.pdf')}
            >
              {uploading ? 'Extracting Ontology & Ingesting...' : 'Browse or Ingest Demo PDF'}
            </button>
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header">
          <h3>Ingested Materials &amp; Concepts ({materials.length})</h3>
          <span className="badge badge-success">RAG Pipeline Synchronized</span>
        </div>

        <div className="materials-list">
          {materials.map((m) => (
            <div key={m.id} className="material-item">
              <div className="mat-icon">📄</div>
              <div className="mat-details">
                <strong>{m.fileName}</strong>
                <span className="text-muted small">{m.fileSize} • Uploaded {m.uploadedAt}</span>
              </div>
              <div className="mat-badge">
                <span className="badge badge-accent">{m.extractedConceptsCount} concepts extracted</span>
              </div>
              <div className="mat-status">
                <span className="badge badge-success">{m.status.toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MaterialUploader;
