import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Bell, BookOpen, CheckCircle2, ClipboardCheck, ClipboardList, FileText, Lightbulb, Search, Target, TrendingUp } from 'lucide-react';
import { Chapter } from '../../types';
import { apiClient } from '../../api/client';
import { learningRepository, LearnerProgressSummary } from '../../services/learningRepository';
import { DiagnosticRunner } from './DiagnosticRunner';

type AssessmentTab = 'assessments' | 'practice' | 'past';

interface AssessmentViewProps {
  studentId: string;
  activeChapterId?: string;
  onAttemptCompleted: () => void;
  onNavigateToIntervention: (skillId: string, patternId: string, classification: string) => void;
  onNavigateToLearn: () => void;
}

export const AssessmentView: React.FC<AssessmentViewProps> = ({ studentId, activeChapterId, onAttemptCompleted, onNavigateToIntervention, onNavigateToLearn }) => {
  const [tab, setTab] = useState<AssessmentTab>('assessments');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [progress, setProgress] = useState<LearnerProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedChapter, setSelectedChapter] = useState(activeChapterId || '');
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([apiClient.getChapters().catch(() => []), learningRepository.getProgress(studentId)])
      .then(([loadedChapters, learnerProgress]) => {
        if (!active) return;
        setChapters(loadedChapters);
        setProgress(learnerProgress);
        if (activeChapterId) setSelectedChapter(activeChapterId);
        else if (!selectedChapter && loadedChapters.length) setSelectedChapter(loadedChapters[0].id);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [studentId, activeChapterId]);

  const filteredChapters = useMemo(() => chapters.filter(chapter => `${chapter.title} ${chapter.subject} ${chapter.description || ''}`.toLowerCase().includes(search.toLowerCase())), [chapters, search]);
  const filteredAttempts = useMemo(() => (progress?.recent_activity || []).filter(item => `${item.title} ${item.score_or_result || ''}`.toLowerCase().includes(search.toLowerCase())), [progress, search]);
  const startDiagnostic = (chapterId?: string) => {
    const targetChapter = chapterId || selectedChapter || chapters[0]?.id;
    if (!targetChapter) { onNavigateToLearn(); return; }
    setSelectedChapter(targetChapter);
    setRunning(true);
  };

  if (running) return <div className="assessment-runner-shell"><button className="assessment-back" onClick={() => setRunning(false)}><ArrowLeft size={16} /> Back to Assess</button><DiagnosticRunner studentId={studentId} activeChapterId={selectedChapter} onAttemptCompleted={() => { onAttemptCompleted(); learningRepository.getProgress(studentId).then(setProgress); }} onNavigateToIntervention={onNavigateToIntervention} /></div>;

  const tabs: { id: AssessmentTab; label: string; icon: typeof ClipboardCheck }[] = [
    { id: 'assessments', label: 'Assessments', icon: ClipboardCheck },
    { id: 'practice', label: 'Practice Tests', icon: Target },
    { id: 'past', label: 'Past Attempts', icon: ClipboardList },
  ];

  return (
    <div className="assessment-dashboard">
      <div className="assessment-topbar"><label><Search size={18} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search for topics, skills, or questions..." aria-label="Search assessments" /></label><button aria-label="Assessment notifications"><Bell size={20} /><i /></button></div>
      <header className="assessment-heading"><div><span>ASSESS YOUR UNDERSTANDING</span><h1>Assess</h1><p>Track what you know. Find what to work on.</p></div><blockquote>“Assessment isn’t a judgment.<br />It’s a starting point.”</blockquote></header>

      <div className="assessment-main-grid">
        <div className="assessment-main-column">
          <nav className="assessment-tabs" role="tablist" aria-label="Assessment views">
            {tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'is-active' : ''} onClick={() => setTab(id)}><Icon size={18} />{label}{id === 'past' && (progress?.recent_activity.length || 0) > 0 && <small>{progress?.recent_activity.length}</small>}</button>)}
          </nav>

          {tab === 'assessments' && <>
            <div className="assessment-action-grid">
              <article><span><ClipboardCheck size={23} /></span><h2>Take a Diagnostic</h2><p>Understand your current level and get personalized recommendations.</p><button onClick={() => startDiagnostic()}>Start Diagnostic <ArrowRight size={16} /></button></article>
              <article><span><Target size={23} /></span><h2>Topic Assessments</h2><p>Test your understanding in a specific topic.</p><button onClick={() => setTab('practice')}>Choose a Topic <ArrowRight size={16} /></button></article>
              <article><span><FileText size={23} /></span><h2>Custom Practice</h2><p>Choose a chapter and build a focused practice session.</p><button onClick={() => setTab('practice')}>Choose Practice <ArrowRight size={16} /></button></article>
            </div>
            <section className="assessment-recent-panel"><header><div><h2>Recent Attempts</h2><p>Your latest recorded assessment activity.</p></div><button onClick={() => setTab('past')}>View All <ArrowRight size={15} /></button></header>{filteredAttempts.length ? <div className="assessment-attempt-list">{filteredAttempts.slice(0, 4).map(attempt => <article key={attempt.id}><span><FileText size={18} /></span><div><strong>{attempt.title}</strong><small>{attempt.type === 'assessment' ? 'Assessment' : 'Retest'} · {new Date(attempt.timestamp).toLocaleDateString()}</small></div>{attempt.score_or_result && <em>{attempt.score_or_result}</em>}</article>)}</div> : <div className="assessment-empty">{loading ? 'Loading your attempts…' : 'Your completed attempts will appear here.'}</div>}</section>
          </>}

          {tab === 'practice' && <section className="assessment-recent-panel assessment-practice-panel"><header><div><h2>Choose a Topic</h2><p>Select a chapter to launch a focused diagnostic practice.</p></div><select aria-label="Select a chapter" value={selectedChapter} onChange={event => setSelectedChapter(event.target.value)}><option value="">Choose a topic</option>{filteredChapters.map(chapter => <option key={chapter.id} value={chapter.id}>{chapter.subject}: {chapter.title}</option>)}</select></header>{filteredChapters.length ? <div className="assessment-topic-list">{filteredChapters.map(chapter => <article key={chapter.id}><span><BookOpen size={20} /></span><div><strong>{chapter.title}</strong><small>{chapter.subject}{chapter.description ? ` · ${chapter.description}` : ''}</small></div><button onClick={() => startDiagnostic(chapter.id)}>Start <ArrowRight size={15} /></button></article>)}</div> : <div className="assessment-empty">{loading ? 'Loading topics…' : 'No topics match your search. Explore Learn to add course material.'}<button onClick={onNavigateToLearn}>Explore Learn <ArrowRight size={14} /></button></div>}</section>}

          {tab === 'past' && <section className="assessment-recent-panel"><header><div><h2>Past Attempts</h2><p>Review your recorded diagnostics and retests.</p></div></header>{filteredAttempts.length ? <div className="assessment-attempt-list">{filteredAttempts.map(attempt => <article key={attempt.id}><span>{attempt.type === 'assessment' ? <CheckCircle2 size={18} /> : <TrendingUp size={18} />}</span><div><strong>{attempt.title}</strong><small>{attempt.type === 'assessment' ? 'Assessment' : 'Retest'} · {new Date(attempt.timestamp).toLocaleString()}</small></div>{attempt.score_or_result && <em>{attempt.score_or_result}</em>}</article>)}</div> : <div className="assessment-empty">{loading ? 'Loading your attempt history…' : 'No assessment history is available yet. Start a diagnostic to begin.'}<button onClick={() => startDiagnostic()}>Start a diagnostic <ArrowRight size={14} /></button></div>}</section>}

          <section className="assessment-recommendations"><header><div><h2>Recommended for You</h2><p>Useful next steps from your learning journey.</p></div><button onClick={() => setTab('practice')}>View All <ArrowRight size={15} /></button></header><div className="assessment-recommendation-grid"><button onClick={() => setTab('practice')}><span><Lightbulb size={21} /></span><div><strong>Practice a Topic</strong><small>Focus on a specific area of understanding.</small></div><ArrowRight size={16} /></button><button onClick={() => startDiagnostic()}><span><Target size={21} /></span><div><strong>Try a Diagnostic</strong><small>Find your strengths and next steps.</small></div><ArrowRight size={16} /></button><button onClick={onNavigateToLearn}><span><TrendingUp size={21} /></span><div><strong>Explore Learning</strong><small>Build understanding before your next check-in.</small></div><ArrowRight size={16} /></button></div></section>
        </div>

        <aside className="assessment-side-column"><section className="assessment-why"><h2>Why Assess?</h2><article><span><TrendingUp size={22} /></span><div><strong>Find learning gaps</strong><small>Know exactly what to improve.</small></div></article><article><span><Target size={22} /></span><div><strong>Get personalized practice</strong><small>Your Twin recommends what’s next.</small></div></article><article><span><TrendingUp size={22} /></span><div><strong>Track your growth</strong><small>See clear progress over time.</small></div></article></section><blockquote className="assessment-quote-card">“Progress<br />starts with<br />honest practice.”<i /></blockquote></aside>
      </div>
    </div>
  );
};

export default AssessmentView;
