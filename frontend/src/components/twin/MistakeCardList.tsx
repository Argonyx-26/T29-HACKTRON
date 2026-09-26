import React from 'react';
import { ActiveMisconception } from '../../types';
import { AlertTriangle, CheckCircle, ArrowRight, BookOpen, Clock, Activity } from 'lucide-react';

interface MistakeCardListProps {
  activeMisconceptions: ActiveMisconception[];
  resolvedMisconceptions: any[];
  onStartIntervention: (skillId: string, patternId: string, classification: string) => void;
}

export const MistakeCardList: React.FC<MistakeCardListProps> = ({
  activeMisconceptions,
  resolvedMisconceptions,
  onStartIntervention
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={22} color="#D97706" />
            Living Mistake Cards & Cognitive Patterns
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: '2px' }}>
            Deterministic patterns and classified misconceptions tracking the student's reasoning evolution.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
            {activeMisconceptions.length} Active Gaps
          </span>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', background: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0' }}>
            {resolvedMisconceptions.length} Resolved
          </span>
        </div>
      </div>

      {activeMisconceptions.length === 0 && resolvedMisconceptions.length === 0 ? (
        <div style={{ padding: '36px', textAlign: 'center', color: '#475569', background: '#FFFFFF', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
          <CheckCircle size={32} color="#10B981" style={{ margin: '0 auto 10px auto' }} />
          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '1.05rem' }}>No Active Misconceptions Detected</div>
          <div style={{ fontSize: '0.85rem', marginTop: '4px', color: '#64748B' }}>
            Student is currently demonstrating consistent algebraic reasoning across evaluated skills.
          </div>
        </div>
      ) : null}

      {/* Active Misconception Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '16px' }}>
        {activeMisconceptions.map((m) => (
          <div
            key={m.id || m.pattern_id}
            style={{
              padding: '22px',
              borderRadius: '10px',
              border: '1px solid #CBD5E1',
              borderLeft: '5px solid #D97706',
              background: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
              <div>
                <span style={{ display: 'inline-block', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize', padding: '3px 9px', borderRadius: '6px', background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
                  {m.classification} Gap
                </span>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0', lineHeight: 1.3 }}>
                  {m.pattern_name}
                </h4>
                <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                  Skill: <strong style={{ color: '#0F172A', fontWeight: 700 }}>{m.skill_name}</strong> ({m.skill_code})
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: '#92400E', background: '#FEF3C7', border: '1px solid #FDE68A', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                  {m.occurrences}x detected
                </span>
              </div>
            </div>

            {/* What you did */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#B91C1C', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                OBSERVED STUDENT TRANSITION:
              </div>
              <div style={{ fontFamily: 'var(--font-mono, monospace)', background: 'rgba(239, 68, 68, 0.08)', padding: '10px 14px', borderRadius: '6px', color: '#991B1B', fontWeight: 600, fontSize: '0.88rem', border: '1px solid rgba(239, 68, 68, 0.28)', lineHeight: 1.45 }}>
                {m.why_it_is_wrong ? `Error: ${m.why_it_is_wrong}` : "Partial transition error"}
              </div>
            </div>

            {/* Correct Principle */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                MATHEMATICAL PRINCIPLE:
              </div>
              <div style={{ fontSize: '0.9rem', color: '#0F172A', fontWeight: 500, lineHeight: 1.5, background: 'rgba(16, 185, 129, 0.06)', padding: '10px 14px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                {m.correct_principle}
              </div>
            </div>

            {/* Action Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #E2E8F0', marginTop: '4px' }}>
              <span style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={15} color="#475569" /> Status: Active
              </span>
              <button
                className="btn btn-primary"
                onClick={() => onStartIntervention(m.skill_id || m.skill_code, m.pattern_id, m.classification)}
                style={{
                  padding: '8px 18px',
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <BookOpen size={15} /> <span>Start Targeted Intervention</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Resolved Misconceptions List */}
      {resolvedMisconceptions.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#047857', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle size={17} color="#10B981" /> Resolved Patterns
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {resolvedMisconceptions.map((r, i) => (
              <div
                key={i}
                style={{
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <CheckCircle size={14} color="#10B981" />
                <span style={{ color: '#0F172A', fontWeight: 700 }}>{r.pattern_name}</span>
                <span style={{ color: '#475569', fontSize: '0.78rem' }}>({r.skill_name})</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: '#D1FAE5', color: '#065F46', border: '1px solid #6EE7B7' }}>Resolved</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
