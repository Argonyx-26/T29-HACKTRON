import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  Brain,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Info,
  Calendar,
  Layers
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { RevisionOverview, MemorySkill, RevisionPracticeQuestion } from '../../types';

interface RevisionEngineViewProps {
  studentId: string;
  onNavigateToTwin: () => void;
  onNavigateToAssess: () => void;
  onNavigateToHome?: () => void;
}

export const RevisionEngineView: React.FC<RevisionEngineViewProps> = ({
  studentId,
  onNavigateToTwin,
  onNavigateToAssess,
  onNavigateToHome
}) => {
  const [data, setData] = useState<RevisionOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state for memory matrix
  const [activeFilter, setActiveFilter] = useState<'all' | 'strong' | 'stable' | 'fading' | 'at_risk'>('all');

  // Interactive 3-Minute Practice Session State
  const [isPracticing, setIsPracticing] = useState<boolean>(false);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timerSeconds, setTimerSeconds] = useState<number>(180); // 3 minutes
  const [submittingPractice, setSubmittingPractice] = useState<boolean>(false);
  const [practiceResult, setPracticeResult] = useState<any | null>(null);

  useEffect(() => {
    loadRevisionData();
  }, [studentId]);

  // Timer for active retrieval practice
  useEffect(() => {
    let interval: any = null;
    if (isPracticing && !practiceResult && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPracticing, practiceResult, timerSeconds]);

  const loadRevisionData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getRevisionOverview(studentId);
      setData(res);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load continuous revision data');
    } finally {
      setLoading(false);
    }
  };

  const startThreeMinutePractice = () => {
    setIsPracticing(true);
    setCurrentQIndex(0);
    setAnswers({});
    setTimerSeconds(180);
    setPracticeResult(null);
  };

  const handleAnswerChange = (qId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const handleSubmitPractice = async () => {
    if (!data || !data.practice_questions.length) return;
    setSubmittingPractice(true);
    try {
      const payloadAnswers = data.practice_questions.map((q) => ({
        question_id: q.question_id,
        answer: answers[q.question_id] || ''
      }));

      const res = await apiClient.submitRetrievalPractice({
        student_id: studentId,
        answers: payloadAnswers
      });
      setPracticeResult(res);
      // Refresh memory data in background
      const updatedOverview = await apiClient.getRevisionOverview(studentId);
      setData(updatedOverview);
    } catch (err: any) {
      alert(`Error submitting retrieval practice: ${err.message}`);
    } finally {
      setSubmittingPractice(false);
    }
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 24px', textAlign: 'center', background: '#FFFFFF', minHeight: '80vh' }}>
        <RefreshCw className="animate-spin" size={32} color="#6800cb" style={{ margin: '0 auto 16px auto' }} />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0F172A' }}>
          Calibrating continuous memory retention model...
        </h3>
        <p style={{ color: '#475569', fontSize: '0.9rem' }}>
          Modeling Ebbinghaus forgetting curves and retrievability probabilities.
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center', background: '#FFFFFF' }}>
        <AlertTriangle size={36} color="#DC2626" style={{ margin: '0 auto 12px auto' }} />
        <h3 style={{ color: '#991B1B', fontWeight: 800 }}>Unable to Load Revision Engine</h3>
        <p style={{ color: '#475569' }}>{error || 'Could not retrieve memory state'}</p>
        <button
          onClick={loadRevisionData}
          style={{ padding: '8px 18px', background: '#1E293B', color: '#FFF', borderRadius: '6px', border: 'none', cursor: 'pointer', marginTop: '12px' }}
        >
          Try Again
        </button>
      </div>
    );
  }

  const filteredSkills = data.all_skills.filter((sk) => {
    if (activeFilter === 'all') return true;
    return sk.status === activeFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'strong':
        return { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46', badgeBg: '#D1FAE5', bar: '#10B981' };
      case 'stable':
        return { bg: '#F0F9FF', border: '#BAE6FD', text: '#0369A1', badgeBg: '#E0F2FE', bar: '#0284C7' };
      case 'fading':
        return { bg: '#FFFBEB', border: '#FDE68A', text: '#B45309', badgeBg: '#FEF3C7', bar: '#F59E0B' };
      case 'at_risk':
      default:
        return { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', badgeBg: '#FEE2E2', bar: '#EF4444' };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'strong':
        return 'Strong';
      case 'stable':
        return 'Stable';
      case 'fading':
        return 'Fading';
      case 'at_risk':
      default:
        return 'At Risk';
    }
  };

  return (
    <div className="revision-engine-container">
      {onNavigateToHome && (
        <button type="button" className="page-back-button" onClick={onNavigateToHome}>
          <ArrowLeft size={15} /> Back to Dashboard
        </button>
      )}
      {/* 1. Header & Philosophy */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div className="revision-header-eyebrow">
              <RotateCcw size={12} /> Continuous Knowledge Twin
            </div>
            <h1 className="revision-header-title">
              Revision Engine
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={onNavigateToTwin}
              className="learning-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                minHeight: '38px',
                padding: '0 14px',
                cursor: 'pointer'
              }}
            >
              <Layers size={14} /> <span>View My Twin</span>
            </button>
            <button
              onClick={startThreeMinutePractice}
              className="learning-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                minHeight: '38px',
                padding: '0 16px',
                cursor: 'pointer'
              }}
            >
              <Zap size={14} /> <span>Start 3-Min Retrieval Practice</span>
            </button>
          </div>
        </div>

        {/* Resilience Metrics Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '16px' }}>
          <div className="revision-metric-card">
            <div className="revision-metric-label">
              Memory Resilience Index
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span className="revision-metric-value">
                {data.retention_resilience_index}%
              </span>
              <span className="revision-metric-tag" style={{ color: data.retention_resilience_index >= 70 ? '#059669' : '#D97706' }}>
                {data.retention_resilience_index >= 70 ? 'Resilient' : 'Action Recommended'}
              </span>
            </div>
            <div className="revision-metric-desc">
              Average recall probability across tracked skills
            </div>
          </div>

          <div className="revision-metric-card">
            <div className="revision-metric-label">
              Due For Review Today
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span className="revision-metric-value" style={{ color: data.needs_practice_today_count > 0 ? '#DC2626' : '#059669' }}>
                {data.needs_practice_today_count}
              </span>
              <span className="revision-metric-tag" style={{ color: data.needs_practice_today_count > 0 ? '#DC2626' : '#059669' }}>
                {data.needs_practice_today_count > 0 ? 'Fading / At Risk' : 'All Clear'}
              </span>
            </div>
            <div className="revision-metric-desc">
              Optimal window for cognitive consolidation
            </div>
          </div>

          <div className="revision-metric-card">
            <div className="revision-metric-label">
              Continuously Tracked Skills
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span className="revision-metric-value">
                {data.total_skills_tracked}
              </span>
              <span className="revision-metric-tag" style={{ color: '#25343d' }}>
                Active Twin Model
              </span>
            </div>
            <div className="revision-metric-desc">
              Decay rate adjusted per Bayesian mastery history
            </div>
          </div>

          <div className="revision-metric-card">
            <div className="revision-metric-label">
              Today's Micro Session
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span className="revision-metric-value" style={{ color: '#25343d' }}>
                3 min
              </span>
              <span className="revision-metric-tag" style={{ color: '#059669' }}>
                3 micro-prompts
              </span>
            </div>
            <div className="revision-metric-desc">
              Resets forgetting curve before memory relapse
            </div>
          </div>
        </div>
      </div>

      {/* 2. Scheduled 3-Minute Practice Hero Banner OR Active Practice Runner */}
      {!isPracticing ? (
        <section className="revision-hero-banner">
          <div style={{ maxWidth: '680px' }}>
            <div className="revision-hero-badge">
              <Clock size={12} /> Automatically Scheduled
            </div>
            <h2>
              {data.practice_questions.length > 0
                ? '3-Minute Retrieval Practice Recommended Today'
                : 'Continuous Memory Engine Active'}
            </h2>
            <p>
              {data.scheduled_session.rationale}
            </p>
            <div className="revision-hero-meta">
              <span className="revision-hero-meta-pill">⏱️ Estimated: {data.practice_questions.length > 0 ? '3 minutes' : 'On demand'}</span>
              {data.practice_questions.length > 0 && (
                <span className="revision-hero-meta-pill">🎯 Focus: {data.practice_questions.map(q => q.skill_code).join(', ')}</span>
              )}
              <span className="revision-hero-meta-pill">📈 Target: +25% retention rebound</span>
            </div>
          </div>

          <div>
            {data.practice_questions.length > 0 ? (
              <button
                onClick={startThreeMinutePractice}
                className="revision-hero-btn"
              >
                <Zap size={16} />
                <span>Start 3-Minute Practice</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={data.total_skills_tracked > 0 ? onNavigateToTwin : onNavigateToAssess}
                className="revision-hero-btn"
              >
                <span>{data.total_skills_tracked > 0 ? 'View Knowledge Twin' : 'Take Diagnostic'}</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </section>
      ) : (
        /* ACTIVE IN-VIEW PRACTICE RUNNER */
        <div className="revision-runner-card">
          {!practiceResult ? (
            <div>
              {/* Practice Header with Timer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5B21B6', fontWeight: 800 }}>
                    <Zap size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                      3-Minute Spaced Retrieval Session
                    </h3>
                    <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                      Question {currentQIndex + 1} of {data.practice_questions.length} · Strengthening neural retention
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: timerSeconds < 45 ? '#FEF2F2' : '#F1F5F9',
                    color: timerSeconds < 45 ? '#DC2626' : '#1E293B',
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    fontSize: '1.1rem',
                    border: timerSeconds < 45 ? '1px solid #FECACA' : '1px solid #CBD5E1'
                  }}>
                    <Clock size={16} /> {formatTimer(timerSeconds)}
                  </div>
                  <button
                    onClick={() => setIsPracticing(false)}
                    style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #CBD5E1', borderRadius: '6px', color: '#64748B', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* Active Question Prompt */}
              {data.practice_questions[currentQIndex] && (
                <div style={{ padding: '20px 24px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, background: '#EDE9FE', color: '#5B21B6', padding: '3px 8px', borderRadius: '6px' }}>
                      {data.practice_questions[currentQIndex].skill_code}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                      {data.practice_questions[currentQIndex].skill_name}
                    </span>
                  </div>

                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginBottom: '20px' }}>
                    {data.practice_questions[currentQIndex].question_text}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <label style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.95rem' }}>
                      Your Answer:
                    </label>
                    <input
                      type="text"
                      value={answers[data.practice_questions[currentQIndex].question_id] || ''}
                      onChange={(e) => handleAnswerChange(data.practice_questions[currentQIndex].question_id, e.target.value)}
                      placeholder="Enter value"
                      autoFocus
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '2px solid #CBD5E1',
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: '#0F172A',
                        width: '160px',
                        outline: 'none',
                        fontFamily: 'monospace'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#6800cb'}
                      onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (currentQIndex < data.practice_questions.length - 1) {
                            setCurrentQIndex(currentQIndex + 1);
                          } else {
                            handleSubmitPractice();
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Stepper Navigation & Submit */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {data.practice_questions.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentQIndex(idx)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        border: 'none',
                        background: currentQIndex === idx ? '#1E293B' : answers[data.practice_questions[idx].question_id] ? '#D1FAE5' : '#E2E8F0',
                        color: currentQIndex === idx ? '#FFFFFF' : answers[data.practice_questions[idx].question_id] ? '#065F46' : '#475569',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  {currentQIndex < data.practice_questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentQIndex(currentQIndex + 1)}
                      style={{ padding: '10px 20px', borderRadius: '8px', background: '#1E293B', color: '#FFF', fontWeight: 700, fontSize: '0.9rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      Next Prompt <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitPractice}
                      disabled={submittingPractice}
                      style={{ padding: '10px 24px', borderRadius: '8px', background: '#059669', color: '#FFF', fontWeight: 800, fontSize: '0.95rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      {submittingPractice ? 'Consolidating Memory...' : 'Complete 3-Min Retrieval'} <CheckCircle2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* CONSOLIDATION RESULT SUMMARY */
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <CheckCircle2 size={28} color="#059669" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#065F46' }}>
                    Retrieval Practice Complete — Memory Reinforced!
                  </h3>
                  <div style={{ fontSize: '0.88rem', color: '#047857' }}>
                    {practiceResult.message}
                  </div>
                </div>
              </div>

              {/* Question results breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '20px 0' }}>
                {practiceResult.results.map((res: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      padding: '14px 18px',
                      borderRadius: '10px',
                      background: res.is_correct ? '#ECFDF5' : '#FEF2F2',
                      border: res.is_correct ? '1px solid #A7F3D0' : '1px solid #FECACA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.8rem', background: '#FFFFFF', padding: '3px 8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                        {res.skill_code}
                      </span>
                      <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>
                        {res.skill_name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.86rem' }}>
                      <span>Your Answer: <strong style={{ color: res.is_correct ? '#065F46' : '#991B1B' }}>{res.user_answer || '(Blank)'}</strong></span>
                      {!res.is_correct && (
                        <span>Correct: <strong style={{ color: '#059669' }}>{res.correct_answer}</strong></span>
                      )}
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        background: res.is_correct ? '#D1FAE5' : '#FEE2E2',
                        color: res.is_correct ? '#065F46' : '#991B1B'
                      }}>
                        {res.is_correct ? 'Boosted to Strong' : 'Retained for Next Cycle'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button
                  onClick={() => setIsPracticing(false)}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    background: '#1E293B',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Return to Memory Matrix
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Memory Status Pipeline (Strong -> Stable -> Fading -> At Risk) */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div className="revision-matrix-heading">
            <h2>
              Memory Status Matrix
            </h2>
            <p>
              Real-time decay tracking: Strong (≥85%) → Stable (70–84%) → Fading (50–69%) → At Risk (&lt;50%)
            </p>
          </div>

          {/* Filter Pills */}
          <div className="revision-filters-wrap">
            <button
              onClick={() => setActiveFilter('all')}
              className={`revision-filter-pill${activeFilter === 'all' ? ' is-active' : ''}`}
            >
              <span>All ({data.all_skills.length})</span>
            </button>
            <button
              onClick={() => setActiveFilter('strong')}
              className={`revision-filter-pill${activeFilter === 'strong' ? ' is-active' : ''}`}
            >
              <span>Strong ({data.status_counts.strong})</span>
            </button>
            <button
              onClick={() => setActiveFilter('stable')}
              className={`revision-filter-pill${activeFilter === 'stable' ? ' is-active' : ''}`}
            >
              <span>Stable ({data.status_counts.stable})</span>
            </button>
            <button
              onClick={() => setActiveFilter('fading')}
              className={`revision-filter-pill${activeFilter === 'fading' ? ' is-active' : ''}`}
            >
              <span>Fading ({data.status_counts.fading})</span>
            </button>
            <button
              onClick={() => setActiveFilter('at_risk')}
              className={`revision-filter-pill${activeFilter === 'at_risk' ? ' is-active' : ''}`}
            >
              <span>At Risk ({data.status_counts.at_risk})</span>
            </button>
          </div>
        </div>

        {/* 4 Pillars Overview Cards */}
        {filteredSkills.length === 0 ? (
          <div className="revision-metric-card" style={{ padding: '36px 24px', textAlign: 'center', gridColumn: '1 / -1' }}>
            <Brain size={32} style={{ margin: '0 auto 12px', color: '#59656c' }} />
            <h4 style={{ margin: '0 0 6px', fontWeight: 700, color: '#17232c', fontSize: '1rem' }}>
              {data.all_skills.length === 0
                ? 'No Skills Assessed Yet'
                : `No Skills in ${activeFilter.replace('_', ' ').toUpperCase()}`}
            </h4>
            <p style={{ margin: '0 auto 16px', maxWidth: '440px', fontSize: '0.85rem', color: '#59656c', lineHeight: 1.5 }}>
              {data.all_skills.length === 0
                ? 'Complete learning diagnostics or practice problems to begin continuous forgetting curve tracking in real time.'
                : 'All tracked skills are categorized into other memory tiers.'}
            </p>
            {data.all_skills.length === 0 && (
              <button
                onClick={onNavigateToAssess}
                className="revision-hero-btn"
                style={{ margin: '0 auto' }}
              >
                <span>Take Diagnostic</span>
                <ArrowRight size={15} />
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {filteredSkills.map((sk) => {
              const colors = getStatusColor(sk.status);
              return (
                <div
                  key={sk.skill_id}
                  className="revision-skill-card"
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span className="revision-skill-badge">
                        {sk.skill_code}
                      </span>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: colors.badgeBg,
                        color: colors.text,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}>
                        {getStatusLabel(sk.status)}
                      </span>
                    </div>

                    <h3 className="revision-skill-title">
                      {sk.skill_name}
                    </h3>
                    <div className="revision-skill-chapter">
                      {sk.chapter_title}
                    </div>

                    {/* Retrievability Progress Bar */}
                    <div style={{ margin: '12px 0 10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                        <span>Retrievability Probability</span>
                        <span style={{ color: colors.text, fontWeight: 700 }}>{sk.retrievability}%</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${sk.retrievability}%`,
                            height: '100%',
                            background: colors.bar,
                            borderRadius: '3px',
                            transition: 'width 0.4s ease'
                          }}
                        />
                      </div>
                    </div>

                    {/* Decay Details */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '8px 10px', background: 'rgba(23,35,44,.035)', borderRadius: '4px', border: '1px solid #d1d5d5', fontSize: '0.74rem' }}>
                      <div>
                        <span style={{ color: '#59656c', display: 'block' }}>Last Practiced</span>
                        <strong style={{ color: '#17232c' }}>{sk.days_since_review} days ago</strong>
                      </div>
                      <div>
                        <span style={{ color: '#59656c', display: 'block' }}>Half-Life Stability</span>
                        <strong style={{ color: '#17232c' }}>{sk.stability_days} days</strong>
                      </div>
                    </div>
                  </div>

                  {/* Footer with Next Review Schedule & Action Button */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: 600, color: sk.review_urgency === 'high' ? '#DC2626' : '#59656c' }}>
                      <Calendar size={13} />
                      <span>Next: {sk.next_review}</span>
                    </div>

                    {sk.review_urgency === 'high' ? (
                      <button
                        type="button"
                        onClick={startThreeMinutePractice}
                        className="revision-card-btn-urgent"
                        title="3-minute retrieval practice recommended today"
                      >
                        <span>Practice</span>
                        <ArrowRight size={13} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startThreeMinutePractice}
                        className="revision-card-btn-review"
                        title="Review this skill in retrieval practice"
                      >
                        <span>Review</span>
                        <ArrowRight size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Forgetting Curve Educational Explainer Card */}
      <div className="revision-metric-card" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginTop: '24px' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '5px', background: 'rgba(23,35,44,.06)', border: '1px solid #ccd1d2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#25343d', flexShrink: 0 }}>
          <Brain size={20} />
        </div>
        <div style={{ flex: 1, minWidth: '260px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#17232c', margin: '0 0 5px 0' }}>
            Why the Knowledge Twin Models Forgetting Curves
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#59656c', lineHeight: 1.55, margin: 0 }}>
            In traditional systems, answering questions once marks a skill as "Mastered." But cognitive science shows that within 7 days, up to 70% of unreviewed material is forgotten. 
            By continually updating your Memory Status from <strong>Strong</strong> to <strong>Stable</strong>, <strong>Fading</strong>, and <strong>At Risk</strong>, your Knowledge Twin catches gaps at the optimal retrieval moment—solidifying long-term mastery with just 3 minutes of daily retrieval practice.
          </p>
        </div>
      </div>

    </div>
  );
};

export default RevisionEngineView;
