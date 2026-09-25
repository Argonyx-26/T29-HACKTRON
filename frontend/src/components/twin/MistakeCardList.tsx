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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={20} color="#F59E0B" />
            Living Mistake Cards & Cognitive Patterns
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
            Deterministic patterns and classified misconceptions tracking the student's reasoning evolution.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge badge-amber">{activeMisconceptions.length} Active Gaps</span>
          <span className="badge badge-emerald">{resolvedMisconceptions.length} Resolved</span>
        </div>
      </div>

      {activeMisconceptions.length === 0 && resolvedMisconceptions.length === 0 ? (
        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>
          <CheckCircle size={32} color="#10B981" style={{ margin: '0 auto 10px auto' }} />
          <div style={{ fontWeight: 600, color: '#F8FAFC' }}>No Active Misconceptions Detected</div>
          <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
            Student is currently demonstrating consistent algebraic reasoning across evaluated skills.
          </div>
        </div>
      ) : null}

      {/* Active Misconception Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '16px' }}>
        {activeMisconceptions.map((m) => (
          <div
            key={m.id}
            className="glass-panel"
            style={{
              padding: '20px',
              borderLeft: '4px solid #F59E0B',
              background: 'linear-gradient(135deg, rgba(20, 30, 51, 0.85) 0%, rgba(15, 23, 42, 0.85) 100%)',
              position: 'relative'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
              <div>
                <span className="badge badge-amber" style={{ marginBottom: '6px' }}>
                  {m.classification} Gap
                </span>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F8FAFC' }}>
                  {m.pattern_name}
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                  Skill: <strong style={{ color: '#E2E8F0' }}>{m.skill_name}</strong> ({m.skill_code})
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: '#F59E0B', background: 'rgba(245, 158, 11, 0.1)', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
                  {m.occurrences}x detected
                </span>
              </div>
            </div>

            {/* What you did */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F87171', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Observed Student Transition:
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', background: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: '6px', color: '#FECACA', fontSize: '0.9rem', marginTop: '4px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                {m.why_it_is_wrong ? `Error: ${m.why_it_is_wrong}` : "Partial transition error"}
              </div>
            </div>

            {/* Correct Principle */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34D399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Mathematical Principle:
              </div>
              <div style={{ fontSize: '0.85rem', color: '#E2E8F0', marginTop: '4px', lineHeight: 1.4 }}>
                {m.correct_principle}
              </div>
            </div>

            {/* Action Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} /> Status: Active
              </span>
              <button
                className="btn btn-primary"
                onClick={() => onStartIntervention(m.skill_code, m.pattern_id, m.classification)}
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                <BookOpen size={14} /> Start Targeted Intervention
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Resolved Misconceptions List */}
      {resolvedMisconceptions.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#34D399', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle size={16} /> Resolved Patterns
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {resolvedMisconceptions.map((r, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <CheckCircle size={14} color="#10B981" />
                <span style={{ color: '#F8FAFC', fontWeight: 600 }}>{r.pattern_name}</span>
                <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>({r.skill_name})</span>
                <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>Resolved</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
