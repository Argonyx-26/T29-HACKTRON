import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Lightbulb,
  Pencil,
  Search,
  Target,
  TrendingUp,
  Eye,
  Award,
  Compass
} from 'lucide-react';
import { Chapter, AssessmentReport } from '../../types';
import { apiClient } from '../../api/client';
import { learningRepository, LearnerProgressSummary } from '../../services/learningRepository';
import { DiagnosticRunner } from './DiagnosticRunner';
import { PastAttemptReportModal } from './PastAttemptReportModal';

type AssessmentTab = 'assessments' | 'practice' | 'past';

interface AssessmentViewProps {
  studentId: string;
  activeChapterId?: string;
  onAttemptCompleted: () => void;
  onNavigateToIntervention: (skillId: string, patternId: string, classification: string) => void;
  onNavigateToLearn: () => void;
  onNavigateToHome?: () => void;
}

export const AssessmentView: React.FC<AssessmentViewProps> = ({
  studentId,
  activeChapterId,
  onAttemptCompleted,
  onNavigateToIntervention,
  onNavigateToLearn,
  onNavigateToHome
}) => {
  const [tab, setTab] = useState<AssessmentTab>('assessments');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [progress, setProgress] = useState<LearnerProgressSummary | null>(null);
  const [reports, setReports] = useState<AssessmentReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<AssessmentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [selectedChapter, setSelectedChapter] = useState(activeChapterId || '');
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([
      apiClient.getChapters().catch(() => []),
      learningRepository.getProgress(studentId),
      learningRepository.getAssessmentReports(studentId).catch(() => [])
    ])
      .then(([loadedChapters, learnerProgress, loadedReports]) => {
        if (!active) return;
        setChapters(loadedChapters);
        setProgress(learnerProgress);
        setReports(loadedReports);

        if (activeChapterId) {
          setSelectedChapter(activeChapterId);
          setRunning(true);
        } else if (!selectedChapter && loadedChapters.length) {
          setSelectedChapter(loadedChapters[0].id);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [studentId, activeChapterId]);

  const filteredChapters = useMemo(
    () =>
      chapters.filter(
        (chapter) =>
          (selectedSubject === 'All Subjects' || chapter.subject === selectedSubject) &&
          `${chapter.title} ${chapter.subject} ${chapter.description || ''}`
            .toLowerCase()
            .includes(search.toLowerCase())
      ),
    [chapters, search, selectedSubject]
  );

  const filteredAttempts = useMemo(
    () =>
      (progress?.recent_activity || []).filter((item) =>
        `${item.title} ${item.score_or_result || ''}`.toLowerCase().includes(search.toLowerCase())
      ),
    [progress, search]
  );

  const filteredReports = useMemo(
    () =>
      reports.filter((r) =>
        `${r.chapter_title} ${r.score_percent}%`.toLowerCase().includes(search.toLowerCase())
      ),
    [reports, search]
  );

  const startDiagnostic = (chapterId?: string) => {
    setSelectedReport(null);
    const targetChapter = chapterId || selectedChapter || chapters[0]?.id;
    if (!targetChapter) {
      onNavigateToLearn();
      return;
    }
    setSelectedChapter(targetChapter);
    setRunning(true);
  };

  const handleAttemptComplete = () => {
    onAttemptCompleted();
    learningRepository.getProgress(studentId).then(setProgress);
    learningRepository.getAssessmentReports(studentId).then(setReports);
  };

  const availableSubjects = useMemo(() => {
    const map = new Map<string, { name: string; chapters: Chapter[]; totalQuestions: number; totalSkills: number }>();
    chapters.forEach((c) => {
      const sub = c.subject || 'General';
      if (!map.has(sub)) {
        map.set(sub, { name: sub, chapters: [], totalQuestions: 0, totalSkills: 0 });
      }
      const entry = map.get(sub)!;
      entry.chapters.push(c);
      entry.totalQuestions += c.questions_count || 0;
      entry.totalSkills += c.skills_count || 0;
    });
    return Array.from(map.values());
  }, [chapters]);

  if (running) {
    return (
      <div className="assessment-runner-shell">
        <button className="assessment-back" onClick={() => setRunning(false)}>
          <ArrowLeft size={16} /> Back to Assess
        </button>
        <DiagnosticRunner
          studentId={studentId}
          activeChapterId={selectedChapter}
          onAttemptCompleted={handleAttemptComplete}
          onNavigateToIntervention={onNavigateToIntervention}
        />
      </div>
    );
  }

  const tabs: { id: AssessmentTab; label: string; icon: typeof ClipboardCheck }[] = [
    { id: 'assessments', label: 'Assessments', icon: ClipboardCheck },
    { id: 'practice', label: 'Practice Tests', icon: Target },
    { id: 'past', label: 'Past Attempts', icon: ClipboardList }
  ];

  const totalAttempts = progress?.total_attempts || 0;
  const correctAttempts = progress?.correct_attempts || 0;
  const incorrectAttempts = Math.max(0, totalAttempts - correctAttempts);
  const correctPercent = totalAttempts ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
  const subjectNames = [
    'All Subjects',
    ...Array.from(new Set(chapters.map((chapter) => chapter.subject).filter(Boolean)))
  ];

  const latestAttempts = filteredAttempts.slice(0, tab === 'past' ? 8 : 4);
  const scorePercent = progress?.score_percentage ?? 0;
  const ringBackground = `conic-gradient(#34434c ${scorePercent}%, #e1e4e3 ${scorePercent}% 100%)`;

  const assessmentsTakenCount = reports.length > 0 ? reports.length : totalAttempts;

  return (
    <div className="assessment-dashboard">
      {onNavigateToHome && (
        <button type="button" className="page-back-button" onClick={onNavigateToHome}>
          <ArrowLeft size={15} /> Back to Dashboard
        </button>
      )}

      <header className="assessment-heading">
        <div>
          <span>ASSESS</span>
          <h1>Test. Understand. Improve.</h1>
          <p>Take assessments, get insights, and strengthen your concepts.</p>
        </div>
        <div className="assessment-hero-art" aria-hidden="true">
          <div>
            <ClipboardList />
            <BookOpen />
            <Pencil />
          </div>
          <blockquote>
            &ldquo;Small steps
            <br />
            today, bigger
            <br />
            understanding
            <br />
            tomorrow.&rdquo;
          </blockquote>
        </div>
      </header>

      <div className="assessment-main-grid">
        <div className="assessment-main-column">
          <nav className="assessment-tabs" role="tablist" aria-label="Assessment views">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                className={tab === id ? 'is-active' : ''}
                onClick={() => setTab(id)}
              >
                <Icon size={17} />
                {id === 'assessments'
                  ? 'All Assessments'
                  : id === 'practice'
                  ? 'Practice Tests'
                  : 'Past Attempts'}
                {id === 'past' && assessmentsTakenCount > 0 && <small>{assessmentsTakenCount}</small>}
              </button>
            ))}
          </nav>

          {tab === 'assessments' && (
            <>
              <section className="assessment-metrics">
                <article>
                  <span>
                    <ClipboardCheck size={25} />
                  </span>
                  <div>
                    <small>Assessments Taken</small>
                    <strong>{assessmentsTakenCount}</strong>
                    <p>Recorded papers & tests</p>
                  </div>
                </article>
                <article>
                  <span>
                    <Target size={25} />
                  </span>
                  <div>
                    <small>Average Score</small>
                    <strong>
                      {progress?.score_percentage == null
                        ? 'N/A'
                        : `${Math.round(progress.score_percentage)}%`}
                    </strong>
                    <p>Across your attempts</p>
                  </div>
                </article>
                <article>
                  <span>
                    <BookOpen size={25} />
                  </span>
                  <div>
                    <small>Skills Assessed</small>
                    <strong>{progress?.assessed_skills_count || 0}</strong>
                    <p>With recorded evidence</p>
                  </div>
                </article>
                <article>
                  <span>
                    <TrendingUp size={25} />
                  </span>
                  <div>
                    <small>Available Units</small>
                    <strong>{chapters.length}</strong>
                    <p>Ready to practice</p>
                  </div>
                </article>
              </section>

              <section className="assessment-subject-section">
                <header>
                  <div>
                    <h2>Available Subjects & Curriculum Assessments</h2>
                    <p>Select a subject to explore its diagnostic tests, or start an assessment below.</p>
                  </div>
                  {selectedSubject !== 'All Subjects' && (
                    <button onClick={() => setSelectedSubject('All Subjects')}>
                      Show All Subjects <ArrowRight size={14} />
                    </button>
                  )}
                </header>

                {/* Available Subjects Overview Cards */}
                {selectedSubject === 'All Subjects' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                    {availableSubjects.map((sub, index) => {
                      const Icon = index % 5 === 0 ? BookOpen : index % 5 === 1 ? Target : index % 5 === 2 ? Lightbulb : index % 5 === 3 ? TrendingUp : Compass;
                      return (
                        <div
                          key={sub.name}
                          onClick={() => setSelectedSubject(sub.name)}
                          style={{
                            padding: '12px 14px',
                            background: 'rgba(255, 255, 255, 0.5)',
                            border: '1px solid #cbd0d1',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '5px',
                              background: '#303a41',
                              color: '#ffffff',
                              display: 'grid',
                              placeItems: 'center'
                            }}>
                              <Icon size={16} />
                            </span>
                            <span style={{ fontSize: '10px', fontWeight: 600, color: '#46535a', background: 'rgba(0,0,0,0.04)', padding: '2px 6px', borderRadius: '4px' }}>
                              {sub.chapters.length} {sub.chapters.length === 1 ? 'Topic' : 'Topics'}
                            </span>
                          </div>
                          <div>
                            <h3 style={{ margin: '4px 0 1px', fontSize: '13px', fontWeight: 700, color: '#17232c' }}>{sub.name}</h3>
                            <small style={{ color: '#616c73', fontSize: '10px' }}>
                              {sub.totalQuestions} questions · {sub.totalSkills} skills
                            </small>
                          </div>
                          <div style={{ marginTop: 'auto', paddingTop: '6px', borderTop: '1px solid #e2e5e7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', fontWeight: 600, color: '#303a41' }}>
                            <span>View Tests</span>
                            <ArrowRight size={12} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <nav className="assessment-subject-filters" aria-label="Filter by subject">
                  {subjectNames.map((subject) => (
                    <button
                      key={subject}
                      className={selectedSubject === subject ? 'is-active' : ''}
                      onClick={() => setSelectedSubject(subject)}
                    >
                      {subject}
                    </button>
                  ))}
                </nav>
                {loading ? (
                  <div className="assessment-empty">Loading your curriculum...</div>
                ) : filteredChapters.length ? (
                  <div className="assessment-curriculum-grid">
                    {filteredChapters.map((chapter, index) => (
                      <article key={chapter.id}>
                        <span>
                          {index % 3 === 0 ? (
                            <BookOpen size={30} />
                          ) : index % 3 === 1 ? (
                            <Target size={30} />
                          ) : (
                            <Lightbulb size={30} />
                          )}
                        </span>
                        <strong>{chapter.subject || 'Curriculum'}</strong>
                        <h3>{chapter.title}</h3>
                        <small>
                          {chapter.questions_count ?? 0} questions <i>/</i> {chapter.skills_count ?? 0}{' '}
                          skills
                        </small>
                        <button onClick={() => startDiagnostic(chapter.id)}>
                          Start Test <ArrowRight size={15} />
                        </button>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="assessment-empty">
                    No curriculum units found for {selectedSubject}.
                    <button onClick={() => setSelectedSubject('All Subjects')}>
                      Show All Subjects <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </section>

              <section className="assessment-recommendations">
                <header>
                  <div>
                    <h2>Useful Next Steps</h2>
                    <p>Keep building understanding at your own pace.</p>
                  </div>
                </header>
                <div className="assessment-recommendation-grid">
                  <button onClick={() => setTab('practice')}>
                    <span>
                      <Lightbulb size={20} />
                    </span>
                    <div>
                      <strong>Practice a Topic</strong>
                      <small>Choose a unit for focused practice.</small>
                    </div>
                    <ArrowRight size={15} />
                  </button>
                  <button onClick={() => startDiagnostic()}>
                    <span>
                      <Target size={20} />
                    </span>
                    <div>
                      <strong>Take a Diagnostic</strong>
                      <small>Check current understanding.</small>
                    </div>
                    <ArrowRight size={15} />
                  </button>
                  <button onClick={onNavigateToLearn}>
                    <span>
                      <TrendingUp size={20} />
                    </span>
                    <div>
                      <strong>Explore Learning</strong>
                      <small>Review a unit before an assessment.</small>
                    </div>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </section>
            </>
          )}

          {tab === 'practice' && (
            <section className="assessment-recent-panel assessment-practice-panel">
              <header>
                <div>
                  <h2>Practice Tests</h2>
                  <p>Select a subject and unit to launch a focused diagnostic.</p>
                </div>
                <select
                  aria-label="Select a chapter"
                  value={selectedChapter}
                  onChange={(event) => setSelectedChapter(event.target.value)}
                >
                  <option value="">Choose a topic</option>
                  {filteredChapters.map((chapter) => (
                    <option key={chapter.id} value={chapter.id}>
                      {chapter.subject}: {chapter.title}
                    </option>
                  ))}
                </select>
              </header>
              <nav className="assessment-subject-filters" aria-label="Filter by subject">
                {subjectNames.map((subject) => (
                  <button
                    key={subject}
                    className={selectedSubject === subject ? 'is-active' : ''}
                    onClick={() => setSelectedSubject(subject)}
                  >
                    {subject}
                  </button>
                ))}
              </nav>
              {filteredChapters.length ? (
                <div className="assessment-topic-list">
                  {filteredChapters.map((chapter) => (
                    <article key={chapter.id}>
                      <span>
                        <BookOpen size={20} />
                      </span>
                      <div>
                        <strong>{chapter.title}</strong>
                        <small>
                          {chapter.subject}
                          {chapter.description ? ` • ${chapter.description}` : ''}
                        </small>
                      </div>
                      <button onClick={() => startDiagnostic(chapter.id)}>
                        Start <ArrowRight size={15} />
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="assessment-empty">
                  {loading ? 'Loading topics...' : 'No topics match your search.'}
                  <button onClick={onNavigateToLearn}>
                    Explore Learn <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </section>
          )}

          {tab === 'past' && (
            <section className="assessment-recent-panel">
              <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2>Past Assessment Papers ({reports.length})</h2>
                  <p>Review completed tests, step-by-step solutions, accuracy, and cognitive reports.</p>
                </div>
                {reports.length > 0 && (
                  <button
                    onClick={() => startDiagnostic()}
                    className="purple-glow-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg"
                  >
                    <span>New Test</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </header>

              {filteredReports.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                  {filteredReports.map((rep) => {
                    const isPassed = rep.score_percent >= 80;
                    const isBorderline = rep.score_percent >= 50 && rep.score_percent < 80;
                    const dateStr = rep.created_at
                      ? new Date(rep.created_at).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })
                      : 'Completed Assessment';

                    return (
                      <article
                        key={rep.id}
                        onClick={() => setSelectedReport(rep)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '16px 20px',
                          borderRadius: '10px',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          gap: '16px',
                          flexWrap: 'wrap',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f8fafc';
                          e.currentTarget.style.borderColor = '#94a3b8';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#ffffff';
                          e.currentTarget.style.borderColor = '#cbd5e1';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 300px' }}>
                          <span
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: isPassed
                                ? 'rgba(16, 185, 129, 0.12)'
                                : isBorderline
                                ? 'rgba(245, 158, 11, 0.12)'
                                : 'rgba(239, 68, 68, 0.12)',
                              color: isPassed ? '#059669' : isBorderline ? '#d97706' : '#dc2626',
                              border: `1px solid ${
                                isPassed
                                  ? 'rgba(16, 185, 129, 0.3)'
                                  : isBorderline
                                  ? 'rgba(245, 158, 11, 0.3)'
                                  : 'rgba(239, 68, 68, 0.3)'
                              }`
                            }}
                          >
                            <FileText size={20} />
                          </span>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <strong style={{ fontSize: '0.98rem', color: '#0f172a', fontWeight: 700 }}>
                              {rep.chapter_title}
                            </strong>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                flexWrap: 'wrap',
                                fontSize: '0.78rem',
                                color: '#475569'
                              }}
                            >
                              <span>{dateStr}</span>
                              <span>•</span>
                              <span style={{ color: '#334155', fontWeight: 600 }}>{rep.total_questions} Questions</span>
                              <span>•</span>
                              <span style={{ color: '#334155' }}>{rep.attempted_count} Attempted</span>
                              <span>•</span>
                              <span style={{ color: '#059669', fontWeight: 600 }}>{rep.correct_count} Correct</span>
                              {rep.incorrect_count > 0 && (
                                <>
                                  <span>•</span>
                                  <span style={{ color: '#dc2626' }}>{rep.incorrect_count} Incorrect</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span
                            style={{
                              padding: '6px 14px',
                              borderRadius: '20px',
                              fontWeight: 800,
                              fontSize: '0.92rem',
                              background: isPassed
                                ? 'rgba(16, 185, 129, 0.15)'
                                : isBorderline
                                ? 'rgba(245, 158, 11, 0.15)'
                                : 'rgba(239, 68, 68, 0.15)',
                              color: isPassed ? '#4edea3' : isBorderline ? '#fbbf24' : '#ffb4ab',
                              border: `1px solid ${
                                isPassed
                                  ? 'rgba(78, 222, 163, 0.35)'
                                  : isBorderline
                                  ? 'rgba(245, 158, 11, 0.35)'
                                  : 'rgba(255, 180, 171, 0.35)'
                              }`
                            }}
                          >
                            {rep.score_percent}% Score
                          </span>

                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReport(rep);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '0.82rem',
                              padding: '8px 14px'
                            }}
                          >
                            <Eye size={14} />
                            <span>View Paper & Report</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : latestAttempts.length ? (
                <div className="assessment-attempt-list" style={{ marginTop: '16px' }}>
                  {latestAttempts.map((attempt) => (
                    <article key={attempt.id}>
                      <span>
                        {attempt.type === 'assessment' ? (
                          <CheckCircle2 size={18} />
                        ) : (
                          <TrendingUp size={18} />
                        )}
                      </span>
                      <div>
                        <strong>{attempt.title}</strong>
                        <small>
                          {attempt.type === 'assessment' ? 'Diagnostic Question' : 'Retest'} •{' '}
                          {new Date(attempt.timestamp).toLocaleString()}
                        </small>
                      </div>
                      {attempt.score_or_result && <em>{attempt.score_or_result}</em>}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="assessment-empty">
                  {loading
                    ? 'Loading your attempt history...'
                    : 'No past assessment papers found yet. Start a diagnostic test to begin.'}
                  <button onClick={() => startDiagnostic()}>
                    Start a diagnostic <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="assessment-side-column">
          <section className="assessment-performance-panel">
            <header>
              <h2>Your Performance</h2>
              <button onClick={() => setTab('past')}>
                View Details <ArrowRight size={14} />
              </button>
            </header>
            <div className="assessment-performance-body">
              <div className="assessment-score-ring" style={{ background: ringBackground }}>
                <div>
                  <strong>
                    {progress?.score_percentage == null
                      ? 'N/A'
                      : `${Math.round(scorePercent)}%`}
                  </strong>
                  <small>
                    Overall
                    <br />
                    Score
                  </small>
                </div>
              </div>
              <ul>
                <li>
                  <i />
                  Correct <strong>{correctAttempts}</strong>
                </li>
                <li>
                  <i />
                  Incorrect <strong>{incorrectAttempts}</strong>
                </li>
                <li>
                  <i />
                  Attempts <strong>{totalAttempts}</strong>
                </li>
              </ul>
            </div>
            <p className="assessment-correct-note">
              {totalAttempts
                ? `${correctPercent}% of recorded responses are correct.`
                : 'Your results will appear after your first assessment.'}
            </p>
          </section>

          <section className="assessment-side-list">
            <header>
              <h2>Choose an Assessment</h2>
              <button onClick={() => setTab('practice')}>
                View All <ArrowRight size={14} />
              </button>
            </header>
            {chapters.slice(0, 4).map((chapter) => (
              <button key={chapter.id} onClick={() => startDiagnostic(chapter.id)}>
                <span>
                  <BookOpen size={19} />
                </span>
                <i>
                  <strong>{chapter.title}</strong>
                  <small>
                    {chapter.subject}{' '}
                    {chapter.questions_count ? `• ${chapter.questions_count} questions` : ''}
                  </small>
                </i>
                <ArrowRight size={15} />
              </button>
            ))}
            {!chapters.length && <p>No curriculum units available yet.</p>}
          </section>

          <section className="assessment-side-list assessment-history-list">
            <header>
              <h2>Recent Performance</h2>
              <button onClick={() => setTab('past')}>
                View All <ArrowRight size={14} />
              </button>
            </header>
            {reports.length > 0 ? (
              reports.slice(0, 3).map((rep) => (
                <div
                  key={rep.id}
                  onClick={() => setSelectedReport(rep)}
                  style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                  title="Click to view full paper and report"
                >
                  <span>
                    <FileText size={18} />
                  </span>
                  <i>
                    <strong>{rep.chapter_title}</strong>
                    <small>
                      {rep.created_at ? new Date(rep.created_at).toLocaleDateString() : 'Assessment'} •{' '}
                      {rep.correct_count}/{rep.total_questions} correct
                    </small>
                  </i>
                  <em>{rep.score_percent}%</em>
                </div>
              ))
            ) : (progress?.recent_activity || []).slice(0, 3).map((attempt) => (
              <div key={attempt.id}>
                <span>
                  <FileText size={18} />
                </span>
                <i>
                  <strong>{attempt.title}</strong>
                  <small>{new Date(attempt.timestamp).toLocaleDateString()}</small>
                </i>
                {attempt.score_or_result && <em>{attempt.score_or_result}</em>}
              </div>
            ))}
            {!reports.length && !progress?.recent_activity.length && (
              <p>Past scores will appear here when available.</p>
            )}
          </section>
        </aside>
      </div>

      {/* Full Test Paper Report Modal */}
      {selectedReport && (
        <PastAttemptReportModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onNavigateToIntervention={onNavigateToIntervention}
          onRetakeTopic={(chapId) => {
            setSelectedReport(null);
            startDiagnostic(chapId);
          }}
        />
      )}
    </div>
  );
};

export default AssessmentView;
