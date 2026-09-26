import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { RetestResult } from '../../types';
import {
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Award,
  BookOpen,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Lightbulb,
  ArrowLeft
} from 'lucide-react';

interface InterventionViewProps {
  studentId: string;
  skillId: string;
  patternId?: string;
  classification?: string;
  onRetestCompleted: () => void;
  onNavigateToTwin: () => void;
  onNavigateToHome?: () => void;
}

export const InterventionView: React.FC<InterventionViewProps> = ({
  studentId,
  skillId,
  patternId,
  classification = "procedural",
  onRetestCompleted,
  onNavigateToTwin,
  onNavigateToHome
}) => {
  const [intervention, setIntervention] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Retest State - empty initially so user must solve it themselves
  const [retestAnswer, setRetestAnswer] = useState<string>('');
  const [retestSteps, setRetestSteps] = useState<string[]>([]);
  const [submittingRetest, setSubmittingRetest] = useState<boolean>(false);
  const [retestResult, setRetestResult] = useState<RetestResult | null>(null);

  useEffect(() => {
    loadIntervention();
  }, [skillId, patternId, classification]);

  const loadIntervention = async () => {
    setLoading(true);
    setRetestAnswer('');
    setRetestSteps([]);
    try {
      const data = await apiClient.routeIntervention({
        student_id: studentId,
        skill_id: skillId || 'sk_dist_04',
        pattern_id: patternId,
        classification: classification
      });
      setIntervention(data);
      setRetestResult(null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRetestSubmit = async () => {
    if (!retestAnswer.trim()) return;
    setSubmittingRetest(true);
    try {
      const steps = retestSteps.length > 0 ? retestSteps : [
        '4(x + 3) = 28',
        '4x + 12 = 28',
        '4x = 16',
        `x = ${retestAnswer.trim()}`
      ];
      const res = await apiClient.submitRetest({
        student_id: studentId,
        intervention_id: intervention?.id || 'int_worked_dist',
        question_id: 'q_dist_02',
        answer: retestAnswer.trim(),
        work_shown: steps
      });
      setRetestResult(res);
      if (res.correct) {
        onRetestCompleted();
      }
    } catch (e: any) {
      alert(`Retest failed: ${e.message}`);
    } finally {
      setSubmittingRetest(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <RefreshCw className="w-8 h-8 text-primary animate-spin" color="#6800cb" />
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Preparing targeted cognitive practice...</span>
      </div>
    );
  }

  const content = intervention?.content || {
    headline: "Distributive Property: Multiply Every Term",
    core_rule: "When expanding a(b + c), the multiplier outside applies to EVERY term inside: ab + ac.",
    worked_steps: [
      { step: 1, math: "3(x + 2) = 15", explanation: "Notice the 3 outside the parentheses. It controls both x AND +2." },
      { step: 2, math: "3·x + 3·2 = 15", explanation: "Distribute 3 to x AND 3 to 2." },
      { step: 3, math: "3x + 6 = 15", explanation: "Calculate 3*2 = 6." },
      { step: 4, math: "3x = 9", explanation: "Subtract 6 from both sides." },
      { step: 5, math: "x = 3", explanation: "Divide by 3 to isolate x." }
    ],
    common_pitfall: "Writing 3(x + 2) as 3x + 2 skips the constant term.",
    interactive_tip: "Think of a package multiplier: every item inside gets multiplied."
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '896px', margin: '0 auto', padding: '8px 0' }}>
      {onNavigateToHome && (
        <button type="button" className="page-back-button" onClick={onNavigateToHome}>
          <ArrowLeft size={15} /> Back to Dashboard
        </button>
      )}
      {/* 1. Header Banner */}
      <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '3px 10px', borderRadius: '6px', background: '#EDE9FE', color: '#5B21B6', border: '1px solid #DDD6FE', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Targeted Practice
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>
                Based on your detected learning pattern
              </span>
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.25 }}>
              {content.headline || intervention?.title || "Let's master this concept"}
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: '6px', marginBottom: 0 }}>
              Follow this step-by-step cognitive breakdown, then complete a targeted retest to resolve the gap in your twin.
            </p>
          </div>

          <button
            onClick={onNavigateToTwin}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.84rem' }}
          >
            <ArrowLeft size={15} /> Back to My Twin
          </button>
        </div>
      </div>

      {/* 2. Core Explanation & Worked Steps */}
      <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '22px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B21A8', marginBottom: '8px' }}>
            <Lightbulb size={16} /> Core Concept Rule
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            What we noticed & Why it matters
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#1E293B', marginTop: '10px', lineHeight: 1.5, background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0', fontWeight: 500 }}>
            {content.core_rule}
          </p>
          {content.common_pitfall && (
            <div style={{ marginTop: '12px', padding: '14px 16px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '10px', fontSize: '0.85rem', color: '#991B1B', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <AlertTriangle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#7F1D1D', fontWeight: 700 }}>Common pitfall: </strong>
                <span style={{ color: '#991B1B' }}>{content.common_pitfall}</span>
              </div>
            </div>
          )}
        </div>

        {/* Worked Example */}
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="#6B21A8" />
            Step-by-step worked walkthrough:
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {content.worked_steps && content.worked_steps.map((st: any, idx: number) => (
              <div
                key={idx}
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#EDE9FE', border: '1px solid #DDD6FE', color: '#5B21B6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.78rem' }}>
                    {idx + 1}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, color: '#0F172A', fontSize: '0.95rem', background: '#FFFFFF', padding: '4px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                    {st.math}
                  </span>
                </div>
                <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 500, textAlign: 'right' }}>
                  {st.explanation}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Targeted Retest */}
      <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>
          Now you try — Targeted Retest
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '20px', marginTop: 0 }}>
          This short prompt tests the exact skill just covered to verify understanding and update your Knowledge Twin.
        </p>

        {!retestResult ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ padding: '16px 20px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '1.1rem' }}>
                Solve for x: <span style={{ fontFamily: 'var(--font-mono, monospace)', color: '#6B21A8', fontWeight: 800, marginLeft: '8px' }}>4(x + 3) = 28</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
                Your Answer:
              </label>
              <input
                type="text"
                value={retestAnswer}
                onChange={(e) => setRetestAnswer(e.target.value)}
                style={{
                  width: '140px',
                  padding: '10px 14px',
                  background: '#FFFFFF',
                  border: '2px solid #CBD5E1',
                  borderRadius: '10px',
                  color: '#0F172A',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 800,
                  fontSize: '1rem',
                  textAlign: 'center',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#6800cb'}
                onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                placeholder="Value"
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                onClick={handleRetestSubmit}
                disabled={submittingRetest || !retestAnswer.trim()}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 24px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  opacity: !retestAnswer.trim() ? 0.5 : 1,
                  cursor: !retestAnswer.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {submittingRetest ? 'Checking...' : 'Submit Retest'} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : retestResult.correct ? (
          /* CORRECT / PASSED RESULT */
          <div style={{ padding: '24px', background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <CheckCircle2 size={24} color="#059669" />
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#065F46' }}>
                Retest Passed! Misconception Resolved.
              </div>
            </div>

            {/* Before vs Now */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', margin: '16px 0', padding: '16px', background: '#FFFFFF', borderRadius: '10px', border: '1px solid #A7F3D0', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>Before</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#64748B' }}>
                  {Math.round(retestResult.before_mastery * 100)}%
                </div>
              </div>

              <div style={{ fontSize: '1.25rem', color: '#059669', fontWeight: 800 }}>→</div>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>Now</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#047857' }}>
                  {Math.round(retestResult.after_mastery * 100)}%
                </div>
              </div>

              <div style={{ marginLeft: 'auto' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, padding: '6px 12px', borderRadius: '20px', background: '#D1FAE5', color: '#065F46', border: '1px solid #6EE7B7' }}>
                  +{Math.abs(Math.round(retestResult.delta_percentage ?? 23))} points
                </span>
              </div>
            </div>

            <div style={{ fontSize: '0.88rem', color: '#065F46', fontWeight: 600 }}>
              {retestResult.message || 'Your Knowledge Twin has been updated with your new demonstrated understanding.'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                onClick={onNavigateToTwin}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 22px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  background: '#047857',
                  borderColor: '#047857'
                }}
              >
                Continue to My Twin <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          /* INCORRECT / FAILED RESULT */
          <div style={{ padding: '24px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <AlertTriangle size={24} color="#DC2626" />
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#991B1B' }}>
                Incorrect Answer — Gap Remains Active
              </div>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#7F1D1D', margin: '4px 0 14px 0', lineHeight: 1.5 }}>
              Your answer of <code style={{ fontFamily: 'monospace', fontWeight: 800, background: '#FEE2E2', padding: '2px 8px', borderRadius: '4px', color: '#991B1B' }}>{retestAnswer}</code> was incorrect. Review the step-by-step walkthrough above and try again.
            </p>

            {/* Before vs Now */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', margin: '16px 0', padding: '16px', background: '#FFFFFF', borderRadius: '10px', border: '1px solid #FECACA', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>Before</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#64748B' }}>
                  {Math.round(retestResult.before_mastery * 100)}%
                </div>
              </div>

              <div style={{ fontSize: '1.25rem', color: '#DC2626', fontWeight: 800 }}>→</div>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>Now</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#991B1B' }}>
                  {Math.round(retestResult.after_mastery * 100)}%
                </div>
              </div>

              <div style={{ marginLeft: 'auto' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, padding: '6px 12px', borderRadius: '20px', background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5' }}>
                  {Math.round(retestResult.delta_percentage)}% delta
                </span>
              </div>
            </div>

            <div style={{ fontSize: '0.88rem', color: '#7F1D1D', fontWeight: 500 }}>
              {retestResult.message || 'The misconception has not been resolved. You can retry the question to update your Knowledge Twin.'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '18px' }}>
              <button
                onClick={() => {
                  setRetestResult(null);
                  setRetestAnswer('');
                }}
                className="btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 22px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  background: '#DC2626',
                  border: '1px solid #DC2626',
                  cursor: 'pointer'
                }}
              >
                Try Retest Again
              </button>
              <button
                onClick={onNavigateToTwin}
                className="btn btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  fontSize: '0.88rem'
                }}
              >
                Back to My Twin
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

