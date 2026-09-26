import React, { useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Bell, BookOpen, Brain, ChartNoAxesCombined, CheckCircle2,
  FileText, Lightbulb, Search, Sparkles, Target, TrendingUp, Sprout,
  AlertTriangle, Activity
} from 'lucide-react';
import { KnowledgeTwinView as KnowledgeTwinType } from '../../types';
import { MistakeCardList } from './MistakeCardList';

interface KnowledgeTwinViewProps {
  twin: KnowledgeTwinType | null;
  onNavigateToDiagnostic: () => void;
  onNavigateToUpload: () => void;
  onStartIntervention: (skillId: string, patternId: string, classification: string) => void;
  onNavigateToHome?: () => void;
}

type TwinSection = 'Overview' | 'Mistakes & Patterns' | 'Learning Style' | 'Focus Areas' | 'Growth Insights';

export const KnowledgeTwinView: React.FC<KnowledgeTwinViewProps> = ({ twin, onNavigateToDiagnostic, onNavigateToUpload, onStartIntervention, onNavigateToHome }) => {
  const [activeSection, setActiveSection] = useState<TwinSection>('Overview');
  const [searchQuery, setSearchQuery] = useState('');
  const skills = twin?.skills ?? [];
  const evidenceSkills = skills.filter(skill => skill.evidence_count > 0);
  const responseCount = skills.reduce((sum, skill) => sum + skill.evidence_count, 0);
  const strongSkills = evidenceSkills.filter(skill => skill.mastery_probability >= .7).sort((a, b) => b.mastery_probability - a.mastery_probability);
  const weakSkills = evidenceSkills.filter(skill => skill.mastery_probability < .7).sort((a, b) => a.mastery_probability - b.mastery_probability);
  const improvingSkills = evidenceSkills.filter(skill => skill.trend === 'improving');
  const mastery = twin?.overall_mastery == null || !responseCount ? null : Math.round(twin.overall_mastery * 100);
  const showSection = (section: TwinSection) => activeSection === 'Overview' || activeSection === section;
  const visibleSkills = useMemo(() => skills.filter(skill => skill.skill_name.toLowerCase().includes(searchQuery.toLowerCase())), [skills, searchQuery]);
  const suggestion = weakSkills[0];

  const traits = [
    { title: 'Concept Builder', detail: strongSkills[0] ? `Strongest in ${strongSkills[0].skill_name}` : 'Your understanding is taking shape', icon: <Lightbulb /> },
    { title: 'Evidence Driven', detail: `${responseCount} learning ${responseCount === 1 ? 'response' : 'responses'} recorded`, icon: <ChartNoAxesCombined /> },
    { title: 'Adaptive Learner', detail: weakSkills.length ? `${weakSkills.length} areas ready for focused practice` : 'Your next steps follow your progress', icon: <Brain /> },
    { title: 'Building Momentum', detail: improvingSkills.length ? `${improvingSkills.length} ${improvingSkills.length === 1 ? 'skill is' : 'skills are'} improving` : 'Every practice session adds a signal', icon: <TrendingUp /> },
  ];

  const renderSkillRows = (items: typeof skills, emptyText: string, actionLabel?: string) => items.length ? items.map(skill => {
    const value = Math.round(skill.mastery_probability * 100);
    return <div className="student-twin-skill-row" key={skill.skill_id}>
      <span className="student-twin-skill-icon"><BookOpen size={18} /></span>
      <div className="student-twin-skill-copy"><strong>{skill.skill_name}</strong><small>{skill.evidence_count ? `${skill.evidence_count} evidence ${skill.evidence_count === 1 ? 'record' : 'records'} · ${skill.confidence_label}` : 'Not assessed yet'}</small></div>
      <div className="student-twin-progress"><i style={{ width: `${skill.evidence_count ? value : 0}%` }} /></div>
      <b>{skill.evidence_count ? `${value}%` : '—'}</b>
      {actionLabel && <button className="student-twin-practice" onClick={() => onStartIntervention(skill.skill_id, 'PAT_DIST_PARTIAL', 'procedural')}>{actionLabel}<ArrowRight size={14} /></button>}
    </div>;
  }) : <p className="student-twin-empty-copy">{emptyText}</p>;

  return <div className="student-twin-page">
    {onNavigateToHome && (
      <button type="button" className="page-back-button" onClick={onNavigateToHome}>
        <ArrowLeft size={15} /> Back to Dashboard
      </button>
    )}
    <div className="student-twin-topbar">
      <label><Search size={18} /><input aria-label="Search your learning evidence" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Search your skills, learning evidence, or focus areas..." /></label>
      <button aria-label="Notifications"><Bell size={19} /><i /></button>
    </div>

    <header className="student-twin-heading">
      <div><span>MY KNOWLEDGE TWIN</span><h1>Your <b>Twin.</b></h1><p>A clearer understanding of how you learn and what to try next.</p></div>
      <blockquote>“More than a profile,<br />a learning partner.”</blockquote>
    </header>

    <nav className="student-twin-tabs" aria-label="Knowledge Twin sections">
      {(['Overview', 'Mistakes & Patterns', 'Learning Style', 'Focus Areas', 'Growth Insights'] as TwinSection[]).map(section => (
        <button
          key={section}
          className={activeSection === section ? 'active' : ''}
          onClick={() => setActiveSection(section)}
        >
          {section}
          {section === 'Mistakes & Patterns' && (twin?.active_misconceptions?.length ?? 0) > 0 && (
            <small style={{ marginLeft: '6px', background: '#f59e0b', color: '#000', padding: '1px 6px', borderRadius: '10px', fontWeight: 800, fontSize: '0.7rem' }}>
              {twin?.active_misconceptions?.length}
            </small>
          )}
        </button>
      ))}
    </nav>

    {/* MISTAKES & PATTERNS FIRST-CLASS SECTION */}
    {activeSection === 'Mistakes & Patterns' && (
      <section className="student-twin-section" style={{ marginTop: '20px', padding: '24px' }}>
        <MistakeCardList
          activeMisconceptions={twin?.active_misconceptions || []}
          resolvedMisconceptions={twin?.resolved_misconceptions || []}
          onStartIntervention={onStartIntervention}
        />
      </section>
    )}

    {/* LIVING MISTAKE BANK PREVIEW ON OVERVIEW */}
    {activeSection === 'Overview' && (twin?.active_misconceptions?.length ?? 0) > 0 && (
      <section
        style={{
          marginTop: '20px',
          border: '1px solid #CBD5E1',
          borderLeft: '5px solid #D97706',
          background: '#FFFFFF',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={22} color="#D97706" />
              Living Mistake Bank ({twin?.active_misconceptions.length} Active Gaps Stored)
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: '2px' }}>
              Specific reasoning errors from your assessments are stored and tracked here until resolved.
            </p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => setActiveSection('Mistakes & Patterns')}
            style={{ fontSize: '0.82rem', padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F1F5F9', color: '#0F172A', border: '1px solid #CBD5E1', borderRadius: '6px' }}
          >
            <span>View Complete Mistake Bank</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '14px' }}>
          {twin?.active_misconceptions.slice(0, 4).map((item) => (
            <div
              key={item.id}
              style={{
                padding: '16px',
                borderRadius: '10px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>{item.classification} gap</span>
                  <small style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}>detected {item.occurrences}x</small>
                </div>
                <strong style={{ fontSize: '1rem', color: '#0F172A', display: 'block', fontWeight: 800 }}>{item.pattern_name}</strong>
                <small style={{ color: '#475569', fontSize: '0.8rem', display: 'block', marginTop: '2px' }}>Skill: <span style={{ color: '#0F172A', fontWeight: 600 }}>{item.skill_name}</span></small>
                {item.why_it_is_wrong && (
                  <div style={{ marginTop: '8px', padding: '8px 10px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px', fontSize: '0.82rem', color: '#991B1B', fontWeight: 600 }}>
                    {item.why_it_is_wrong}
                  </div>
                )}
              </div>
              <button
                className="btn btn-primary"
                onClick={() => onStartIntervention(item.skill_id || item.skill_code, item.pattern_id, item.classification)}
                style={{
                  padding: '7px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  background: '#1E293B',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <span>Fix in Targeted Intervention</span>
                <ArrowRight size={13} />
              </button>
            </div>
          ))}
        </div>
      </section>
    )}

    <div className="student-twin-top-grid">
      {showSection('Learning Style') && <section className="student-twin-profile">
        <div className="student-twin-portrait" aria-hidden="true">
          <Brain className="student-twin-brain-art" />
          <BookOpen className="student-twin-book-art" />
          <Sprout className="student-twin-sprout-art" />
        </div>
        <div className="student-twin-traits">
          <h2>Your Learning Profile</h2><p>Built from your practice, assessments, and demonstrated understanding.</p>
          {traits.map(trait => <article key={trait.title}><span>{trait.icon}</span><div><strong>{trait.title}</strong><small>{trait.detail}</small></div></article>)}
        </div>
      </section>}

      {showSection('Learning Style') && <section className="student-twin-style">
        <h2>Your Learning Signals</h2><p>What recent evidence says about your progress.</p>
        <div className="student-twin-meter"><span>Overall mastery</span><div><i style={{ width: `${mastery ?? 0}%` }} /></div><b>{mastery === null ? '—' : `${mastery}%`}</b></div>
        <div className="student-twin-meter"><span>Skills explored</span><div><i style={{ width: `${skills.length ? Math.min(100, evidenceSkills.length / skills.length * 100) : 0}%` }} /></div><b>{skills.length ? `${Math.round(evidenceSkills.length / skills.length * 100)}%` : '—'}</b></div>
        <div className="student-twin-meter"><span>Improving skills</span><div><i style={{ width: `${evidenceSkills.length ? Math.round(improvingSkills.length / evidenceSkills.length * 100) : 0}%` }} /></div><b>{evidenceSkills.length ? `${Math.round(improvingSkills.length / evidenceSkills.length * 100)}%` : '—'}</b></div>
        <div className="student-twin-meter"><span>Confidence</span><div><i style={{ width: `${evidenceSkills.length ? Math.round(evidenceSkills.reduce((sum, skill) => sum + skill.confidence, 0) / evidenceSkills.length * 100) : 0}%` }} /></div><b>{evidenceSkills.length ? `${Math.round(evidenceSkills.reduce((sum, skill) => sum + skill.confidence, 0) / evidenceSkills.length * 100)}%` : '—'}</b></div>
        <div className="student-twin-suggestion"><span><Lightbulb size={25} /></span><div><strong>Your Twin Suggests</strong><p>{suggestion ? `Practice ${suggestion.skill_name} next to strengthen your understanding.` : responseCount ? 'Keep practicing to build a clearer picture of your strengths.' : 'Take a diagnostic to create your first learning signals.'}</p></div></div>
      </section>}
    </div>

    <div className="student-twin-bottom-grid">
      {showSection('Focus Areas') && <section className="student-twin-section student-twin-focus"><div className="student-twin-section-heading"><div><h2>Focus Areas</h2><p>Skills and topics from your recent learning.</p></div><span><Target size={17} />Your skills</span></div>
        {renderSkillRows(visibleSkills.slice(0, 5), skills.length ? 'No skills match your search.' : 'Complete a lesson or diagnostic to see your focus areas.')}
      </section>}
      {showSection('Growth Insights') && <section className="student-twin-section"><h2>Your Strengths</h2><p>Areas where your evidence shows strong understanding.</p>
        {strongSkills.slice(0, 3).length ? renderSkillRows(strongSkills.slice(0, 3), '') : <div className="student-twin-empty"><Sparkles size={20} /><span>Keep learning to uncover your strengths.</span></div>}
      </section>}
      {showSection('Growth Insights') && <section className="student-twin-section"><h2>Growth Opportunities</h2><p>Small next steps based on your recent learning.</p>
        {weakSkills.slice(0, 3).length ? renderSkillRows(weakSkills.slice(0, 3), '', 'Practice') : twin?.emerging_gaps.length ? twin.emerging_gaps.slice(0, 3).map(gap => <article className="student-twin-growth-row" key={gap.id}><span><Target size={19} /></span><div><strong>{gap.title}</strong><small>{gap.description}</small></div></article>) : <div className="student-twin-empty"><CheckCircle2 size={20} /><span>No active focus areas. Keep building on your progress.</span></div>}
      </section>}
    </div>

    {activeSection === 'Overview' && !responseCount && <div className="student-twin-zero-cta"><div><strong>Your learning profile is just getting started.</strong><span>Take a quick diagnostic or add your own learning material to build your Twin.</span></div><button onClick={onNavigateToDiagnostic}>Take a Diagnostic <ArrowRight size={15} /></button><button className="secondary" onClick={onNavigateToUpload}>Add Material</button></div>}

    {activeSection === 'Growth Insights' && twin?.active_misconceptions.length ? <section className="student-twin-section student-twin-misconceptions"><h2>Patterns to work through</h2><p>Your Twin noticed these learning patterns during recent practice.</p>{twin.active_misconceptions.slice(0, 3).map(item => <article key={item.id}><div><strong>{item.pattern_name}</strong><small>{item.skill_name} · observed {item.occurrences} {item.occurrences === 1 ? 'time' : 'times'}</small></div><button onClick={() => onStartIntervention(item.skill_id || item.skill_code, item.pattern_id, item.classification)}>Practice this <ArrowRight size={14} /></button></article>)}</section> : null}
  </div>;
};

export default KnowledgeTwinView;
