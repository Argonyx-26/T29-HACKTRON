import React, { useState, useMemo } from 'react';
import { SkillMasteryInfo } from '../../types';
import { AlertCircle, CheckCircle2, Info, ArrowRight, Layers, Sparkles } from 'lucide-react';

interface PrerequisiteDAGProps {
  skills: SkillMasteryInfo[];
  onSelectSkill?: (skillId: string) => void;
  onPracticeSkill?: (skillId: string, skillCode: string) => void;
}

export const PrerequisiteDAG: React.FC<PrerequisiteDAGProps> = ({ skills, onSelectSkill, onPracticeSkill }) => {
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  // Fallback default skills if none supplied
  const defaultSkills: SkillMasteryInfo[] = useMemo(() => [
    { skill_id: 'eq1', skill_code: 'EQ-01', skill_name: 'Understanding Equality', order: 1, mastery_probability: 0.85, confidence: 0.9, confidence_label: 'high', evidence_count: 5, trend: 'steady', prerequisites: [], prerequisite_gap: false },
    { skill_id: 'simp2', skill_code: 'SIMP-02', skill_name: 'Simplifying Expressions', order: 2, mastery_probability: 0.72, confidence: 0.8, confidence_label: 'high', evidence_count: 4, trend: 'improving', prerequisites: ['EQ-01'], prerequisite_gap: false },
    { skill_id: 'like3', skill_code: 'LIKE-03', skill_name: 'Combining Like Terms', order: 3, mastery_probability: 0.65, confidence: 0.75, confidence_label: 'medium', evidence_count: 3, trend: 'steady', prerequisites: ['EQ-01'], prerequisite_gap: false },
    { skill_id: 'dist4', skill_code: 'DIST-04', skill_name: 'Distributive Property', order: 4, mastery_probability: 0.42, confidence: 0.7, confidence_label: 'medium', evidence_count: 4, trend: 'declining', prerequisites: ['SIMP-02'], prerequisite_gap: true },
    { skill_id: 'isol5', skill_code: 'ISOL-05', skill_name: 'Isolating Variables', order: 5, mastery_probability: 0.58, confidence: 0.6, confidence_label: 'medium', evidence_count: 2, trend: 'steady', prerequisites: ['LIKE-03'], prerequisite_gap: false },
    { skill_id: 'multi6', skill_code: 'MULTI-06', skill_name: 'Multi-Step Equations', order: 6, mastery_probability: 0.35, confidence: 0.5, confidence_label: 'low', evidence_count: 1, trend: 'declining', prerequisites: ['DIST-04', 'ISOL-05'], prerequisite_gap: true },
  ], []);

  const effectiveSkills = skills && skills.length > 0 ? skills : defaultSkills;

  // Build a lookup map by skill_code and skill_id
  const skillByCode = useMemo(() => {
    const map = new Map<string, SkillMasteryInfo>();
    effectiveSkills.forEach(s => {
      map.set(s.skill_code, s);
      map.set(s.skill_id, s);
    });
    return map;
  }, [effectiveSkills]);

  // Compute layout positions dynamically (3 layers if 6 skills, or N-layer grid)
  const { nodePositions, edges, svgWidth, svgHeight } = useMemo(() => {
    const positions: Record<string, { x: number; y: number; label: string; code: string; skill: SkillMasteryInfo }> = {};
    const computedEdges: Array<{ from: string; to: string }> = [];

    const count = effectiveSkills.length;
    // Determine columns (layers) and rows
    const cols = Math.min(3, Math.max(2, Math.ceil(count / 2)));
    const rowsPerCol = Math.ceil(count / cols);

    const colWidth = 260;
    const rowHeight = 110;
    const startX = 20;
    const startY = 30;

    effectiveSkills.forEach((s, idx) => {
      const col = Math.floor(idx / rowsPerCol);
      const row = idx % rowsPerCol;
      const x = startX + col * colWidth;
      const y = startY + row * rowHeight;
      const code = s.skill_code || `SK-${idx + 1}`;

      positions[code] = {
        x,
        y,
        label: s.skill_name,
        code,
        skill: s
      };

      // Add edges from prerequisites
      (s.prerequisites || []).forEach(pCode => {
        computedEdges.push({ from: pCode, to: code });
      });
    });

    // If no explicit prerequisites exist in data, connect sequential concepts for visualization
    if (computedEdges.length === 0 && effectiveSkills.length > 1) {
      for (let i = 0; i < effectiveSkills.length - 1; i++) {
        computedEdges.push({
          from: effectiveSkills[i].skill_code || `SK-${i + 1}`,
          to: effectiveSkills[i + 1].skill_code || `SK-${i + 2}`
        });
      }
    }

    const calcWidth = Math.max(760, startX + cols * colWidth + 40);
    const calcHeight = Math.max(280, startY + rowsPerCol * rowHeight + 40);

    return {
      nodePositions: positions,
      edges: computedEdges,
      svgWidth: calcWidth,
      svgHeight: calcHeight
    };
  }, [effectiveSkills]);

  const selectedSkill = useMemo(() => {
    if (selectedSkillId) {
      return effectiveSkills.find(s => s.skill_id === selectedSkillId || s.skill_code === selectedSkillId) || effectiveSkills[0];
    }
    // Default to the skill with the most urgent learning gap or the first
    const gapSkill = effectiveSkills.find(s => s.prerequisite_gap || s.mastery_probability < 0.5);
    return gapSkill || effectiveSkills[0];
  }, [selectedSkillId, effectiveSkills]);

  const getNodeStyles = (skill: SkillMasteryInfo) => {
    if (skill.evidence_count === 0) {
      return {
        bg: '#ffffff',
        border: '#cbd5e1',
        text: '#475569',
        badgeBg: '#f1f5f9',
        badgeText: '#475569',
        status: 'Unassessed'
      };
    }
    if (skill.mastery_probability >= 0.70) {
      return {
        bg: '#f0fdf4',
        border: '#10b981',
        text: '#065f46',
        badgeBg: '#dcfce7',
        badgeText: '#15803d',
        status: 'Mastered'
      };
    }
    if (skill.mastery_probability >= 0.50) {
      return {
        bg: '#eff6ff',
        border: '#3b82f6',
        text: '#1e40af',
        badgeBg: '#dbeafe',
        badgeText: '#1d4ed8',
        status: 'Progressing'
      };
    }
    return {
      bg: '#fff1f2',
      border: '#ef4444',
      text: '#9f1239',
      badgeBg: '#ffe4e6',
      badgeText: '#be123c',
      status: 'Learning Gap'
    };
  };

  const handleNodeClick = (skill: SkillMasteryInfo) => {
    setSelectedSkillId(skill.skill_id);
    if (onSelectSkill) onSelectSkill(skill.skill_id);
  };

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        color: '#0f172a',
        fontFamily: "'Satoshi', sans-serif"
      }}
    >
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: '4px' }}>
            <Layers size={14} color="#0f172a" />
            <span>Cognitive Mastery Graph</span>
          </div>
          <h3 style={{ fontSize: '1.22rem', fontWeight: 800, color: '#0f172a', margin: '2px 0 0 0', letterSpacing: '-0.02em' }}>
            Prerequisite Knowledge Graph (DAG)
          </h3>
          <p style={{ fontSize: '0.84rem', color: '#475569', margin: '3px 0 0 0' }}>
            Directed dependency paths: master upstream prerequisites to unlock higher-order skills.
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.76rem', fontWeight: 600, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803d' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#10b981' }} />
            Mastered (≥70%)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1d4ed8' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#3b82f6' }} />
            Progressing (50-69%)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#be123c' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ef4444' }} />
            Learning Gap (&lt;50%)
          </span>
        </div>
      </div>

      {/* Graph Visual Canvas */}
      <div
        style={{
          position: 'relative',
          overflowX: 'auto',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '16px',
          backgroundImage: 'radial-gradient(#cbd5e1 0.75px, transparent 0.75px)',
          backgroundSize: '16px 16px'
        }}
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', minWidth: `${Math.min(svgWidth, 720)}px`, height: `${svgHeight}px`, display: 'block' }}
        >
          <defs>
            <marker
              id="dag-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b" />
            </marker>
            <filter id="node-shadow" x="-5%" y="-5%" width="115%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.06" />
            </filter>
            <filter id="node-active-shadow" x="-10%" y="-10%" width="125%" height="130%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#2563eb" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Render prerequisite dependency edges */}
          {edges.map((e, idx) => {
            const start = nodePositions[e.from];
            const end = nodePositions[e.to];
            if (!start || !end) return null;

            const startX = start.x + 210;
            const startY = start.y + 30;
            const endX = end.x;
            const endY = end.y + 30;
            const midX = (startX + endX) / 2;

            return (
              <path
                key={idx}
                d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX - 3} ${endY}`}
                fill="none"
                stroke="#64748b"
                strokeWidth="2"
                strokeDasharray="4 3"
                markerEnd="url(#dag-arrow)"
              />
            );
          })}

          {/* Render Skill Nodes */}
          {Object.entries(nodePositions).map(([code, pos]) => {
            const skill = pos.skill;
            const styles = getNodeStyles(skill);
            const isSelected = selectedSkill?.skill_code === code || selectedSkill?.skill_id === skill.skill_id;
            const mastery = skill.evidence_count > 0 ? Math.round(skill.mastery_probability * 100) : null;
            const hasGap = skill.prerequisite_gap || (skill.evidence_count > 0 && skill.mastery_probability < 0.50);

            return (
              <g
                key={code}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => handleNodeClick(skill)}
                style={{ cursor: 'pointer' }}
              >
                {/* Node Box */}
                <rect
                  width="210"
                  height="60"
                  rx="9"
                  fill={styles.bg}
                  stroke={isSelected ? '#2563eb' : styles.border}
                  strokeWidth={isSelected ? '2.5' : '1.5'}
                  filter={isSelected ? 'url(#node-active-shadow)' : 'url(#node-shadow)'}
                />

                {/* Skill Code Pill */}
                <rect
                  x="10"
                  y="10"
                  width="58"
                  height="18"
                  rx="4"
                  fill={styles.badgeBg}
                />
                <text
                  x="39"
                  y="23"
                  textAnchor="middle"
                  fill={styles.badgeText}
                  fontSize="10"
                  fontWeight="800"
                  fontFamily="'Satoshi', sans-serif"
                >
                  {code}
                </text>

                {/* Mastery % or Tag */}
                <text
                  x="198"
                  y="23"
                  textAnchor="end"
                  fill={styles.text}
                  fontSize="12"
                  fontWeight="800"
                  fontFamily="'Satoshi', sans-serif"
                >
                  {mastery !== null ? `${mastery}%` : 'New'}
                </text>

                {/* Skill Label */}
                <text
                  x="10"
                  y="46"
                  fill="#0f172a"
                  fontSize="11"
                  fontWeight="700"
                  fontFamily="'Satoshi', sans-serif"
                >
                  {pos.label.length > 24 ? pos.label.substring(0, 22) + '...' : pos.label}
                </text>

                {/* Gap Warning Indicator */}
                {hasGap && (
                  <circle cx="196" cy="45" r="5" fill="#ef4444" />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Skill Detail Card */}
      {selectedSkill && (
        <div
          style={{
            marginTop: '16px',
            padding: '16px 20px',
            background: '#f8fafc',
            borderRadius: '10px',
            border: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}
        >
          <div style={{ flex: '1 1 320px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.02rem', fontWeight: 800, color: '#0f172a' }}>
                {selectedSkill.skill_code}: {selectedSkill.skill_name}
              </span>
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  padding: '3px 9px',
                  borderRadius: '12px',
                  background: selectedSkill.mastery_probability >= 0.70 ? '#dcfce7' : selectedSkill.mastery_probability >= 0.50 ? '#dbeafe' : '#ffe4e6',
                  color: selectedSkill.mastery_probability >= 0.70 ? '#15803d' : selectedSkill.mastery_probability >= 0.50 ? '#1d4ed8' : '#be123c'
                }}
              >
                {selectedSkill.evidence_count > 0 ? `${Math.round(selectedSkill.mastery_probability * 100)}% Mastery` : 'Unassessed'}
              </span>
              <span style={{ fontSize: '0.74rem', color: '#475569', fontWeight: 600 }}>
                {selectedSkill.evidence_count} evidence records · {selectedSkill.confidence_label} confidence
              </span>
            </div>

            <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '6px' }}>
              <strong style={{ color: '#334155' }}>Prerequisite Chain: </strong>
              {selectedSkill.prerequisites && selectedSkill.prerequisites.length > 0 ? (
                selectedSkill.prerequisites.map(p => (
                  <span
                    key={p}
                    style={{
                      display: 'inline-block',
                      marginRight: '6px',
                      padding: '1px 7px',
                      borderRadius: '4px',
                      background: '#e2e8f0',
                      color: '#1e293b',
                      fontSize: '0.74rem',
                      fontWeight: 700
                    }}
                  >
                    {p}
                  </span>
                ))
              ) : (
                <span>Foundational (Root Concept)</span>
              )}
            </div>

            {selectedSkill.prerequisite_gap && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b91c1c', fontSize: '0.8rem', fontWeight: 700, marginTop: '6px' }}>
                <AlertCircle size={15} /> Prerequisite gap active in upstream skill! Reinforce foundational concepts before proceeding.
              </div>
            )}
          </div>

          {onPracticeSkill && (
            <button
              onClick={() => onPracticeSkill(selectedSkill.skill_id, selectedSkill.skill_code)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '8px',
                background: '#283742',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#1a252d'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#283742'; }}
            >
              <span>Practice Skill</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PrerequisiteDAG;
