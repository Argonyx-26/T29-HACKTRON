import React, { useState, useEffect } from 'react';
import { Question, DiagnosisResult, Chapter } from '../../types';
import { apiClient } from '../../api/client';
import { learningRepository } from '../../services/learningRepository';
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  BookOpen,
  AlertTriangle,
  RotateCcw,
  Check,
  Award,
  HelpCircle,
  FileText
} from 'lucide-react';

interface DiagnosticRunnerProps {
  studentId: string;
  onAttemptCompleted: () => void;
  onNavigateToIntervention: (skillId: string, patternId: string, classification: string) => void;
  activeChapterId?: string;
}

interface QuestionResponse {
  answer: string;
  steps: string[];
}

interface EvaluatedItem {
  question: Question;
  studentAnswer: string;
  workShown: string[];
  diagnosis: DiagnosisResult;
}

interface FinalDiagnosticReport {
  chapterTitle: string;
  totalQuestions: number;
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  scorePercent: number;
  items: EvaluatedItem[];
}

export const DiagnosticRunner: React.FC<DiagnosticRunnerProps> = ({
  studentId,
  onAttemptCompleted,
  onNavigateToIntervention,
  activeChapterId
}) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string>(activeChapterId || '');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Stored answers per question ID (stores answers without analyzing immediately)
  const [responses, setResponses] = useState<Record<string, QuestionResponse>>({});

  // Submitting all answers and evaluating final report
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [evalProgress, setEvalProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [finalReport, setFinalReport] = useState<FinalDiagnosticReport | null>(null);

  // Manual toggle for Show Work scratchpad on non-theory questions
  const [manualWorkOpen, setManualWorkOpen] = useState<Record<string, boolean>>({});

  const isTheoryQuestion = (q?: Question | null): boolean => {
    if (!q) return false;
    if (q.diagnostic_tags && q.diagnostic_tags.some((t: string) =>
      /theory|concept|definition|principle|explanation/i.test(t)
    )) {
      return true;
    }
    const text = (q.question_text || '').toLowerCase();
    const theoryKeywords = [
      'explain',
      'describe',
      'why',
      'define',
      'state the',
      'what is meant by',
      'principle of',
      'in theory',
      'give reasons',
      'justify',
      'state ohm',
      'state newton',
      'what does'
    ];
    return theoryKeywords.some(keyword => text.includes(keyword));
  };

  useEffect(() => {
    loadChapters();
  }, []);

  useEffect(() => {
    if (activeChapterId) {
      setSelectedChapterId(activeChapterId);
    }
  }, [activeChapterId]);

  useEffect(() => {
    if (selectedChapterId) {
      loadQuestions(selectedChapterId);
    } else {
      setQuestions([]);
    }
  }, [selectedChapterId]);

  const loadChapters = async () => {
    try {
      const chaps = await apiClient.getChapters();
      setChapters(chaps);
      if (activeChapterId) {
        setSelectedChapterId(activeChapterId);
      } else if (chaps.length > 0 && !selectedChapterId) {
        setSelectedChapterId(chaps[0].id);
      }
    } catch (e) {
      console.error('Failed to load chapters', e);
    }
  };

  const loadQuestions = async (chapterId: string) => {
    try {
      const qList = await apiClient.getChapterQuestions(chapterId);
      setQuestions(qList);
      setCurrentIndex(0);
      setResponses({});
      setFinalReport(null);
    } catch (e) {
      console.error('Failed to load questions for chapter', e);
    }
  };

  const currentQ = questions[currentIndex];
  const currentResponse = currentQ ? (responses[currentQ.id] || { answer: '', steps: [] }) : { answer: '', steps: [] };

  const handleAnswerChange = (val: string) => {
    if (!currentQ) return;
    setResponses(prev => ({
      ...prev,
      [currentQ.id]: {
        answer: val,
        steps: prev[currentQ.id]?.steps || []
      }
    }));
  };

  const handleAddStep = () => {
    if (!currentQ) return;
    setResponses(prev => {
      const existing = prev[currentQ.id] || { answer: '', steps: [] };
      return {
        ...prev,
        [currentQ.id]: {
          ...existing,
          steps: [...existing.steps, '']
        }
      };
    });
  };

  const handleStepChange = (index: number, val: string) => {
    if (!currentQ) return;
    setResponses(prev => {
      const existing = prev[currentQ.id] || { answer: '', steps: [] };
      const updatedSteps = [...existing.steps];
      updatedSteps[index] = val;
      return {
        ...prev,
        [currentQ.id]: {
          ...existing,
          steps: updatedSteps
        }
      };
    });
  };

  const handleRemoveStep = (index: number) => {
    if (!currentQ) return;
    setResponses(prev => {
      const existing = prev[currentQ.id] || { answer: '', steps: [] };
      return {
        ...prev,
        [currentQ.id]: {
          ...existing,
          steps: existing.steps.filter((_, i) => i !== index)
        }
      };
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // A question is attempted if either direct answer or steps are filled
  const getQuestionResolvedAnswer = (qId: string): { answer: string; steps: string[] } => {
    const resp = responses[qId] || { answer: '', steps: [] };
    const directAns = (resp.answer || '').trim();
    const cleanSteps = (resp.steps || []).filter(s => s.trim().length > 0);
    if (directAns) {
      return { answer: directAns, steps: cleanSteps };
    }
    if (cleanSteps.length > 0) {
      return { answer: cleanSteps[cleanSteps.length - 1], steps: cleanSteps };
    }
    return { answer: '', steps: cleanSteps };
  };

  const answeredCount = questions.filter(q => {
    const res = getQuestionResolvedAnswer(q.id);
    return res.answer.length > 0;
  }).length;

  // Submit all stored answers and generate the final diagnostic report
  const handleFinishAndSubmit = async () => {
    if (questions.length === 0) return;
    if (answeredCount === 0) {
      alert('Please answer at least one question before generating your report.');
      return;
    }

    setEvaluating(true);
    setEvalProgress({ current: 0, total: questions.length });

    const evaluatedItems: EvaluatedItem[] = [];
    let correctTotal = 0;
    let incorrectTotal = 0;
    let attemptedTotal = 0;
    let skippedTotal = 0;

    try {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const resolved = getQuestionResolvedAnswer(q.id);
        const cleanAnswer = resolved.answer;
        const filteredSteps = resolved.steps;

        setEvalProgress({ current: i + 1, total: questions.length });

        if (cleanAnswer) {
          attemptedTotal++;
          try {
            const diag = await apiClient.submitAttempt({
              student_id: studentId,
              question_id: q.id,
              answer: cleanAnswer,
              work_shown: filteredSteps,
              input_mode: filteredSteps.length > 0 ? 'steps' : 'answer_only'
            });
            if (diag.correct) {
              correctTotal++;
            } else {
              incorrectTotal++;
            }
            evaluatedItems.push({
              question: q,
              studentAnswer: cleanAnswer,
              workShown: filteredSteps,
              diagnosis: diag
            });
          } catch (err: any) {
            console.error(`Error submitting question ${q.id}:`, err);
            const isCorr = cleanAnswer.toLowerCase() === q.correct_answer.toLowerCase();
            if (isCorr) {
              correctTotal++;
            } else {
              incorrectTotal++;
            }
            evaluatedItems.push({
              question: q,
              studentAnswer: cleanAnswer,
              workShown: filteredSteps,
              diagnosis: {
                attempt_id: `att_${Date.now()}`,
                evaluated_answer: cleanAnswer,
                correct: isCorr,
                engine_used: 'none',
                twin_updated: false,
                new_pattern_discovered: false,
                pattern_library_count: 0,
                explanation: `Correct answer: ${q.correct_answer}`
              }
            });
          }
        } else {
          // Unanswered item (student left blank)
          skippedTotal++;
          evaluatedItems.push({
            question: q,
            studentAnswer: '(No answer provided)',
            workShown: [],
            diagnosis: {
              attempt_id: `att_skip_${q.id}`,
              evaluated_answer: '',
              correct: false,
              engine_used: 'none',
              twin_updated: false,
              new_pattern_discovered: false,
              pattern_library_count: 0,
              likely_misconception: 'Unanswered Question',
              classification: 'prerequisite_gap',
              explanation: `This question was left blank. The expected answer is: ${q.correct_answer}`
            }
          });
        }
      }

      const activeChap = chapters.find(c => c.id === selectedChapterId);
      const scorePct = Math.round((correctTotal / questions.length) * 100);

      const reportData: FinalDiagnosticReport = {
        chapterTitle: activeChap ? `${activeChap.subject}: ${activeChap.title}` : 'Diagnostic Assessment',
        totalQuestions: questions.length,
        attemptedCount: attemptedTotal,
        correctCount: correctTotal,
        incorrectCount: incorrectTotal,
        skippedCount: skippedTotal,
        scorePercent: scorePct,
        items: evaluatedItems
      };

      setFinalReport(reportData);

      // Save report to authoritative backend and local storage cache
      try {
        await learningRepository.saveAssessmentReport({
          id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          student_id: studentId,
          chapter_id: selectedChapterId,
          chapter_title: reportData.chapterTitle,
          total_questions: reportData.totalQuestions,
          attempted_count: reportData.attemptedCount,
          correct_count: reportData.correctCount,
          incorrect_count: reportData.incorrectCount,
          score_percent: reportData.scorePercent,
          evaluated_items: evaluatedItems,
          created_at: new Date().toISOString()
        });
      } catch (saveErr) {
        console.warn('Could not persist assessment report:', saveErr);
      }

      onAttemptCompleted();
    } catch (e: any) {
      alert(`Evaluation error: ${e.message}`);
    } finally {
      setEvaluating(false);
    }
  };

  const handleRetake = () => {
    setResponses({});
    setFinalReport(null);
    setCurrentIndex(0);
  };

  // -------------------------------------------------------------
  // VIEW: FINAL DIAGNOSTIC REPORT
  // -------------------------------------------------------------
  if (finalReport) {
    const misconceptionsList = finalReport.items.filter(it => !it.diagnosis.correct && it.diagnosis.likely_misconception && it.studentAnswer !== '(No answer provided)');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '880px', margin: '0 auto' }}>
        
        {/* Hero Score Card */}
        <div className="card-panel" style={{ padding: '28px 32px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', border: '1px solid #dbe2e6', borderRadius: '14px' }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: finalReport.scorePercent >= 80 
                ? 'linear-gradient(90deg, #059669, #10b981)'
                : finalReport.scorePercent >= 50
                ? 'linear-gradient(90deg, #d97706, #f59e0b)'
                : 'linear-gradient(90deg, #dc2626, #ef4444)'
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '22px' }}>
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
                <Award size={14} color="#6d28d9" /> Diagnostic Evaluation Complete
              </span>
              <h2 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 2px' }}>
                {finalReport.chapterTitle}
              </h2>
              <p style={{ fontSize: '0.84rem', color: '#58646b', margin: 0 }}>
                Comprehensive multi-dimensional analysis of your responses, step transitions, and cognitive misconceptions.
              </p>
            </div>

            {/* Score Ring / Pill */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 26px',
              borderRadius: '12px',
              background: finalReport.scorePercent >= 80 ? '#ecfdf5' : finalReport.scorePercent >= 50 ? '#fffbeb' : '#fef2f2',
              border: `1px solid ${finalReport.scorePercent >= 80 ? '#a7f3d0' : finalReport.scorePercent >= 50 ? '#fde68a' : '#fecaca'}`
            }}>
              <span style={{ fontSize: '2.4rem', fontWeight: 900, lineHeight: 1, color: finalReport.scorePercent >= 80 ? '#059669' : finalReport.scorePercent >= 50 ? '#d97706' : '#dc2626' }}>
                {finalReport.scorePercent}%
              </span>
              <span style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: finalReport.scorePercent >= 80 ? '#065f46' : finalReport.scorePercent >= 50 ? '#92400e' : '#991b1b', marginTop: '6px' }}>
                {finalReport.correctCount} of {finalReport.totalQuestions} Solved Correctly
              </span>
              <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>
                {finalReport.attemptedCount} Attempted • {finalReport.incorrectCount} Incorrect
              </span>
            </div>
          </div>

          {/* Comprehensive Multi-Metric Performance Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', paddingTop: '18px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ padding: '12px', borderRadius: '10px', background: '#ffffff', border: '1px solid #cbd0d1' }}>
              <div style={{ fontSize: '0.7rem', color: '#58646b', textTransform: 'uppercase', fontWeight: 700 }}>Total Questions</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111d2a', marginTop: '2px' }}>{finalReport.totalQuestions}</div>
              <div style={{ fontSize: '0.68rem', color: '#78828a', marginTop: '2px' }}>Paper length</div>
            </div>
            
            <div style={{ padding: '12px', borderRadius: '10px', background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
              <div style={{ fontSize: '0.7rem', color: '#6d28d9', textTransform: 'uppercase', fontWeight: 700 }}>Attempted</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#5b21b6', marginTop: '2px' }}>{finalReport.attemptedCount}</div>
              <div style={{ fontSize: '0.68rem', color: '#7c3aed', marginTop: '2px' }}>{finalReport.correctCount} correct + {finalReport.incorrectCount} wrong</div>
            </div>

            <div style={{ padding: '12px', borderRadius: '10px', background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
              <div style={{ fontSize: '0.7rem', color: '#047857', textTransform: 'uppercase', fontWeight: 700 }}>Correct Solutions</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>{finalReport.correctCount}</div>
              <div style={{ fontSize: '0.68rem', color: '#065f46', marginTop: '2px' }}>Accurate answers</div>
            </div>

            <div style={{ padding: '12px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca' }}>
              <div style={{ fontSize: '0.7rem', color: '#b91c1c', textTransform: 'uppercase', fontWeight: 700 }}>Incorrect</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#dc2626', marginTop: '2px' }}>{finalReport.incorrectCount}</div>
              <div style={{ fontSize: '0.68rem', color: '#991b1b', marginTop: '2px' }}>Counted in attempted</div>
            </div>

            <div style={{ padding: '12px', borderRadius: '10px', background: '#ffffff', border: '1px solid #cbd0d1' }}>
              <div style={{ fontSize: '0.7rem', color: '#58646b', textTransform: 'uppercase', fontWeight: 700 }}>Skipped / Blank</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#475569', marginTop: '2px' }}>{finalReport.skippedCount}</div>
              <div style={{ fontSize: '0.68rem', color: '#78828a', marginTop: '2px' }}>Unanswered</div>
            </div>

            <div style={{ padding: '12px', borderRadius: '10px', background: '#fffbeb', border: '1px solid #fde68a' }}>
              <div style={{ fontSize: '0.7rem', color: '#b45309', textTransform: 'uppercase', fontWeight: 700 }}>Misconceptions</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#d97706', marginTop: '2px' }}>{misconceptionsList.length}</div>
              <div style={{ fontSize: '0.68rem', color: '#92400e', marginTop: '2px' }}>Gaps diagnosed</div>
            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button
              className="btn btn-secondary"
              onClick={handleRetake}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ffffff', border: '1px solid #cbd0d1', color: '#26343d', padding: '8px 16px', borderRadius: '6px', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}
            >
              <RotateCcw size={15} /> Retake Assessment
            </button>
          </div>
        </div>

        {/* Misconception Remediation Highlights (If Any) */}
        {misconceptionsList.length > 0 && (
          <div className="card-panel" style={{ padding: '22px', border: '1px solid #fde68a', background: '#fffbeb', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <AlertTriangle size={20} color="#b45309" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#92400e', margin: 0 }}>
                Key Learning Issues Identified ({misconceptionsList.length})
              </h3>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#78350f', marginBottom: '14px' }}>
              Our cognitive engine traced specific step-by-step misconceptions in your work. You can launch targeted remediation interventions for these topics:
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
                      <span style={{ fontSize: '0.76rem', color: '#64748b' }}>Question {finalReport.items.indexOf(item) + 1}</span>
                    </div>
                    <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0f172a' }}>
                      {item.diagnosis.likely_misconception}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '4px', lineHeight: 1.45 }}>
                      {item.diagnosis.explanation}
                    </div>
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', fontSize: '0.78rem', fontWeight: 600, background: '#303a41', color: '#ffffff', border: '1px solid #303a41', borderRadius: '6px', cursor: 'pointer' }}
                    onClick={() => onNavigateToIntervention(
                      item.question.skill_id,
                      item.diagnosis.rule_id || 'PAT_DIST_PARTIAL',
                      item.diagnosis.classification || 'procedural'
                    )}
                  >
                    <span>Fix in Intervention</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Question-by-Question Review */}
        <div className="card-panel" style={{ padding: '28px 32px', background: '#ffffff', border: '1px solid #c8cdce', borderRadius: '14px' }}>
          <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#111d2a', marginBottom: '18px' }}>
            Question Review & Solutions
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {finalReport.items.map((item, idx) => {
              const isCorrect = item.diagnosis.correct;
              return (
                <div
                  key={item.question.id}
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    background: isCorrect ? '#ffffff' : '#ffffff',
                    border: isCorrect ? '1px solid #a7f3d0' : '1px solid #fecaca',
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
                      <span style={{ fontSize: '0.86rem', fontWeight: 700, color: isCorrect ? '#047857' : '#b91c1c' }}>
                        Question {idx + 1} • {isCorrect ? 'Correct Solution' : 'Needs Review'}
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
                        background: isCorrect ? '#ecfdf5' : '#fef2f2',
                        border: isCorrect ? '1px solid #a7f3d0' : '1px solid #fecaca'
                      }}
                    >
                      <span style={{ color: isCorrect ? '#065f46' : '#991b1b', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>
                        Your Answer
                      </span>
                      <strong style={{ color: isCorrect ? '#047857' : '#b91c1c', fontSize: '1.05rem', fontWeight: 700 }}>
                        {item.studentAnswer || '(None)'}
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
                        Expected Answer
                      </span>
                      <strong style={{ color: '#047857', fontSize: '1.05rem', fontWeight: 700 }}>
                        {item.question.correct_answer}
                      </strong>
                    </div>
                  </div>

                  {/* Steps / Explanation */}
                  {item.question.expected_steps && item.question.expected_steps.length > 0 && (
                    <div style={{ marginTop: '10px', padding: '12px 14px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                        Step-by-step Solution
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
                      <strong>Misconception:</strong> {item.diagnosis.likely_misconception} — {item.diagnosis.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: ACTIVE TEST RUNNER (STORE ANSWERS, NO INTERRUPTIONS)
  // -------------------------------------------------------------
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '880px', margin: '0 auto' }}>
      
      {/* Chapter Selector & Question Progress Bar */}
      <div className="card-panel" style={{ padding: '16px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#d7baff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Chapter:
          </span>
          <select
            value={selectedChapterId}
            onChange={(e) => setSelectedChapterId(e.target.value)}
            style={{
              fontWeight: 600,
              fontSize: '0.9rem',
              padding: '8px 14px',
              borderRadius: '8px',
              minWidth: '240px'
            }}
          >
            <option value="">-- Select a chapter to assess --</option>
            {chapters.map(c => (
              <option key={c.id} value={c.id}>
                {c.subject}: {c.title}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="badge badge-purple" style={{ fontSize: '0.78rem' }}>
            {questions.length > 0 ? `${answeredCount} of ${questions.length} Answered` : '0 questions'}
          </span>
          {answeredCount > 0 && (
            <button
              onClick={handleFinishAndSubmit}
              disabled={evaluating}
              className="btn btn-primary"
              style={{ padding: '7px 16px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <span>{evaluating ? 'Evaluating...' : 'Finish & View Report'}</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Question Selector Tabs (1, 2, 3...) */}
      {questions.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {questions.map((q, idx) => {
            const isAnswered = ((responses[q.id]?.answer || '').trim().length > 0);
            const isCurrent = (idx === currentIndex);
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                style={{
                  minWidth: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '0 10px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background: isCurrent
                    ? 'linear-gradient(135deg, #6800cb, #9333ea)'
                    : isAnswered
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(255, 255, 255, 0.05)',
                  color: isCurrent
                    ? '#FFFFFF'
                    : isAnswered
                    ? '#4edea3'
                    : '#9496a8',
                  border: isCurrent
                    ? '1px solid #9333ea'
                    : isAnswered
                    ? '1px solid rgba(78, 222, 163, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <span>{idx + 1}</span>
                {isAnswered && !isCurrent && <Check size={12} strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      )}

      {/* Evaluating Progress Overlay */}
      {evaluating && (
        <div className="card-panel" style={{ padding: '48px 32px', textAlign: 'center', position: 'relative' }}>
          <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/40 text-primary-light inline-flex items-center justify-center mb-4 animate-spin">
            <Sparkles size={28} />
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF' }}>
            Compiling Diagnostic Report...
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#cdc2d7', marginTop: '6px' }}>
            Evaluating question {evalProgress.current} of {evalProgress.total} against cognitive misconception patterns.
          </p>
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ height: '6px', width: '220px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '999px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #6800cb, #9333ea)',
                  width: `${(evalProgress.current / (evalProgress.total || 1)) * 100}%`,
                  transition: 'width 0.2s ease'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Question Card */}
      {!evaluating && currentQ ? (
        <div className="card-panel" style={{ padding: '36px', position: 'relative', overflow: 'hidden' }}>
          {/* Specular Rim Light */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(192, 132, 252, 0.45), transparent)'
            }}
          />

          {/* Question Header */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-purple">Question {currentIndex + 1} of {questions.length}</span>
                {currentQ.difficulty && (
                  <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                    {currentQ.difficulty}
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.8rem', color: '#9496a8' }}>
                Answers are stored automatically as you type
              </span>
            </div>

            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FFFFFF', marginTop: '6px', lineHeight: 1.45 }}>
              {currentQ.question_text}
            </h3>
          </div>

          {/* Stored Response Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Show Work Scratchpad — ONLY brought in when theory part is there, or if learner opened it */}
            {(() => {
              const isTheory = isTheoryQuestion(currentQ);
              const hasSteps = (currentResponse.steps || []).some(s => s.trim().length > 0);
              const showWork = isTheory || manualWorkOpen[currentQ.id] || hasSteps;

              if (!showWork) return null;

              return (
                <div style={{ background: 'rgba(104, 0, 203, 0.05)', border: '1px solid rgba(147, 51, 234, 0.25)', borderRadius: '12px', padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#e5e2e1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>Show your work</span>
                      <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#c084fc', background: 'rgba(192, 132, 252, 0.14)', padding: '2px 8px', borderRadius: '6px' }}>
                        {isTheory ? 'Theory & Reasoning' : 'Intermediate Steps'}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAddStep}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#d7baff',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Plus size={14} /> Add line / step
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(currentResponse.steps.length > 0 ? currentResponse.steps : ['']).map((st, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#71707d', width: '22px' }}>
                          {idx + 1}.
                        </span>
                        <input
                          type="text"
                          value={st}
                          onChange={(e) => handleStepChange(idx, e.target.value)}
                          placeholder={isTheory ? "Write your conceptual explanation, rule, or reasoning..." : "Write a step, formula, or reasoning transition..."}
                          style={{ flex: 1 }}
                        />
                        {currentResponse.steps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStep(idx)}
                            style={{ background: 'none', border: 'none', color: '#ffb4ab', cursor: 'pointer', padding: '6px' }}
                            title="Remove line"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Normal Dialog Box Stating Write The Answer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '4px' }}>
              <label style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Write the answer:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={currentResponse.answer}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="Write the answer here..."
                  style={{
                    width: '100%',
                    maxWidth: '380px',
                    padding: '11px 16px',
                    fontSize: '1rem',
                    fontWeight: 700,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1.5px solid rgba(255, 255, 255, 0.16)',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#9333ea'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.16)'}
                />
                {currentResponse.answer.trim() && (
                  <span style={{ fontSize: '0.8rem', color: '#4edea3', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <Check size={14} /> Saved
                  </span>
                )}
              </div>

              {/* Show Work toggle for non-theory questions when not open */}
              {!isTheoryQuestion(currentQ) && !manualWorkOpen[currentQ.id] && !(currentResponse.steps || []).some(s => s.trim().length > 0) && (
                <div style={{ marginTop: '2px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setManualWorkOpen(prev => ({ ...prev, [currentQ.id]: true }));
                      if (currentResponse.steps.length === 0) {
                        handleAddStep();
                      }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#a78bfa',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 0',
                      fontWeight: 600
                    }}
                  >
                    <Plus size={13} /> Add intermediate steps / show work (optional)
                  </button>
                </div>
              )}
            </div>

            {/* Navigation and Submission Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', flexWrap: 'wrap', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                style={{ opacity: currentIndex === 0 ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowLeft size={15} /> Previous Question
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {currentIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleNext}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>Next Question</span>
                    <ArrowRight size={15} />
                  </button>
                ) : null}

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleFinishAndSubmit}
                  disabled={answeredCount === 0}
                  style={{ opacity: answeredCount === 0 ? 0.5 : 1, padding: '10px 22px', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>Finish & View Report ({answeredCount}/{questions.length})</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>

          </div>

        </div>
      ) : !evaluating && !selectedChapterId ? (
        <div className="card-panel" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(104, 0, 203, 0.25)',
            color: '#d7baff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <BookOpen size={24} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>
            Select a chapter to begin
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#9496a8', marginTop: '4px' }}>
            Choose a chapter from the dropdown above to load diagnostic assessment items.
          </p>
        </div>
      ) : !evaluating ? (
        <div className="card-panel" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>
            No questions available in this chapter
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#9496a8', marginTop: '4px' }}>
            Please select another chapter from the dropdown or upload your notes.
          </p>
        </div>
      ) : null}

    </div>
  );
};

export default DiagnosticRunner;
