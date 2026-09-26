import React, { useState } from 'react';
import { apiClient } from '../../api/client';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  BookOpen,
  X,
  RefreshCw
} from 'lucide-react';

interface DocumentUploadModalProps {
  onChapterReady: (chapterId?: string) => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  onChapterReady,
  onCancel,
  onClose
}) => {
  const handleDismiss = onClose || onCancel;
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [stage, setStage] = useState<'idle' | 'analyzing' | 'ready'>('idle');
  const [summaryData, setSummaryData] = useState<{
    title: string;
    subject: string;
    conceptsCount: number;
    skillsCount: number;
    questionsCount: number;
    chapterId: string;
  } | null>(null);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (selected.name.toLowerCase().endsWith('.pdf')) {
        setFile(selected);
      } else {
        alert('Please select a PDF document.');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleStartAnalysis = async () => {
    if (!file) return;
    setAnalyzing(true);
    setStage('analyzing');

    try {
      const uploadRes = await apiClient.uploadDocument(file);
      const review = await apiClient.parseDocument(uploadRes.id);
      setStage('ready');
      const targetChapterId = review.chapter_id || uploadRes.chapter_id || review.document_id;
      const detectedConcepts = (review.extracted_outline || []).reduce((count: number, unit: { topics?: string[] }) => count + (unit.topics?.length || 0), 0) || 6;
      setSummaryData({
        title: review.title || file.name.replace(/\.pdf$/i, ''),
        subject: review.subject || 'Curriculum',
        conceptsCount: detectedConcepts,
        skillsCount: review.skills_count || detectedConcepts,
        questionsCount: review.questions_count || 6,
        chapterId: targetChapterId
      });
    } catch (e: any) {
      alert(`Processing error: ${e.message}`);
      setStage('idle');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto w-full px-2 sm:px-0">
      <div
        className="card-panel relative overflow-hidden p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-2xl backdrop-blur-xl"
        style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
      >
        {/* Subtle Ambient Backdrop Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -z-0" />

        {/* Modal Close Button if provided */}
        {handleDismiss && (
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-20"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        )}

        {stage === 'idle' && (
          <div className="relative z-10">
            <div className="text-center mb-6">
              <div
                className="w-14 h-14 rounded-2xl inline-flex items-center justify-center mb-3 shadow-md"
                style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', color: '#0f172a' }}
              >
                <UploadCloud size={28} />
              </div>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#92400e',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fde68a',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  marginBottom: '8px'
                }}
              >
                Bring Your Own Curriculum
              </span>
              <h3
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  letterSpacing: '-0.02em',
                  margin: '4px 0 8px'
                }}
              >
                Upload Learning Material
              </h3>
              <p
                style={{
                  fontSize: '0.85rem',
                  color: '#475569',
                  maxWidth: '430px',
                  margin: '0 auto',
                  lineHeight: 1.55
                }}
              >
                Upload any chapter or textbook PDF. Our AI pipeline extracts concepts, maps prerequisite dependencies, and generates diagnostic evaluation items.
              </p>
            </div>

            {/* Drop Zone */}
            <div
              onDrop={handleFileDrop}
              onDragOver={(e) => e.preventDefault()}
              className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 mb-4 ${
                file
                  ? 'border-blue-600 bg-blue-50/50'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100/80'
              }`}
              onClick={() => document.getElementById('file-upload-input')?.click()}
            >
              <input
                id="file-upload-input"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileSelect}
              />
              <FileText
                size={36}
                className="mx-auto mb-3 transition-colors"
                style={{ color: file ? '#2563eb' : '#64748b' }}
              />
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  color: '#0f172a',
                  wordBreak: 'break-word'
                }}
              >
                {file ? file.name : 'Click to browse or drag & drop PDF here'}
              </div>
              <div
                style={{
                  fontSize: '0.78rem',
                  color: file ? '#2563eb' : '#64748b',
                  fontWeight: file ? 600 : 400,
                  marginTop: '6px'
                }}
              >
                {file
                  ? `${(file.size / 1024).toFixed(0)} KB • Ready for analysis`
                  : 'Supports textbook chapters, lecture notes, or syllabus excerpts (PDF)'}
              </div>
            </div>

            {/* Responsive Actions Footer */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 mt-5 w-full">
              {handleDismiss && (
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="btn btn-secondary w-full sm:w-auto min-h-[44px] justify-center"
                  style={{
                    padding: '10px 20px',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px'
                  }}
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                className="btn btn-primary w-full sm:w-auto min-h-[44px] justify-center relative flex items-center gap-2 group transition-all duration-200 active:scale-[0.98]"
                style={{
                  padding: '11px 24px',
                  fontSize: '0.90rem',
                  fontWeight: 600,
                  borderRadius: '10px',
                  opacity: !file || analyzing ? 0.6 : 1,
                  cursor: !file || analyzing ? 'not-allowed' : 'pointer',
                  backgroundColor: '#10212d',
                  color: '#ffffff',
                  border: '1px solid #10212d',
                  boxShadow: file && !analyzing ? '0 4px 14px rgba(16, 33, 45, 0.22)' : 'none'
                }}
                onClick={handleStartAnalysis}
                disabled={!file || analyzing}
                aria-label="Analyze Material"
              >
                {analyzing ? (
                  <>
                    <RefreshCw size={16} className="animate-spin flex-shrink-0" />
                    <span>Analyzing Material...</span>
                  </>
                ) : (
                  <>
                    <span>Analyze Material</span>
                    <ArrowRight size={16} className="flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {stage === 'analyzing' && (
          <div className="relative z-10 text-center py-10 px-4">
            <div
              className="w-16 h-16 rounded-2xl inline-flex items-center justify-center mb-5 animate-spin"
              style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', color: '#0f172a' }}
            >
              <Sparkles size={28} />
            </div>
            <h3
              style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-0.02em',
                marginBottom: '8px'
              }}
            >
              Analyzing your material...
            </h3>
            <p
              style={{
                fontSize: '0.85rem',
                color: '#475569',
                maxWidth: '380px',
                margin: '0 auto',
                lineHeight: 1.55
              }}
            >
              Extracting foundational concepts, organizing prerequisite skills, and creating diagnostic questions.
            </p>
            <div className="mt-6 flex justify-center">
              <div className="h-1.5 w-48 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-800 animate-pulse w-3/4 rounded-full"
                />
              </div>
            </div>
          </div>
        )}

        {stage === 'ready' && summaryData && (
          <div className="relative z-10">
            <div className="text-center mb-6">
              <div
                className="w-14 h-14 rounded-2xl inline-flex items-center justify-center mb-3 shadow-sm"
                style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669' }}
              >
                <CheckCircle2 size={30} strokeWidth={2.4} />
              </div>
              <h3
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  letterSpacing: '-0.02em'
                }}
              >
                Material Processed
              </h3>
              <p
                style={{
                  fontSize: '0.84rem',
                  color: '#0369a1',
                  fontWeight: 600,
                  marginTop: '4px'
                }}
              >
                {summaryData.title}
              </p>
            </div>

            {/* Structured Summary Checklist - Fixed High Contrast Text Colors */}
            <div
              style={{
                padding: '16px 18px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                boxShadow: '0 1px 4px rgba(15, 23, 42, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '24px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem' }}>
                <CheckCircle2 size={18} style={{ color: '#059669', flexShrink: 0 }} strokeWidth={2.4} />
                <span style={{ color: '#1f2937' }}>
                  <strong style={{ color: '#0f172a', fontWeight: 700 }}>{summaryData.conceptsCount} topic headings</strong> found in the document
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem' }}>
                <CheckCircle2 size={18} style={{ color: '#059669', flexShrink: 0 }} strokeWidth={2.4} />
                <span style={{ color: '#1f2937', fontWeight: 500 }}>
                  Resource stored in your teaching materials library
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem' }}>
                <CheckCircle2 size={18} style={{ color: '#059669', flexShrink: 0 }} strokeWidth={2.4} />
                <span style={{ color: '#1f2937' }}>
                  <strong style={{ color: '#0f172a', fontWeight: 700 }}>{summaryData.questionsCount || 6} diagnostic questions</strong> ready for assessment
                </span>
              </div>
            </div>

            {/* Responsive Actions Footer */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 w-full">
              {handleDismiss && (
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="btn btn-secondary w-full sm:w-auto min-h-[44px] justify-center"
                  style={{
                    padding: '10px 20px',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px'
                  }}
                >
                  Close
                </button>
              )}
              <button
                type="button"
                className="btn btn-primary w-full sm:w-auto min-h-[44px] justify-center flex items-center gap-2 group transition-all duration-200 active:scale-[0.98]"
                style={{
                  padding: '11px 24px',
                  fontSize: '0.90rem',
                  fontWeight: 600,
                  borderRadius: '10px',
                  backgroundColor: '#10212d',
                  color: '#ffffff',
                  border: '1px solid #10212d',
                  boxShadow: '0 4px 14px rgba(16, 33, 45, 0.22)'
                }}
                onClick={() => onChapterReady(summaryData.chapterId)}
              >
                <span>Start Assessment</span>
                <ArrowRight size={16} className="flex-shrink-0 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

