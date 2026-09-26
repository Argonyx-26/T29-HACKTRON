import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Award,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Calendar,
  Layers,
  HelpCircle,
  Eye,
  X
} from 'lucide-react';
import { AssessmentReport, EvaluatedTestItem } from '../../types';

interface PastAttemptReportModalProps {
  report: AssessmentReport;
  onClose: () => void;
  onNavigateToIntervention: (skillId: string, patternId: string, classification: string) => void;
  onRetakeTopic?: (chapterId?: string) => void;
}

export const PastAttemptReportModal: React.FC<PastAttemptReportModalProps> = ({
  report,
  onClose,
  onNavigateToIntervention,
  onRetakeTopic
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'correct' | 'incorrect'>('all');

  const items = report.evaluated_items || [];
  const misconceptionsList = items.filter(
    it => !it.diagnosis.correct && it.diagnosis.likely_misconception && it.studentAnswer !== '(No answer provided)'
  );

  const filteredItems = items.filter(it => {
    if (filterMode === 'correct') return it.diagnosis.correct;
    if (filterMode === 'incorrect') return !it.diagnosis.correct;
    return true;
  });

  const formattedDate = report.created_at
    ? new Date(report.created_at).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : 'Recent assessment';

  const scorePct = report.score_percent ?? 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(17, 29, 42, 0.45)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card-panel past-attempt-modal"
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px 32px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '22px',
          boxShadow: '0 20px 50px rgba(17, 29, 42, 0.16)',
          border: '1px solid #c8cdce',
          background: '#ffffff',
          borderRadius: '16px',
          color: '#17212a'
        }}
      >
        {/* Top Bar with Close Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={onClose}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '0.82rem', background: '#ffffff', border: '1px solid #cbd0d1', color: '#26343d', borderRadius: '6px', fontWeight: 600 }}
            >
              <ArrowLeft size={15} /> Back to Past Attempts
            </button>
            <span style={{ fontSize: '0.82rem', color: '#58646b', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 500 }}>
              <Calendar size={13} color="#58646b" /> {formattedDate}
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close report modal"
            style={{
              background: '#f1f5f7',
              border: '1px solid #cbd0d1',
              borderRadius: '8px',
              padding: '6px 8px',
              color: '#46535a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Hero Score Banner */}
        <div
          style={{
            position: 'relative',
            borderRadius: '14px',
            padding: '24px 26px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            border: '1px solid #dbe2e6',
            overflow: 'hidden'
          }}
        >
          {/* Top color border */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: scorePct >= 80
                ? 'linear-gradient(90deg, #059669, #10b981)'
                : scorePct >= 50
                ? 'linear-gradient(90deg, #d97706, #f59e0b)'
                : 'linear-gradient(90deg, #dc2626, #ef4444)'
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '5px',
                  background: '#ede9fe',
                  border: '1px solid #ddd6fe',
                  color: '#6d28d9',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '8px'
                }}
              >
                <Award size={14} color="#6d28d9" /> Completed Test Paper Report
              </span>
              <h2 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 2px' }}>
                {report.chapter_title}
              </h2>
              <p style={{ fontSize: '0.84rem', color: '#58646b', margin: 0 }}>
                Permanent evaluation record • {items.length} Questions Reviewed
              </p>
            </div>

            {/* Score Ring / Pill */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px 26px',
                borderRadius: '12px',
                background: scorePct >= 80 ? '#ecfdf5' : scorePct >= 50 ? '#fffbeb' : '#fef2f2',
                border: `1px solid ${scorePct >= 80 ? '#a7f3d0' : scorePct >= 50 ? '#fde68a' : '#fecaca'}`
              }}
            >
              <span style={{ fontSize: '2.4rem', fontWeight: 900, lineHeight: 1, color: scorePct >= 80 ? '#059669' : scorePct >= 50 ? '#d97706' : '#dc2626' }}>
                {scorePct}%
              </span>
              <span style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: scorePct >= 80 ? '#065f46' : scorePct >= 50 ? '#92400e' : '#991b1b', marginTop: '6px' }}>
                {report.correct_count} of {report.total_questions} Solved Correctly
              </span>
              <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>
                {report.attempted_count} Attempted • {report.incorrect_count} Incorrect
              </span>
            </div>
          </div>

          {/* Quick Metrics Breakdown Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '12px',
              paddingTop: '20px',
              marginTop: '20px',
              borderTop: '1px solid #e2e8f0'
            }}
          >
            <div style={{ padding: '12px', borderRadius: '10px', background: '#ffffff', border: '1px solid #cbd0d1' }}>
              <div style={{ fontSize: '0.7rem', color: '#58646b', textTransform: 'uppercase', fontWeight: 700 }}>Total Questions</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111d2a', marginTop: '2px' }}>{report.total_questions}</div>
              <div style={{ fontSize: '0.68rem', color: '#78828a', marginTop: '2px' }}>Test items</div>
            </div>

            <div style={{ padding: '12px', borderRadius: '10px', background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
              <div style={{ fontSize: '0.7rem', color: '#6d28d9', textTransform: 'uppercase', fontWeight: 700 }}>Attempted</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#5b21b6', marginTop: '2px' }}>{report.attempted_count}</div>
              <div style={{ fontSize: '0.68rem', color: '#7c3aed', marginTop: '2px' }}>{report.correct_count} correct + {report.incorrect_count} wrong</div>
            </div>

            <div style={{ padding: '12px', borderRadius: '10px', background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
              <div style={{ fontSize: '0.7rem', color: '#047857', textTransform: 'uppercase', fontWeight: 700 }}>Correct Solutions</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>{report.correct_count}</div>
              <div style={{ fontSize: '0.68rem', color: '#065f46', marginTop: '2px' }}>Accurate answers</div>
            </div>

            <div style={{ padding: '12px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca' }}>
              <div style={{ fontSize: '0.7rem', color: '#b91c1c', textTransform: 'uppercase', fontWeight: 700 }}>Incorrect</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#dc2626', marginTop: '2px' }}>{report.incorrect_count}</div>
              <div style={{ fontSize: '0.68rem', color: '#991b1b', marginTop: '2px' }}>Counted in attempted</div>
            </div>

            <div style={{ padding: '12px', borderRadius: '10px', background: '#ffffff', border: '1px solid #cbd0d1' }}>
              <div style={{ fontSize: '0.7rem', color: '#58646b', textTransform: 'uppercase', fontWeight: 700 }}>Skipped / Blank</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#475569', marginTop: '2px' }}>
                {Math.max(0, report.total_questions - report.attempted_count)}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#78828a', marginTop: '2px' }}>Unanswered</div>
            </div>

            <div style={{ padding: '12px', borderRadius: '10px', background: '#fffbeb', border: '1px solid #fde68a' }}>
              <div style={{ fontSize: '0.7rem', color: '#b45309', textTransform: 'uppercase', fontWeight: 700 }}>Misconceptions</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#d97706', marginTop: '2px' }}>{misconceptionsList.length}</div>
              <div style={{ fontSize: '0.68rem', color: '#92400e', marginTop: '2px' }}>Gaps diagnosed</div>
            </div>
          </div>
        </div>

        {/* Misconception Remediation Highlights (If Any) */}
        {misconceptionsList.length > 0 && (
          <div
            style={{
              padding: '22px',
              borderRadius: '12px',
              border: '1px solid #fde68a',
              background: '#fffbeb'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <AlertTriangle size={20} color="#b45309" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#92400e', margin: 0 }}>
                Key Learning Issues Identified ({misconceptionsList.length})
              </h3>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#78350f', marginBottom: '14px' }}>
              Our cognitive engine detected step-by-step reasoning gaps. You can launch targeted remediation interventions for these topics:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {misconceptionsList.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '8px',
                    background: '#ffffff',
                    border: '1px solid #fde68a',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div style={{ flex: '1 1 300px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span
                        style={{
                          background: '#fef3c7',
                          border: '1px solid #fde68a',
                          color: '#92400e',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          textTransform: 'uppercase'
                        }}
                      >
                        {item.diagnosis.classification || 'Misconception'}
                      </span>
                      <span style={{ fontSize: '0.76rem', color: '#64748b' }}>Question {items.indexOf(item) + 1}</span>
                    </div>
                    <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0f172a' }}>
                      {item.diagnosis.likely_misconception}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '4px', lineHeight: 1.4 }}>
                      {item.diagnosis.explanation}
                    </div>
                  </div>

                  <button
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      background: '#303a41',
                      color: '#ffffff',
                      border: '1px solid #303a41',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      onClose();
                      onNavigateToIntervention(
                        item.question.skill_id,
                        item.diagnosis.rule_id || 'PAT_DIST_PARTIAL',
                        item.diagnosis.classification || 'procedural'
                      );
                    }}
                  >
                    <span>Fix in Intervention</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Question Review List */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#111d2a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Layers size={18} color="#46535a" /> Question Review & Solutions ({items.length})
            </h3>

            {/* Filter buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: filterMode === 'all' ? '#303a41' : '#ffffff',
                  color: filterMode === 'all' ? '#ffffff' : '#46535a',
                  border: filterMode === 'all' ? '1px solid #303a41' : '1px solid #cbd0d1'
                }}
              >
                All ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('correct')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: filterMode === 'correct' ? '#047857' : '#ffffff',
                  color: filterMode === 'correct' ? '#ffffff' : '#047857',
                  border: filterMode === 'correct' ? '1px solid #047857' : '1px solid #a7f3d0'
                }}
              >
                Correct ({report.correct_count})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('incorrect')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: filterMode === 'incorrect' ? '#b91c1c' : '#ffffff',
                  color: filterMode === 'incorrect' ? '#ffffff' : '#b91c1c',
                  border: filterMode === 'incorrect' ? '1px solid #b91c1c' : '1px solid #fecaca'
                }}
              >
                Incorrect ({report.incorrect_count})
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredItems.map((item, idx) => {
              const isCorrect = item.diagnosis.correct;
              const isBlank = item.studentAnswer === '(No answer provided)';

              return (
                <div
                  key={item.question.id || idx}
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    background: isCorrect ? '#ffffff' : isBlank ? '#f8fafc' : '#ffffff',
                    border: isCorrect
                      ? '1px solid #a7f3d0'
                      : isBlank
                      ? '1px solid #cbd0d1'
                      : '1px solid #fecaca',
                    boxShadow: '0 1px 4px rgba(23, 35, 44, 0.04)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isCorrect ? (
                        <CheckCircle size={18} color="#059669" />
                      ) : (
                        <XCircle size={18} color="#dc2626" />
                      )}
                      <span
                        style={{
                          fontSize: '0.86rem',
                          fontWeight: 700,
                          color: isCorrect ? '#047857' : isBlank ? '#58646b' : '#b91c1c'
                        }}
                      >
                        Question {items.indexOf(item) + 1} • {isCorrect ? 'Correct Solution' : isBlank ? 'Skipped / Left Blank' : 'Incorrect Solution'}
                      </span>
                    </div>

                    {item.question.difficulty && (
                      <span
                        style={{
                          background: '#f1f5f7',
                          border: '1px solid #cbd0d1',
                          color: '#35434c',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          textTransform: 'capitalize'
                        }}
                      >
                        {item.question.difficulty}
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: '0.96rem', fontWeight: 600, color: '#111d2a', marginBottom: '14px', lineHeight: 1.5 }}>
                    {item.question.question_text}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '12px', fontSize: '0.85rem' }}>
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: isCorrect ? '#ecfdf5' : isBlank ? '#f8fafc' : '#fef2f2',
                        border: isCorrect ? '1px solid #a7f3d0' : isBlank ? '1px solid #cbd0d1' : '1px solid #fecaca'
                      }}
                    >
                      <span style={{ color: isCorrect ? '#065f46' : isBlank ? '#58646b' : '#991b1b', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>
                        Your Submitted Answer
                      </span>
                      <strong style={{ color: isCorrect ? '#047857' : isBlank ? '#35434c' : '#b91c1c', fontSize: '1.05rem', fontWeight: 700 }}>
                        {item.studentAnswer || '(No answer provided)'}
                      </strong>
                    </div>

                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0'
                      }}
                    >
                      <span style={{ color: '#065f46', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>
                        Expected Correct Answer
                      </span>
                      <strong style={{ color: '#047857', fontSize: '1.05rem', fontWeight: 700 }}>
                        {item.question.correct_answer}
                      </strong>
                    </div>
                  </div>

                  {item.workShown && item.workShown.length > 0 && (
                    <div style={{ marginBottom: '10px', padding: '12px 14px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <span style={{ color: '#475569', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                        Your Step-by-Step Work:
                      </span>
                      <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '0.84rem', color: '#1e293b', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {item.workShown.map((st, sIdx) => (
                          <li key={sIdx}>{st}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {item.question.expected_steps && item.question.expected_steps.length > 0 && (
                    <div style={{ marginBottom: '10px', padding: '12px 14px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <span style={{ color: '#475569', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                        Standard Solution Steps:
                      </span>
                      <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.84rem', color: '#1e293b', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {item.question.expected_steps.map((st, sIdx) => (
                          <li key={sIdx}>{st}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {!isCorrect && item.diagnosis.likely_misconception && (
                    <div style={{ marginTop: '10px', padding: '10px 14px', borderRadius: '8px', background: '#fffbeb', border: '1px solid #fde68a', fontSize: '0.82rem', color: '#92400e' }}>
                      <strong>Diagnosed Misconception:</strong> {item.diagnosis.likely_misconception} — {item.diagnosis.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Action Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ffffff', border: '1px solid #cbd0d1', color: '#26343d', padding: '8px 16px', borderRadius: '6px', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <ArrowLeft size={15} /> Close & Back to Past Attempts
          </button>

          {onRetakeTopic && (
            <button
              onClick={() => {
                onClose();
                onRetakeTopic(report.chapter_id);
              }}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: '#303a41', border: '1px solid #303a41', color: '#ffffff', padding: '8px 18px', borderRadius: '6px', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}
            >
              <RotateCcw size={15} />
              <span>Retake this Assessment</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PastAttemptReportModal;
