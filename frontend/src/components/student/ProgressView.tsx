import React, { useEffect, useMemo, useState } from 'react';
import { learningRepository, LearnerProgressSummary } from '../../services/learningRepository';
import { ArrowRight, Award, Bell, BookOpen, CalendarDays, CheckCircle2, ClipboardList, Clock, Flame, Search, Target, TrendingUp } from 'lucide-react';

interface ProgressViewProps {
  userId: string;
  onNavigateToAssess: () => void;
  onNavigateToLearn: () => void;
}

type ProgressTab = 'overview' | 'skills' | 'assessments' | 'time';

export const ProgressView: React.FC<ProgressViewProps> = ({ userId, onNavigateToAssess, onNavigateToLearn }) => {
  const [progress, setProgress] = useState<LearnerProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProgressTab>('overview');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    learningRepository.getProgress(userId).then(data => {
      if (active) setProgress(data);
    }).catch(error => {
      console.warn('Could not load student progress:', error);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [userId]);

  const activity = useMemo(() => (progress?.recent_activity || []).filter(item => {
    const matches = `${item.title} ${item.score_or_result || ''}`.toLowerCase().includes(search.toLowerCase());
    if (!matches) return false;
    if (activeTab === 'assessments') return item.type === 'assessment';
    if (activeTab === 'skills') return item.type === 'retest' || item.title.toLowerCase().includes('skill');
    return true;
  }), [progress, search, activeTab]);

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: TrendingUp },
    { id: 'skills' as const, label: 'Subject Skills', icon: BookOpen },
    { id: 'assessments' as const, label: 'Assessments', icon: ClipboardList },
    { id: 'time' as const, label: 'Learning Time', icon: CalendarDays },
  ];
  const total = progress?.total_attempts || 0;
  const correct = progress?.correct_attempts || 0;
  const accuracy = progress?.score_percentage;

  return (
    <div className="progress-dashboard">
      <div className="progress-topbar"><label><Search size={18} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search topics, skills, or questions..." aria-label="Search progress" /></label><button aria-label="Progress notifications"><Bell size={20} /><span /></button></div>

      <header className="progress-heading">
        <div><span className="progress-eyebrow">PROGRESS</span><h1>Your Learning Journey.</h1><p>Track your progress, build consistency, and see how far you have come.</p></div>
        <div className="progress-hero-art" aria-hidden="true"><div><BookOpen /><TrendingUp /><Target /></div><blockquote>&ldquo;Small steps<br />today, bigger<br />understanding<br />tomorrow.&rdquo;</blockquote></div>
      </header>

      <nav className="progress-tabs" aria-label="Progress views" role="tablist">
        {tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={activeTab === id} className={activeTab === id ? 'is-active' : ''} onClick={() => setActiveTab(id)}><Icon size={19} />{label}</button>)}
      </nav>

      {activeTab === 'time' ? <section className="progress-time-panel"><Clock size={25} /><div><strong>Learning time tracking</strong><p>Time spent studying isn’t recorded yet. Your completed questions and learning events remain available below.</p></div><button onClick={onNavigateToLearn}>Continue learning <ArrowRight size={15} /></button></section> : (
        <div className="progress-metrics">
          <article className="progress-metric"><span><BookOpen size={22} /></span><div><small>Topics explored</small><strong>{progress?.assessed_skills_count || 0}</strong><em>Skills with recorded evidence</em></div></article>
          <article className="progress-metric"><span><ClipboardList size={22} /></span><div><small>Questions answered</small><strong>{total}</strong><em>Across your learning sessions</em></div></article>
          <article className="progress-metric"><span><Target size={22} /></span><div><small>Average accuracy</small><strong>{accuracy === null || accuracy === undefined ? '—' : `${accuracy}%`}</strong><em>Based on recorded responses</em></div></article>
          <article className="progress-metric"><span><Flame size={22} /></span><div><small>Correct responses</small><strong>{correct}</strong><em>Evidence of understanding</em></div></article>
        </div>
      )}

      {activeTab === 'overview' && <div className="progress-overview-grid">
        <section className="progress-panel progress-distribution"><header><div><h2>Response Distribution</h2><p>Accuracy across your recorded answers.</p></div><span>{loading ? 'Loading' : 'Live data'}</span></header><div className="progress-distribution-body"><div className="progress-donut" style={{ '--progress-value': `${accuracy ?? 0}%` } as React.CSSProperties}><div><strong>{total}</strong><small>Responses</small></div></div><div className="progress-legend"><p><i className="is-correct" />Correct answers <strong>{correct}</strong></p><p><i className="is-review" />Needs review <strong>{Math.max(0, total - correct)}</strong></p><p><i className="is-neutral" />Accuracy <strong>{accuracy === null || accuracy === undefined ? '—' : `${accuracy}%`}</strong></p></div></div></section>
        <section className="progress-panel progress-next"><span className="progress-eyebrow">YOUR NEXT STEP</span><h2>{total ? 'Keep building your understanding.' : 'Your learning journey starts here.'}</h2><p>{total ? 'Practice another topic and see how your evidence grows.' : 'Complete a diagnostic or explore a topic to start collecting progress.'}</p><div><button onClick={onNavigateToLearn}>Explore topics <BookOpen size={15} /></button><button onClick={onNavigateToAssess}>Take an assessment <ArrowRight size={15} /></button></div></section>
      </div>}

      {activeTab === 'skills' && <section className="progress-panel progress-tab-panel"><header><div><h2>Subject Skill Evidence</h2><p>Recorded learning events that contribute to your skill understanding.</p></div><span>{progress?.assessed_skills_count || 0} skills</span></header><div className="progress-evidence-strip"><span><BookOpen size={19} /></span><div><strong>{progress?.assessed_skills_count || 0} skills assessed</strong><small>Skill level detail will appear here as your learning data grows.</small></div><button onClick={onNavigateToLearn}>Explore skills <ArrowRight size={14} /></button></div></section>}

      {activeTab === 'assessments' && <section className="progress-panel progress-tab-panel"><header><div><h2>Assessment History</h2><p>Your recorded diagnostic and retest outcomes.</p></div><button onClick={onNavigateToAssess}>Start assessment <ArrowRight size={14} /></button></header></section>}

      {activeTab !== 'time' && <section className="progress-panel progress-activity"><header><div><h2><Clock size={18} />{activeTab === 'assessments' ? 'Assessment Activity' : activeTab === 'skills' ? 'Recent Skill Events' : 'Recent Learning Events'}</h2><p>Chronological records from your learning sessions.</p></div><span>{activity.length} events</span></header>
        {activity.length === 0 ? <div className="progress-empty">{loading ? 'Loading learning history…' : search ? 'No activity matches your search.' : activeTab === 'assessments' ? 'No assessment results have been recorded yet.' : activeTab === 'skills' ? 'No skill events have been recorded yet.' : 'No learning activity yet. Explore a topic or start a diagnostic to begin.'}</div> : <div className="progress-event-list">{activity.map(item => {
          const isCorrect = item.score_or_result === 'Correct' || Boolean(item.score_or_result?.includes('+'));
          return <article className="progress-event" key={item.id}><span className={isCorrect ? 'is-correct' : ''}>{item.type === 'assessment' ? <CheckCircle2 size={18} /> : <Award size={18} />}</span><div><strong>{item.title}</strong><small><Clock size={12} />{new Date(item.timestamp).toLocaleString()}</small></div>{item.score_or_result && <em className={isCorrect ? 'is-correct' : ''}>{item.score_or_result}</em>}</article>;
        })}</div>}
      </section>}
    </div>
  );
};

export default ProgressView;
