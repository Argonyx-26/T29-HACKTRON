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
}

export const InterventionView: React.FC<InterventionViewProps> = ({
  studentId,
  skillId,
  patternId,
  classification = "procedural",
  onRetestCompleted,
  onNavigateToTwin
}) => {
  const [intervention, setIntervention] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Retest State
  const [retestAnswer, setRetestAnswer] = useState<string>('4');
  const [retestSteps, setRetestSteps] = useState<string[]>([
    '4(x + 3) = 28',
    '4x + 12 = 28',
    '4x = 16',
    'x = 4'
  ]);
  const [submittingRetest, setSubmittingRetest] = useState<boolean>(false);
  const [retestResult, setRetestResult] = useState<RetestResult | null>(null);

  useEffect(() => {
    loadIntervention();
  }, [skillId, patternId, classification]);

  const loadIntervention = async () => {
    setLoading(true);
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
    setSubmittingRetest(true);
    try {
      const res = await apiClient.submitRetest({
        student_id: studentId,
        intervention_id: intervention?.id || 'int_worked_dist',
        question_id: 'q_dist_02',
        answer: retestAnswer,
        work_shown: retestSteps
      });
      setRetestResult(res);
      onRetestCompleted();
    } catch (e: any) {
      alert(`Retest failed: ${e.message}`);
    } finally {
      setSubmittingRetest(false);
    }
  };

  if (loading) {
    return (
      <div className="card-panel p-16 text-center text-surface-variant flex flex-col items-center justify-center gap-3 border border-white/10 rounded-2xl">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <span className="text-sm font-medium">Preparing targeted cognitive practice...</span>
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
    <div className="flex flex-col gap-6 max-w-4xl mx-auto py-2">
      
      {/* 1. Header Banner */}
      <div className="card-panel p-6 rounded-2xl border border-white/10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/20 text-primary-light border border-primary/30 uppercase tracking-wider">
                Targeted Practice
              </span>
              <span className="text-xs text-surface-variant">
                Based on your detected learning pattern
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              {content.headline || intervention?.title || "Let's master this concept"}
            </h2>
            <p className="text-xs text-surface-variant mt-1">
              Follow this step-by-step cognitive breakdown, then complete a targeted retest to resolve the gap in your twin.
            </p>
          </div>

          <button
            className="btn btn-secondary flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-all text-white"
            onClick={onNavigateToTwin}
          >
            <ArrowLeft size={14} /> Back to My Twin
          </button>
        </div>
      </div>

      {/* 2. Core Explanation & Worked Steps */}
      <div className="card-panel p-6 rounded-2xl border border-white/10 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-primary-light text-xs font-bold uppercase tracking-wider mb-2">
            <Lightbulb size={16} /> Core Concept Rule
          </div>
          <h3 className="text-lg font-bold text-white">
            What we noticed & Why it matters
          </h3>
          <p className="text-sm text-surface-variant mt-2 leading-relaxed bg-surface-container-low p-4 rounded-xl border border-white/5 font-medium">
            {content.core_rule}
          </p>
          {content.common_pitfall && (
            <div className="mt-3 p-3.5 bg-red-950/30 border border-red-500/30 rounded-xl text-xs text-red-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-red-300 font-semibold">Common pitfall: </strong>
                {content.common_pitfall}
              </div>
            </div>
          )}
        </div>

        {/* Worked Example */}
        <div>
          <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary-light" />
            Step-by-step worked walkthrough:
          </h4>

          <div className="flex flex-col gap-2.5">
            {content.worked_steps && content.worked_steps.map((st: any, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-surface-container-low border border-white/5 flex items-center justify-between gap-4 hover:border-white/15 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-primary/20 border border-primary/30 text-primary-light flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </span>
                  <span className="font-mono font-bold text-white text-sm bg-surface-container-high px-2 py-0.5 rounded border border-white/10">
                    {st.math}
                  </span>
                </div>
                <span className="text-xs text-surface-variant text-right">
                  {st.explanation}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Targeted Retest */}
      <div className="card-panel p-6 rounded-2xl border border-white/10">
        <h3 className="text-lg font-bold text-white mb-1">
          Now you try — Targeted Retest
        </h3>
        <p className="text-xs text-surface-variant mb-5">
          This short prompt tests the exact skill just covered to verify understanding and update your Knowledge Twin.
        </p>

        {!retestResult ? (
          <div className="flex flex-col gap-4">
            <div className="p-4 bg-surface-container-low rounded-xl border border-white/10">
              <div className="font-bold text-white text-base">
                Solve for x: <span className="font-mono text-primary-light font-bold">4(x + 3) = 28</span>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label className="text-sm font-bold text-white">
                Your Answer:
              </label>
              <input
                type="text"
                value={retestAnswer}
                onChange={(e) => setRetestAnswer(e.target.value)}
                className="w-32 px-3 py-2 bg-surface-container-high border border-white/15 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-primary text-center"
                placeholder="Value"
              />
            </div>

            <div className="flex justify-end mt-2">
              <button
                className="purple-glow-btn flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl transition-all"
                onClick={handleRetestSubmit}
                disabled={submittingRetest || !retestAnswer.trim()}
              >
                {submittingRetest ? 'Checking...' : 'Submit Retest'} <ArrowRight size={15} />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle2 size={24} className="text-emerald-400" />
              <div className="font-black text-lg text-emerald-300">
                Retest Passed! Misconception Resolved.
              </div>
            </div>

            {/* Before vs Now */}
            <div className="flex items-center gap-6 my-4 p-4 bg-surface-container-lowest/60 rounded-xl border border-emerald-500/20 flex-wrap">
              <div>
                <div className="text-[10px] text-surface-variant uppercase tracking-wider font-bold">Before</div>
                <div className="text-2xl font-black text-surface-variant">
                  {Math.round(retestResult.before_mastery * 100)}%
                </div>
              </div>

              <div className="text-lg text-emerald-400 font-bold">→</div>

              <div>
                <div className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold">Now</div>
                <div className="text-2xl font-black text-emerald-400">
                  {Math.round(retestResult.after_mastery * 100)}%
                </div>
              </div>

              <div className="ml-auto">
                <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  +{Math.round(retestResult.delta_percentage ?? retestResult.improvement_delta ?? 23)} points
                </span>
              </div>
            </div>

            <div className="text-xs text-emerald-300/90 font-medium">
              Your Knowledge Twin has been updated with your new demonstrated understanding.
            </div>

            <div className="flex justify-end mt-4">
              <button
                className="purple-glow-btn flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl"
                onClick={onNavigateToTwin}
              >
                Continue Learning <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

