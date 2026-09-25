import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  CheckCircle2,
  Clock,
  Compass,
  FileText
} from 'lucide-react';
import { Chapter, Subject } from '../../types';
import { apiClient } from '../../api/client';

interface LearnViewProps {
  onSelectChapter: (chapter: Chapter) => void;
  onNavigateToUpload: () => void;
  initialSearchQuery?: string;
}

export const LearnView: React.FC<LearnViewProps> = ({
  onSelectChapter,
  onNavigateToUpload,
  initialSearchQuery = ''
}) => {
  const [topics, setTopics] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearchQuery);
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed'>('all');

  // Standard stitch curriculum topics
  const defaultCurriculum: Chapter[] = [
    {
      id: 'chap-1',
      title: 'Functions and Graphs',
      subject: 'Mathematics',
      description: 'Cartesian coordinate systems, domain & range, symmetry, and transformations.',
      source_type: 'curriculum'
    },
    {
      id: 'chap-2',
      title: 'Limits and Continuity',
      subject: 'Mathematics',
      description: 'One-sided limits, squeeze theorem, infinite limits, and intermediate value theorem.',
      source_type: 'curriculum'
    },
    {
      id: 'chap-3',
      title: 'Differentiation',
      subject: 'Mathematics',
      description: 'Derivatives as rates of change, product and quotient rules, chain rule, implicit differentiation.',
      source_type: 'curriculum'
    },
    {
      id: 'chap-4',
      title: 'Integration',
      subject: 'Mathematics',
      description: 'Definite and indefinite integrals, fundamental theorem of calculus, substitution methods.',
      source_type: 'curriculum'
    },
    {
      id: 'chap-5',
      title: 'Applications of Calculus',
      subject: 'Mathematics',
      description: 'Optimization problems, related rates, curve sketching, and kinematic modeling.',
      source_type: 'curriculum'
    }
  ];

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const loaded = await apiClient.getChapters();
        if (loaded && loaded.length > 0) {
          setTopics(loaded);
        } else {
          setTopics(defaultCurriculum);
        }
      } catch (err) {
        setTopics(defaultCurriculum);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const metaByTitle: Record<string, { subtopics: number; tier: string; status: 'completed' | 'in-progress' | 'not-started'; pct?: number }> = {
    'Functions and Graphs': { subtopics: 12, tier: 'Foundation', status: 'completed', pct: 100 },
    'Limits and Continuity': { subtopics: 8, tier: 'Foundation', status: 'in-progress', pct: 68 },
    'Differentiation': { subtopics: 15, tier: 'Core', status: 'not-started' },
    'Integration': { subtopics: 14, tier: 'Core', status: 'not-started' },
    'Applications of Calculus': { subtopics: 10, tier: 'Advanced', status: 'not-started' }
  };

  const filteredTopics = useMemo(() => {
    return topics.filter(t => {
      const q = search.toLowerCase().trim();
      const matchesSearch = !q || t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q);
      const meta = metaByTitle[t.title] || { status: 'not-started' };
      const matchesFilter = filter === 'all' || meta.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [topics, search, filter]);

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] pb-12 flex flex-col">
      <div className="px-6 md:px-8 pt-8 space-y-6 max-w-[1400px] w-full mx-auto">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold tracking-widest text-purple-400 uppercase">
              Curriculum &amp; Topics
            </span>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight mt-1">
              Explore &amp; Master.
            </h1>
            <p className="text-xs text-neutral-400 mt-1.5 font-normal">
              Explore interactive chapters and follow your personalized cognitive trajectory.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topics, skills, or concepts..."
              className="w-full bg-[#0d0d12] border border-white/10 rounded-full pl-10 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 transition"
            />
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
              filter === 'all'
                ? 'bg-purple-900/60 text-white border border-purple-500/40 shadow-[0_0_12px_rgba(104,0,203,0.3)]'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            All Topics
          </button>
          <button
            onClick={() => setFilter('in-progress')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
              filter === 'in-progress'
                ? 'bg-purple-900/60 text-white border border-purple-500/40 shadow-[0_0_12px_rgba(104,0,203,0.3)]'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
              filter === 'completed'
                ? 'bg-purple-900/60 text-white border border-purple-500/40 shadow-[0_0_12px_rgba(104,0,203,0.3)]'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Completed
          </button>
        </div>

        {/* Adaptive Twin Recommendation Banner (Stitch Screen 0ff6e896325a4b96add0f33720a8705a) */}
        <div
          className="rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden"
          style={{
            backgroundColor: 'rgba(18, 17, 22, 0.75)',
            border: '1px solid rgba(104, 0, 203, 0.35)',
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.7), 0 0 20px rgba(104, 0, 203, 0.15)',
            backdropFilter: 'blur(14px)'
          }}
        >
          <div className="flex items-center gap-4 z-10">
            <div className="w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-purple-300 flex-shrink-0">
              <Sparkles size={24} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">
                Next Best Step
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Review Limits &amp; Continuity before moving to Differentiation.
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Your Knowledge Twin detected a minor prerequisite gap in rational limits that will optimize your calculus mastery.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const target = topics.find(t => t.title.includes('Limits')) || topics[1] || topics[0];
              if (target) onSelectChapter(target);
            }}
            className="flex-shrink-0 px-6 py-2.5 rounded-full bg-[#6800cb] hover:bg-[#7b14df] text-white text-xs font-semibold shadow-[0_0_20px_rgba(104,0,203,0.65)] transition flex items-center gap-2"
          >
            <span>Start Adaptive Session</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Topics List (Stitch Card Layout) */}
        <div className="space-y-4">
          {filteredTopics.map((topic) => {
            const meta = metaByTitle[topic.title] || { subtopics: 8, tier: 'General', status: 'not-started' };
            const isCompleted = meta.status === 'completed';
            const isInProgress = meta.status === 'in-progress';

            return (
              <div
                key={topic.id}
                className="group rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 border border-white/[0.08] hover:border-purple-500/40 bg-[#0d0d12]/90 hover:bg-[#12111a] shadow-lg"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-[#1b172a] border border-[#2d2547] flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform flex-shrink-0">
                    <BookOpen size={22} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                        {topic.title}
                      </h3>
                      {isCompleted && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold flex items-center gap-1">
                          <CheckCircle2 size={11} />
                          Completed
                        </span>
                      )}
                      {isInProgress && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-semibold">
                          {meta.pct}% completed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
                      <span>{meta.subtopics} subtopics</span>
                      <span>&bull;</span>
                      <span className="text-neutral-300">{meta.tier}</span>
                      {topic.description && (
                        <>
                          <span className="hidden sm:inline">&bull;</span>
                          <span className="hidden sm:inline truncate max-w-md">{topic.description}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <button
                    onClick={() => onSelectChapter(topic)}
                    className={`px-5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isInProgress
                        ? 'bg-[#6800cb] text-white shadow-[0_0_18px_rgba(104,0,203,0.5)] hover:bg-[#7b14df]'
                        : isCompleted
                        ? 'bg-white/10 hover:bg-white/20 text-white'
                        : 'bg-[#181822] hover:bg-[#222130] text-zinc-200 border border-white/10'
                    }`}
                  >
                    <span>{isCompleted ? 'Review' : isInProgress ? 'Continue' : 'Start'}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LearnView;
