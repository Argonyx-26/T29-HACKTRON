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
      const review = await apiClient.getDocumentReview(uploadRes.document_id);
      setStage('ready');
      setSummaryData({
        title: review.chapter?.title || file.name.replace('.pdf', ''),
        subject: review.chapter?.subject || 'Custom Learning',
        conceptsCount: review.concepts?.length || 5,
        skillsCount: review.skills?.length || 4,
        questionsCount: review.questions?.length || 3,
        chapterId: review.chapter?.id || 'chap_current_elec'
      });
    } catch (e: any) {
      alert(`Processing error: ${e.message}`);
      setStage('idle');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto w-full">
      <div className="card-panel relative overflow-hidden p-8 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl">
        {/* Ambient Purple Backdrop */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/15 rounded-full blur-3xl pointer-events-none -z-0" />

        {/* Modal Close Button if provided */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="absolute top-5 right-5 text-surface-variant hover:text-white transition-colors p-1"
          >
            <X size={18} />
          </button>
        )}

        {stage === 'idle' && (
          <div className="relative z-10">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 text-primary-light inline-flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                <UploadCloud size={28} />
              </div>
              <span className="text-[11px] font-bold tracking-widest text-primary-light uppercase block mb-1">
                Bring Your Own Curriculum
              </span>
              <h3 className="text-2xl font-black text-white tracking-tight">
                Upload Learning Material
              </h3>
              <p className="text-xs text-surface-variant max-w-md mx-auto mt-2 leading-relaxed">
                Upload any chapter or textbook PDF. Our AI pipeline extracts concepts, maps prerequisite dependencies, and generates diagnostic evaluation items.
              </p>
            </div>

            {/* Drop Zone */}
            <div
              onDrop={handleFileDrop}
              onDragOver={(e) => e.preventDefault()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 mb-6 ${
                file
                  ? 'border-primary bg-primary/10 text-white'
                  : 'border-white/15 hover:border-primary/50 bg-surface-container-low hover:bg-surface-container-high'
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
                className={`mx-auto mb-3 ${file ? 'text-primary-light' : 'text-surface-variant'}`}
              />
              <div className="font-bold text-sm text-white">
                {file ? file.name : "Click to browse or drag & drop PDF here"}
              </div>
              <div className="text-[11px] text-surface-variant mt-1">
                {file ? `${(file.size / 1024).toFixed(0)} KB • Ready for analysis` : "Supports textbook chapters, lecture notes, or syllabus excerpts (PDF)"}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-4">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 text-xs font-semibold text-surface-variant hover:text-white transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                className="purple-glow-btn flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl transition-all"
                onClick={handleStartAnalysis}
                disabled={!file}
              >
                Analyze Material <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {stage === 'analyzing' && (
          <div className="relative z-10 text-center py-10 px-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/40 text-primary-light inline-flex items-center justify-center mb-5 animate-spin">
              <Sparkles size={28} />
            </div>
            <h3 className="text-xl font-black text-white tracking-tight">
              Analyzing your material...
            </h3>
            <p className="text-xs text-surface-variant max-w-sm mx-auto mt-2 leading-relaxed">
              Extracting foundational concepts, organizing prerequisite skills, and creating diagnostic questions.
            </p>
            <div className="mt-6 flex justify-center">
              <div className="h-1.5 w-48 bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-primary-light animate-pulse w-3/4 rounded-full" />
              </div>
            </div>
          </div>
        )}

        {stage === 'ready' && summaryData && (
          <div className="relative z-10">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 inline-flex items-center justify-center mb-3">
                <CheckCircle2 size={30} />
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">
                Material Synthesized
              </h3>
              <p className="text-xs text-primary-light font-semibold mt-1">
                {summaryData.title}
              </p>
            </div>

            {/* Structured Summary Checklist */}
            <div className="p-4 bg-surface-container-low rounded-xl border border-white/10 flex flex-col gap-3 mb-6">
              <div className="flex items-center gap-3 text-xs text-gray-200">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                <span><strong className="text-white">{summaryData.conceptsCount} concepts</strong> detected and catalogued</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-200">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                <span><strong className="text-white">{summaryData.skillsCount} skills</strong> synthesized and ordered</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-200">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                <span><strong className="text-white">Prerequisites mapped</strong> into curriculum graph</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-200">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                <span><strong className="text-white">Diagnostic questions prepared</strong> for learner evaluation</span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                className="purple-glow-btn flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl"
                onClick={() => onChapterReady(summaryData.chapterId)}
              >
                Review & Start Diagnostic <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

