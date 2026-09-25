import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Bell, BookOpen, CheckCircle2, ClipboardCheck, ClipboardList, FileText, Lightbulb, Pencil, Search, Target, TrendingUp } from 'lucide-react';
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
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
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

  const filteredChapters = useMemo(() => chapters.filter(chapter => (selectedSubject === 'All Subjects' || chapter.subject === selectedSubject) && `${chapter.title} ${chapter.subject} ${chapter.description || ''}`.toLowerCase().includes(search.toLowerCase())), [chapters, search, selectedSubject]);
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

  const totalAttempts = progress?.total_attempts || 0;
  const correctAttempts = progress?.correct_attempts || 0;
  const incorrectAttempts = Math.max(0, totalAttempts - correctAttempts);
  const correctPercent = totalAttempts ? Math.round(correctAttempts / totalAttempts * 100) : 0;
  const subjectNames = ['All Subjects', ...Array.from(new Set(chapters.map(chapter => chapter.subject).filter(Boolean)))];
  const suggestedChapters = filteredChapters.slice(0, 4);
  const latestAttempts = filteredAttempts.slice(0, tab === 'past' ? 8 : 4);
  const scorePercent = progress?.score_percentage ?? 0;
  const ringBackground = `conic-gradient(#34434c ${scorePercent}%, #e1e4e3 ${scorePercent}% 100%)`;

  return (
    <div className="assessment-dashboard">
      <div className="assessment-topbar"><label><Search size={18} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search for topics, skills, or questions..." aria-label="Search assessments" /></label><button aria-label="Assessment notifications"><Bell size={20} /><i /></button></div>
      <header className="assessment-heading"><div><span>ASSESS</span><h1>Test. Understand. Improve.</h1><p>Take assessments, get insights, and strengthen your concepts.</p></div><div className="assessment-hero-art" aria-hidden="true"><div><ClipboardList /><BookOpen /><Pencil /></div><blockquote>&ldquo;Small steps<br />today, bigger<br />understanding<br />tomorrow.&rdquo;</blockquote></div></header>

      <div className="assessment-main-grid">
        <div className="assessment-main-column">
          <nav className="assessment-tabs" role="tablist" aria-label="Assessment views">
            {tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'is-active' : ''} onClick={() => setTab(id)}><Icon size={17} />{id === 'assessments' ? 'All Assessments' : id === 'practice' ? 'Practice Tests' : 'Past Attempts'}{id === 'past' && totalAttempts > 0 && <small>{totalAttempts}</small>}</button>)}
          </nav>

          {tab === 'assessments' && <>
            <section className="assessment-metrics">
              <article><span><ClipboardCheck size={25} /></span><div><small>Assessments Taken</small><strong>{totalAttempts}</strong><p>Recorded attempts</p></div></article>
              <article><span><Target size={25} /></span><div><small>Average Score</small><strong>{progress?.score_percentage == null ? 'N/A' : `${Math.round(progress.score_percentage)}%`}</strong><p>Across your attempts</p></div></article>
              <article><span><BookOpen size={25} /></span><div><small>Skills Assessed</small><strong>{progress?.assessed_skills_count || 0}</strong><p>With recorded evidence</p></div></article>
              <article><span><TrendingUp size={25} /></span><div><small>Available Units</small><strong>{chapters.length}</strong><p>Ready to practice</p></div></article>
            </section>
            <section className="assessment-subject-section"><header><div><h2>Recommended Assessments</h2><p>Choose a curriculum unit to check your understanding.</p></div><button onClick={() => setTab('practice')}>View all <ArrowRight size={14} /></button></header>
              <nav className="assessment-subject-filters" aria-label="Filter by subject">{subjectNames.map(subject => <button key={subject} className={selectedSubject === subject ? 'is-active' : ''} onClick={() => setSelectedSubject(subject)}>{subject}</button>)}</nav>
              {loading ? <div className="assessment-empty">Loading your curriculum...</div> : suggestedChapters.length ? <div className="assessment-curriculum-grid">{suggestedChapters.map((chapter, index) => <article key={chapter.id}><span>{index % 3 === 0 ? <BookOpen size={30} /> : index % 3 === 1 ? <Target size={30} /> : <Lightbulb size={30} />}</span><strong>{chapter.subject || 'Curriculum'}</strong><h3>{chapter.title}</h3><small>{chapter.questions_count ?? 0} questions <i>/</i> {chapter.skills_count ?? 0} skills</small><button onClick={() => startDiagnostic(chapter.id)}>Start Test <ArrowRight size={15} /></button></article>)}</div> : <div className="assessment-empty">No curriculum units found. Explore Learn to find available topics.<button onClick={onNavigateToLearn}>Explore Learn <ArrowRight size={14} /></button></div>}
            </section>
            <section className="assessment-recommendations"><header><div><h2>Useful Next Steps</h2><p>Keep building understanding at your own pace.</p></div></header><div className="assessment-recommendation-grid"><button onClick={() => setTab('practice')}><span><Lightbulb size={20} /></span><div><strong>Practice a Topic</strong><small>Choose a unit for focused practice.</small></div><ArrowRight size={15} /></button><button onClick={() => startDiagnostic()}><span><Target size={20} /></span><div><strong>Take a Diagnostic</strong><small>Check current understanding.</small></div><ArrowRight size={15} /></button><button onClick={onNavigateToLearn}><span><TrendingUp size={20} /></span><div><strong>Explore Learning</strong><small>Review a unit before an assessment.</small></div><ArrowRight size={15} /></button></div></section>
          </>}

          {tab === 'practice' && <section className="assessment-recent-panel assessment-practice-panel"><header><div><h2>Practice Tests</h2><p>Select a subject and unit to launch a focused diagnostic.</p></div><select aria-label="Select a chapter" value={selectedChapter} onChange={event => setSelectedChapter(event.target.value)}><option value="">Choose a topic</option>{filteredChapters.map(chapter => <option key={chapter.id} value={chapter.id}>{chapter.subject}: {chapter.title}</option>)}</select></header><nav className="assessment-subject-filters" aria-label="Filter by subject">{subjectNames.map(subject => <button key={subject} className={selectedSubject === subject ? 'is-active' : ''} onClick={() => setSelectedSubject(subject)}>{subject}</button>)}</nav>{filteredChapters.length ? <div className="assessment-topic-list">{filteredChapters.map(chapter => <article key={chapter.id}><span><BookOpen size={20} /></span><div><strong>{chapter.title}</strong><small>{chapter.subject}{chapter.description ? ` ? ${chapter.description}` : ''}</small></div><button onClick={() => startDiagnostic(chapter.id)}>Start <ArrowRight size={15} /></button></article>)}</div> : <div className="assessment-empty">{loading ? 'Loading topics...' : 'No topics match your search.'}<button onClick={onNavigateToLearn}>Explore Learn <ArrowRight size={14} /></button></div>}</section>}

          {tab === 'past' && <section className="assessment-recent-panel"><header><div><h2>Past Attempts</h2><p>Review recorded assessments and retests.</p></div></header>{latestAttempts.length ? <div className="assessment-attempt-list">{latestAttempts.map(attempt => <article key={attempt.id}><span>{attempt.type === 'assessment' ? <CheckCircle2 size={18} /> : <TrendingUp size={18} />}</span><div><strong>{attempt.title}</strong><small>{attempt.type === 'assessment' ? 'Assessment' : 'Retest'} ? {new Date(attempt.timestamp).toLocaleString()}</small></div>{attempt.score_or_result && <em>{attempt.score_or_result}</em>}</article>)}</div> : <div className="assessment-empty">{loading ? 'Loading your attempt history...' : 'No assessment history is available yet. Start a diagnostic to begin.'}<button onClick={() => startDiagnostic()}>Start a diagnostic <ArrowRight size={14} /></button></div>}</section>}
        </div>

        <aside className="assessment-side-column">
          <section className="assessment-performance-panel"><header><h2>Your Performance</h2><button onClick={() => setTab('past')}>View Details <ArrowRight size={14} /></button></header><div className="assessment-performance-body"><div className="assessment-score-ring" style={{ background: ringBackground }}><div><strong>{progress?.score_percentage == null ? 'N/A' : `${Math.round(scorePercent)}%`}</strong><small>Overall<br />Score</small></div></div><ul><li><i />Correct <strong>{correctAttempts}</strong></li><li><i />Incorrect <strong>{incorrectAttempts}</strong></li><li><i />Attempts <strong>{totalAttempts}</strong></li></ul></div><p className="assessment-correct-note">{totalAttempts ? `${correctPercent}% of recorded responses are correct.` : 'Your results will appear after your first assessment.'}</p></section>
          <section className="assessment-side-list"><header><h2>Choose an Assessment</h2><button onClick={() => setTab('practice')}>View All <ArrowRight size={14} /></button></header>{chapters.slice(0, 4).map(chapter => <button key={chapter.id} onClick={() => startDiagnostic(chapter.id)}><span><BookOpen size={19} /></span><i><strong>{chapter.title}</strong><small>{chapter.subject} {chapter.questions_count ? `? ${chapter.questions_count} questions` : ''}</small></i><ArrowRight size={15} /></button>)}{!chapters.length && <p>No curriculum units available yet.</p>}</section>
          <section className="assessment-side-list assessment-history-list"><header><h2>Recent Performance</h2><button onClick={() => setTab('past')}>View All <ArrowRight size={14} /></button></header>{(progress?.recent_activity || []).slice(0, 3).map(attempt => <div key={attempt.id}><span><FileText size={18} /></span><i><strong>{attempt.title}</strong><small>{new Date(attempt.timestamp).toLocaleDateString()}</small></i>{attempt.score_or_result && <em>{attempt.score_or_result}</em>}</div>)}{!progress?.recent_activity.length && <p>Past scores will appear here when available.</p>}</section>
        </aside>
      </div>
    </div>
  );
};

export default AssessmentView;
