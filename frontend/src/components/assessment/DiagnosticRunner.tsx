import React, { useState, useEffect } from 'react';
import { Question, DiagnosisResult, Chapter } from '../../types';
import { apiClient } from '../../api/client';
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  Plus,
  Trash2,
  Sparkles,
  BookOpen,
  AlertTriangle
} from 'lucide-react';

interface DiagnosticRunnerProps {
  studentId: string;
  onAttemptCompleted: () => void;
  onNavigateToIntervention: (skillId: string, patternId: string, classification: string) => void;
  activeChapterId?: string;
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
  
  // Work inputs
  const [finalAnswer, setFinalAnswer] = useState<string>('');
  const [steps, setSteps] = useState<string[]>(['']);
  
  // Evaluation State
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);

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
      setDiagnosisResult(null);
      setFinalAnswer('');
      setSteps(['']);
    } catch (e) {
      console.error('Failed to load questions for chapter', e);
    }
  };

  const currentQ = questions[currentIndex];

  const handleAddStep = () => {
    setSteps([...steps, '']);
  };

  const handleStepChange = (index: number, val: string) => {
    const updated = [...steps];
    updated[index] = val;
    setSteps(updated);
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!currentQ || !finalAnswer.trim()) return;
    setEvaluating(true);
    try {
      const filteredSteps = steps.filter(s => s.trim().length > 0);
      const res = await apiClient.submitAttempt({
        student_id: studentId,
        question_id: currentQ.id,
        answer: finalAnswer.trim(),
        work_shown: filteredSteps,
        input_mode: filteredSteps.length > 0 ? 'steps' : 'answer_only'
      });
      setDiagnosisResult(res);
      onAttemptCompleted();
    } catch (e: any) {
      alert(`Submission error: ${e.message}`);
    } finally {
      setEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    setDiagnosisResult(null);
    setFinalAnswer('');
    setSteps(['']);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '880px', margin: '0 auto' }}>
      
      {/* Chapter Selector & Question Counter Bar */}
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
            {questions.length > 0 ? `Question ${currentIndex + 1} of ${questions.length}` : '0 questions'}
          </span>
        </div>
      </div>

      {currentQ ? (
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-purple">Diagnostic Assessment</span>
              {currentQ.difficulty && (
                <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                  {currentQ.difficulty}
                </span>
              )}
            </div>

            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FFFFFF', marginTop: '6px', lineHeight: 1.45 }}>
              {currentQ.question_text}
            </h3>
          </div>

          {/* Evaluation Result Banner (If Submitted) */}
          {diagnosisResult && (
            <div style={{
              marginBottom: '28px',
              padding: '24px',
              borderRadius: '14px',
              background: diagnosisResult.correct ? 'rgba(20, 41, 33, 0.85)' : 'rgba(45, 18, 21, 0.85)',
              border: `1px solid ${diagnosisResult.correct ? 'rgba(78, 222, 163, 0.4)' : 'rgba(255, 180, 171, 0.35)'}`,
              boxShadow: diagnosisResult.correct ? '0 0 24px rgba(78, 222, 163, 0.2)' : '0 0 24px rgba(255, 180, 171, 0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
                {diagnosisResult.correct ? (
                  <CheckCircle size={28} color="#4edea3" />
                ) : (
                  <XCircle size={28} color="#ffb4ab" />
                )}
                <div>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: diagnosisResult.correct ? '#4edea3' : '#ffb4ab' }}>
                    {diagnosisResult.correct ? "Understood! Correct Solution." : "Step-by-Step Misconception Identified"}
                  </h4>
                  <div style={{ fontSize: '0.85rem', color: '#cdc2d7' }}>
                    Your submitted answer: <strong style={{ color: '#FFFFFF' }}>{diagnosisResult.evaluated_answer}</strong>
                  </div>
                </div>
              </div>

              {!diagnosisResult.correct && diagnosisResult.likely_misconception && (
                <div style={{
                  marginTop: '16px',
                  padding: '18px',
                  background: '#121216',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span className="badge badge-amber">{diagnosisResult.classification || 'Misconception'}</span>
                    <span style={{ fontSize: '0.75rem', color: '#9496a8' }}>Identified Learning Issue</span>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#FFFFFF', marginTop: '4px' }}>
                    {diagnosisResult.likely_misconception}
                  </div>

                  <div style={{ fontSize: '0.88rem', color: '#cdc2d7', marginTop: '6px', lineHeight: 1.5 }}>
                    {diagnosisResult.explanation}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                {!diagnosisResult.correct && (
                  <button
                    className="btn btn-primary purple-glow-btn"
                    onClick={() => onNavigateToIntervention(
                      currentQ.skill_id,
                      diagnosisResult.rule_id || 'PAT_DIST_PARTIAL',
                      diagnosisResult.classification || 'procedural'
                    )}
                  >
                    <span>Start Intervention</span>
                    <ArrowRight size={15} />
                  </button>
                )}

                {currentIndex < questions.length - 1 ? (
                  <button className="btn btn-secondary" onClick={handleNextQuestion}>
                    <span>Next Question</span>
                    <ArrowRight size={15} />
                  </button>
                ) : (
                  <button className="btn btn-secondary" onClick={() => loadQuestions(selectedChapterId)}>
                    <span>Restart Chapter Quiz</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Submission Form (Shown when not evaluating or before submission) */}
          {!diagnosisResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              
              {/* Show Work Scratchpad */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#e5e2e1' }}>
                    Show your work <span style={{ fontWeight: 400, color: '#9496a8' }}>(optional, analyzes intermediate reasoning)</span>
                  </label>
                  <button
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
                  {steps.map((st, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#71707d', width: '22px' }}>
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        value={st}
                        onChange={(e) => handleStepChange(idx, e.target.value)}
                        placeholder="Write a step, formula, calculation, or algebraic transition..."
                        style={{ flex: 1 }}
                      />
                      {steps.length > 1 && (
                        <button
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

              {/* Final Answer Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <label style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>
                  Your final answer:
                </label>
                <input
                  type="text"
                  value={finalAnswer}
                  onChange={(e) => setFinalAnswer(e.target.value)}
                  placeholder="Enter final answer"
                  style={{ width: '200px', fontWeight: 700, fontSize: '1rem' }}
                />
              </div>

              {/* Submit Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
                <button
                  className="btn btn-primary purple-glow-btn"
                  onClick={handleSubmit}
                  disabled={evaluating || !finalAnswer.trim()}
                  style={{ padding: '12px 28px', fontSize: '0.92rem' }}
                >
                  <span>{evaluating ? 'Analyzing...' : 'Submit Response'}</span>
                  <ArrowRight size={16} />
                </button>
              </div>

            </div>
          )}

        </div>
      ) : !selectedChapterId ? (
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
      ) : (
        <div className="card-panel" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>
            No questions available in this chapter
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#9496a8', marginTop: '4px' }}>
            Please select another chapter from the dropdown or upload your notes.
          </p>
        </div>
      )}

    </div>
  );
};

export default DiagnosticRunner;
