import React, { useState } from 'react';
import { SkillMasteryInfo } from '../../types';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface PrerequisiteDAGProps {
  skills: SkillMasteryInfo[];
  onSelectSkill?: (skillId: string) => void;
}

export const PrerequisiteDAG: React.FC<PrerequisiteDAGProps> = ({ skills, onSelectSkill }) => {
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  // Position nodes in a 3-layer DAG layout
  const nodePositions: Record<string, { x: number; y: number; label: string }> = {
    "EQ-01": { x: 100, y: 70, label: "Understanding Equality" },
    "SIMP-02": { x: 100, y: 220, label: "Simplifying Expressions" },
    "LIKE-03": { x: 380, y: 70, label: "Combining Like Terms" },
    "DIST-04": { x: 380, y: 220, label: "Distributive Property" },
    "ISOL-05": { x: 660, y: 70, label: "Isolating the Variable" },
    "MULTI-06": { x: 660, y: 220, label: "Multi-Step Equations" },
  };

  // Directed edges representing prerequisite dependencies
  const edges = [
    { from: "EQ-01", to: "SIMP-02" },
    { from: "EQ-01", to: "LIKE-03" },
    { from: "SIMP-02", to: "DIST-04" },
    { from: "LIKE-03", to: "ISOL-05" },
    { from: "DIST-04", to: "MULTI-06" },
    { from: "ISOL-05", to: "MULTI-06" },
  ];

  const skillMap = new Map(skills.map(s => [s.skill_code, s]));
  const selectedSkill = skills.find(s => s.skill_id === selectedSkillId) || skills[3]; // default to Distributive Property

  const getNodeColor = (code: string) => {
    const s = skillMap.get(code);
    if (!s || s.evidence_count === 0) return { bg: '#1E293B', border: '#475569', text: '#94A3B8' };
    if (s.mastery_probability >= 0.70) return { bg: 'rgba(16, 185, 129, 0.15)', border: '#10B981', text: '#34D399' };
    if (s.mastery_probability >= 0.50) return { bg: 'rgba(59, 130, 246, 0.15)', border: '#3B82F6', text: '#60A5FA' };
    return { bg: 'rgba(239, 68, 68, 0.2)', border: '#EF4444', text: '#F87171' }; // Gap!
  };

  const handleNodeClick = (code: string) => {
    const s = skillMap.get(code);
    if (s) {
      setSelectedSkillId(s.skill_id);
      if (onSelectSkill) onSelectSkill(s.skill_id);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC' }}>
            Prerequisite Knowledge Graph (DAG)
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
            Visual dependencies: mastery flows along prerequisite directed pathways.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#34D399' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} /> Mastered (≥70%)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#60A5FA' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6' }} /> Progressing
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#F87171' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} /> Learning Gap
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div style={{ position: 'relative', overflowX: 'auto', background: 'rgba(7, 11, 20, 0.6)', borderRadius: '10px', padding: '10px' }}>
        <svg viewBox="0 0 800 300" style={{ width: '100%', minWidth: '700px', height: '240px' }}>
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
            </marker>
          </defs>

          {/* Render dependency edges */}
          {edges.map((e, idx) => {
            const start = nodePositions[e.from];
            const end = nodePositions[e.to];
            if (!start || !end) return null;
            return (
              <line
                key={idx}
                x1={start.x + 80}
                y1={start.y + 25}
                x2={end.x}
                y2={end.y + 25}
                stroke="#334155"
                strokeWidth="2"
                strokeDasharray="4 2"
                markerEnd="url(#arrow)"
              />
            );
          })}

          {/* Render Skill Nodes */}
          {Object.entries(nodePositions).map(([code, pos]) => {
            const colors = getNodeColor(code);
            const skillObj = skillMap.get(code);
            const isSelected = selectedSkill?.skill_code === code;
            const mastery = skillObj ? Math.round(skillObj.mastery_probability * 100) : 30;
            const hasGap = skillObj?.prerequisite_gap || (skillObj && skillObj.mastery_probability < 0.50);

            return (
              <g
                key={code}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => handleNodeClick(code)}
                style={{ cursor: 'pointer' }}
              >
                {/* Node Box */}
                <rect
                  width="180"
                  height="54"
                  rx="8"
                  fill={colors.bg}
                  stroke={isSelected ? '#3B82F6' : colors.border}
                  strokeWidth={isSelected ? '2.5' : '1.5'}
                  filter={isSelected ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.4))' : 'none'}
                />

                {/* Node Code & Mastery */}
                <text x="12" y="22" fill={colors.text} fontSize="11" fontWeight="700" fontFamily="var(--font-heading)">
                  {code}
                </text>
                <text x="168" y="22" textAnchor="end" fill={colors.text} fontSize="12" fontWeight="800">
                  {mastery}%
                </text>

                {/* Node Title */}
                <text x="12" y="42" fill="#E2E8F0" fontSize="11" fontFamily="var(--font-sans)">
                  {pos.label.length > 22 ? pos.label.substring(0, 20) + '...' : pos.label}
                </text>

                {/* Gap Warning icon if applicable */}
                {hasGap && (
                  <circle cx="170" cy="40" r="4" fill="#EF4444" />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Skill Quick Detail */}
      {selectedSkill && (
        <div style={{ marginTop: '14px', padding: '12px 16px', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, color: '#F8FAFC' }}>
                {selectedSkill.skill_code}: {selectedSkill.skill_name}
              </span>
              <span className={`badge ${selectedSkill.mastery_probability >= 0.7 ? 'badge-emerald' : selectedSkill.mastery_probability >= 0.5 ? 'badge-blue' : 'badge-rose'}`}>
                {Math.round(selectedSkill.mastery_probability * 100)}% Mastery
              </span>
              <span className="badge badge-blue">
                Confidence: {selectedSkill.confidence_label} ({selectedSkill.evidence_count} attempts)
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '4px' }}>
              Prerequisites: {selectedSkill.prerequisites.length > 0 ? selectedSkill.prerequisites.join(', ') : 'None (Foundational)'}
            </div>
          </div>
          {selectedSkill.prerequisite_gap && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F87171', fontSize: '0.82rem', fontWeight: 600 }}>
              <AlertCircle size={16} /> Prerequisite gap active in upstream skill!
            </div>
          )}
        </div>
      )}
    </div>
  );
};
