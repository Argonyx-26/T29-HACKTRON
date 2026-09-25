import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bell, Bookmark, BookOpen, Check, CheckCircle2, GitBranch, Infinity as InfinityIcon, Lightbulb, Search, Star, Target, TrendingUp, UploadCloud, Sprout, ChevronRight, Pencil } from 'lucide-react';
import { Chapter, Subject } from '../../types';
import { apiClient } from '../../api/client';

type LearnTab = 'topics' | 'path' | 'recommended' | 'bookmarks';
type TopicStatus = 'Not Started' | 'In Progress' | 'Completed';
const STATUS_KEY = 'knowledge-twin-topic-status';
const BOOKMARK_KEY = 'knowledge-twin-topic-bookmarks';

const readStorage = <T,>(key: string, fallback: T): T => {
  try { const saved = localStorage.getItem(key); return saved ? JSON.parse(saved) as T : fallback; }
  catch { return fallback; }
};

const topicIcons = [BookOpen, TrendingUp, InfinityIcon, Target, GitBranch, Lightbulb];

export const LearnView: React.FC<{ onSelectChapter: (chapter: Chapter) => void; onNavigateToUpload: () => void; initialSearchQuery?: string }> = ({ onSelectChapter, onNavigateToUpload, initialSearchQuery = '' }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<LearnTab>('topics');
  const [activeSubject, setActiveSubject] = useState('All Subjects');
  const [statusFilter, setStatusFilter] = useState<'All' | TopicStatus>('All');
  const [search, setSearch] = useState(initialSearchQuery);
  const [statuses, setStatuses] = useState<Record<string, TopicStatus>>(() => readStorage(STATUS_KEY, {}));
  const [bookmarks, setBookmarks] = useState<string[]>(() => readStorage(BOOKMARK_KEY, []));

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const loadedSubjects = await apiClient.getSubjects();
        if (!alive) return;
        setSubjects(loadedSubjects);
        const results = await Promise.all(loadedSubjects.map(async subject => {
          try { return await apiClient.getSubjectChapters(subject.id); }
          catch { return []; }
        }));
        if (alive) setTopics(results.flat());
      } catch (error) {
        console.error('Failed to load learning topics', error);
      } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const updateStatus = (id: string, status: TopicStatus) => setStatuses(current => {
    const next = { ...current, [id]: status };
    localStorage.setItem(STATUS_KEY, JSON.stringify(next));
    return next;
  });

  const toggleBookmark = (id: string) => setBookmarks(current => {
    const next = current.includes(id) ? current.filter(item => item !== id) : [...current, id];
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next));
    return next;
  });

  const visibleTopics = useMemo(() => {
    let result = topics.filter(topic => {
      const query = search.trim().toLowerCase();
      const matchesSearch = !query || `${topic.title} ${topic.subject} ${topic.description || ''}`.toLowerCase().includes(query);
      const status = statuses[topic.id] || 'Not Started';
      return matchesSearch && (activeSubject === 'All Subjects' || topic.subject === activeSubject) && (statusFilter === 'All' || status === statusFilter);
    });
    if (activeTab === 'bookmarks') result = result.filter(topic => bookmarks.includes(topic.id));
    if (activeTab === 'recommended') result = result.filter(topic => (statuses[topic.id] || 'Not Started') !== 'Completed');
    if (activeTab === 'path') result = [...result].sort((a, b) => a.subject.localeCompare(b.subject) || a.title.localeCompare(b.title));
    return result;
  }, [topics, search, statuses, statusFilter, activeTab, bookmarks, activeSubject]);

  const tabs: { id: LearnTab; label: string; icon: typeof Target }[] = [
    { id: 'topics', label: 'Topics', icon: Target },
    { id: 'path', label: 'Learning Path', icon: GitBranch },
    { id: 'recommended', label: 'Recommended', icon: Star },
    { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
  ];
  const filters: ('All' | TopicStatus)[] = ['All', 'In Progress', 'Not Started', 'Completed'];

  const completedCount = topics.filter(topic => statuses[topic.id] === 'Completed').length;
  const inProgressCount = topics.filter(topic => statuses[topic.id] === 'In Progress').length;
  const progressPercent = topics.length ? Math.round(completedCount / topics.length * 100) : 0;
  const nextTopic = topics.find(topic => statuses[topic.id] === 'In Progress') || topics.find(topic => statuses[topic.id] !== 'Completed');
  const recommendedTopics = topics.filter(topic => statuses[topic.id] !== 'Completed').slice(0, 4);

  return (
    <div className="learn-dashboard">
      <div className="learn-topbar">
        <label className="learn-global-search"><Search size={19} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search for topics, skills, or questions..." aria-label="Search learning topics" /><kbd>Ctrl K</kbd></label>
        <button className="learn-notification" aria-label="Notifications"><Bell size={21} /><span /></button>
      </div>

      <header className="learn-heading">
        <div><span className="learn-eyebrow">LEARN</span><h1>Explore. Learn. Grow.</h1><p>Structured learning paths, curated topics, and focused practice.</p></div>
        <div className="learn-hero-art" aria-hidden="true"><div><BookOpen /><Sprout /><Pencil /></div><blockquote>&ldquo;Small steps<br />today, bigger<br />understanding<br />tomorrow.&rdquo;</blockquote></div>
      </header>

      <nav className="learn-tabs" aria-label="Learning views" role="tablist">
        {tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={activeTab === id} className={`learn-tab${activeTab === id ? ' is-active' : ''}`} onClick={() => setActiveTab(id)}><Icon size={20} />{label}{id === 'bookmarks' && bookmarks.length > 0 && <span className="learn-tab-count">{bookmarks.length}</span>}</button>)}
      </nav>

      <div className="learn-content-layout">
        <main className="learn-content-main">
          <section className="learn-subject-section">
            <header className="learn-section-heading"><div><h2>Subjects</h2><p>Choose a subject to explore topics and practice materials.</p></div></header>
            <div className="learn-subject-filters" aria-label="Filter by subject">
              <button className={activeSubject === 'All Subjects' ? 'is-active' : ''} onClick={() => setActiveSubject('All Subjects')}>All Subjects</button>
              {subjects.map(subject => <button key={subject.id} className={activeSubject === subject.name ? 'is-active' : ''} onClick={() => setActiveSubject(subject.name)}>{subject.name}</button>)}
            </div>
            <div className="learn-subject-grid">
              {subjects.filter(subject => activeSubject === 'All Subjects' || subject.name === activeSubject).slice(0, 4).map((subject, index) => {
                const subjectTopics = topics.filter(topic => topic.subject === subject.name);
                const done = subjectTopics.filter(topic => statuses[topic.id] === 'Completed').length;
                const pct = subjectTopics.length ? Math.round(done / subjectTopics.length * 100) : 0;
                const Icon = topicIcons[index % topicIcons.length];
                return <button type="button" className="learn-subject-card" key={subject.id} onClick={() => setActiveSubject(subject.name)}><span className="learn-subject-card-icon"><Icon size={34} strokeWidth={1.35} /></span><ChevronRight className="learn-subject-arrow" size={18} /><strong>{subject.name}</strong><small>{subjectTopics.length} {subjectTopics.length === 1 ? 'unit' : 'units'} <i>?</i> Curriculum topics</small><div className="learn-subject-progress"><span><i style={{ width: `${pct}%` }} /></span><b>{pct}% complete</b></div></button>;
              })}
              {!subjects.length && !loading && <p className="learn-empty">Subjects will appear as curriculum is added.</p>}
            </div>
          </section>

          <section className="learn-browser" aria-label="Browse learning topics">
            <header className="learn-section-heading"><div><h2>{activeTab === 'bookmarks' ? 'Saved Topics' : activeTab === 'recommended' ? 'Recommended Topics' : activeTab === 'path' ? 'Your Learning Path' : 'Topics'}</h2><p>Explore units, track your progress, and continue learning.</p></div><label className="learn-topic-search"><Search size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search topics..." aria-label="Filter topics" /></label></header>
            <div className="learn-filter-row" role="group" aria-label="Filter by progress">
              {filters.map(filter => <button type="button" key={filter} className={`learn-filter${statusFilter === filter ? ' is-active' : ''}`} aria-pressed={statusFilter === filter} onClick={() => setStatusFilter(filter)}>{filter}</button>)}
              <button type="button" className="learn-upload-link" onClick={onNavigateToUpload}><UploadCloud size={17} /> Add material</button>
            </div>

            <div className="learn-topic-list" aria-live="polite">
              {loading ? <div className="learn-empty">Loading your learning topics...</div> : visibleTopics.length === 0 ? (
                <div className="learn-empty"><BookOpen size={26} /><strong>{activeTab === 'bookmarks' ? 'No bookmarks yet' : 'No topics found'}</strong><span>{activeTab === 'bookmarks' ? 'Save a topic with the bookmark button and it will appear here.' : 'Try another search or progress filter, or add your own learning material.'}</span>{subjects.length === 0 && <button onClick={onNavigateToUpload}><UploadCloud size={16} /> Upload learning material</button>}</div>
              ) : visibleTopics.map((topic, index) => {
                const status = statuses[topic.id] || 'Not Started';
                const Icon = topicIcons[index % topicIcons.length];
                const bookmarked = bookmarks.includes(topic.id);
                const startTopic = () => { updateStatus(topic.id, 'In Progress'); onSelectChapter(topic); };
                return <article className="learn-topic-row" key={topic.id}>
                  <span className="learn-topic-icon"><Icon size={25} strokeWidth={1.6} /></span>
                  <div className="learn-topic-copy"><strong>{topic.title}</strong><span>{topic.skills_count ?? topic.questions_count ?? 0} subtopics <i /> {topic.subject || 'Core'} <em className={`learn-status status-${status.toLowerCase().replace(' ', '-')}`}>{status}</em></span></div>
                  <div className="learn-topic-actions">
                    <button type="button" className={`learn-bookmark${bookmarked ? ' is-saved' : ''}`} aria-label={bookmarked ? `Remove ${topic.title} from bookmarks` : `Bookmark ${topic.title}`} aria-pressed={bookmarked} onClick={() => toggleBookmark(topic.id)}><Bookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} /></button>
                    {status === 'Completed' ? <button className="learn-start is-complete" onClick={startTopic}><CheckCircle2 size={16} /> Review</button> : <button className={`learn-start${status === 'In Progress' ? ' is-progress' : ''}`} onClick={startTopic}>{status === 'In Progress' ? 'Continue' : 'Start'} <ArrowRight size={16} /></button>}
                    {status !== 'Completed' && <button type="button" className="learn-mark-done" title="Mark completed" aria-label={`Mark ${topic.title} completed`} onClick={() => updateStatus(topic.id, 'Completed')}><Check size={15} /></button>}
                  </div>
                </article>;
              })}
            </div>
          </section>

          <section className="learn-continue-card"><span><BookOpen size={25} /></span><div><strong>Continue Learning</strong><p>{nextTopic ? `${nextTopic.title} ? ${nextTopic.subject || 'Your curriculum'}` : 'Choose a topic to begin your learning path.'}</p></div><button disabled={!nextTopic} onClick={() => nextTopic && onSelectChapter(nextTopic)}>{nextTopic && statuses[nextTopic.id] === 'In Progress' ? 'Continue' : 'Start Learning'} <ArrowRight size={16} /></button></section>
        </main>

        <aside className="learn-content-aside">
          <section className="learn-side-panel"><header><h2>Your Learn Progress</h2><button onClick={() => setActiveTab('path')}>View all <ArrowRight size={14} /></button></header><div className="learn-progress-summary"><div className="learn-progress-ring" style={{ background: `conic-gradient(#34434c ${progressPercent}%, #e0e3e2 ${progressPercent}% 100%)` }}><div><strong>{progressPercent}%</strong><small>Complete</small></div></div><ul><li><i />{topics.length} Units</li><li><i />{inProgressCount} In Progress</li><li><i />{completedCount} Completed</li></ul></div>{subjects.slice(0, 5).map(subject => { const subjectTopics = topics.filter(topic => topic.subject === subject.name); const complete = subjectTopics.filter(topic => statuses[topic.id] === 'Completed').length; const pct = subjectTopics.length ? Math.round(complete / subjectTopics.length * 100) : 0; return <div className="learn-subject-progress-row" key={subject.id}><span>{subject.name}</span><strong>{pct}%</strong></div>; })}</section>
          <section className="learn-side-panel learn-recommended-panel"><header><div><h2>Recommended for You</h2><p>Pick up a useful next step.</p></div></header>{recommendedTopics.length ? recommendedTopics.map((topic, index) => { const Icon = topicIcons[index % topicIcons.length]; return <button key={topic.id} onClick={() => { updateStatus(topic.id, 'In Progress'); onSelectChapter(topic); }}><span><Icon size={22} /></span><i><strong>{topic.title}</strong><small>{topic.subject || 'Core curriculum'}{topic.skills_count ? ` ? ${topic.skills_count} subtopics` : ''}</small></i><ChevronRight size={17} /></button>; }) : <p className="learn-empty">Add curriculum topics to see recommendations.</p>}</section>
          <section className="learn-side-quote">&ldquo;Small steps today,<br />bigger understanding tomorrow.&rdquo;<span /></section>
        </aside>
      </div>
    </div>
  );
};

export default LearnView;
