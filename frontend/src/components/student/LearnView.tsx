import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bell, Bookmark, BookOpen, Check, CheckCircle2, GitBranch, Infinity as InfinityIcon, Lightbulb, Search, Star, Target, TrendingUp, UploadCloud } from 'lucide-react';
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
      return matchesSearch && (statusFilter === 'All' || status === statusFilter);
    });
    if (activeTab === 'bookmarks') result = result.filter(topic => bookmarks.includes(topic.id));
    if (activeTab === 'recommended') result = result.filter(topic => (statuses[topic.id] || 'Not Started') !== 'Completed');
    if (activeTab === 'path') result = [...result].sort((a, b) => a.subject.localeCompare(b.subject) || a.title.localeCompare(b.title));
    return result;
  }, [topics, search, statuses, statusFilter, activeTab, bookmarks]);

  const tabs: { id: LearnTab; label: string; icon: typeof Target }[] = [
    { id: 'topics', label: 'Topics', icon: Target },
    { id: 'path', label: 'Learning Path', icon: GitBranch },
    { id: 'recommended', label: 'Recommended', icon: Star },
    { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
  ];
  const filters: ('All' | TopicStatus)[] = ['All', 'In Progress', 'Not Started', 'Completed'];

  return (
    <div className="learn-dashboard">
      <div className="learn-topbar">
        <label className="learn-global-search"><Search size={19} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search for topics, skills, or questions..." aria-label="Search learning topics" /></label>
        <button className="learn-notification" aria-label="Notifications"><Bell size={21} /><span /></button>
      </div>

      <header className="learn-heading">
        <div><span className="learn-eyebrow">EXPLORE AND LEARN</span><h1>Learn</h1><p>Personalized learning paths. Focused practice. Real understanding.</p></div>
        <blockquote>“Learn what you need.<br />When you need it.”</blockquote>
      </header>

      <nav className="learn-tabs" aria-label="Learning views" role="tablist">
        {tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={activeTab === id} className={`learn-tab${activeTab === id ? ' is-active' : ''}`} onClick={() => setActiveTab(id)}><Icon size={22} />{label}{id === 'bookmarks' && bookmarks.length > 0 && <span className="learn-tab-count">{bookmarks.length}</span>}</button>)}
      </nav>

      <section className="learn-browser" aria-label="Browse learning topics">
        <label className="learn-topic-search"><Search size={22} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search for topics, skills, or concepts..." aria-label="Filter topics" /></label>
        <div className="learn-filter-row" role="group" aria-label="Filter by progress">
          {filters.map(filter => <button type="button" key={filter} className={`learn-filter${statusFilter === filter ? ' is-active' : ''}`} aria-pressed={statusFilter === filter} onClick={() => setStatusFilter(filter)}>{filter}</button>)}
          <button type="button" className="learn-upload-link" onClick={onNavigateToUpload}><UploadCloud size={17} /> Add material</button>
        </div>

        <div className="learn-topic-list" aria-live="polite">
          {loading ? <div className="learn-empty">Loading your learning topics…</div> : visibleTopics.length === 0 ? (
            <div className="learn-empty"><BookOpen size={26} /><strong>{activeTab === 'bookmarks' ? 'No bookmarks yet' : 'No topics found'}</strong><span>{activeTab === 'bookmarks' ? 'Save a topic with the bookmark button and it will appear here.' : 'Try another search or progress filter, or add your own learning material.'}</span>{subjects.length === 0 && <button onClick={onNavigateToUpload}><UploadCloud size={16} /> Upload learning material</button>}</div>
          ) : visibleTopics.map((topic, index) => {
            const status = statuses[topic.id] || 'Not Started';
            const Icon = topicIcons[index % topicIcons.length];
            const bookmarked = bookmarks.includes(topic.id);
            const startTopic = () => { updateStatus(topic.id, 'In Progress'); onSelectChapter(topic); };
            return <article className="learn-topic-row" key={topic.id}>
              <span className="learn-topic-icon"><Icon size={27} strokeWidth={1.8} /></span>
              <div className="learn-topic-copy"><strong>{topic.title}</strong><span>{topic.skills_count ?? topic.questions_count ?? '—'} subtopics <i /> {topic.subject || 'Core'} <em className={`learn-status status-${status.toLowerCase().replace(' ', '-')}`}>{status}</em></span></div>
              <div className="learn-topic-actions">
                <button type="button" className={`learn-bookmark${bookmarked ? ' is-saved' : ''}`} aria-label={bookmarked ? `Remove ${topic.title} from bookmarks` : `Bookmark ${topic.title}`} aria-pressed={bookmarked} onClick={() => toggleBookmark(topic.id)}><Bookmark size={19} fill={bookmarked ? 'currentColor' : 'none'} /></button>
                {status === 'Completed' ? <button className="learn-start is-complete" onClick={startTopic}><CheckCircle2 size={17} /> Review</button> : <button className={`learn-start${status === 'In Progress' ? ' is-progress' : ''}`} onClick={startTopic}>{status === 'In Progress' ? 'Continue' : 'Start'} <ArrowRight size={17} /></button>}
                {status !== 'Completed' && <button type="button" className="learn-mark-done" title="Mark completed" aria-label={`Mark ${topic.title} completed`} onClick={() => updateStatus(topic.id, 'Completed')}><Check size={16} /></button>}
              </div>
            </article>;
          })}
        </div>
      </section>
    </div>
  );
};

export default LearnView;
