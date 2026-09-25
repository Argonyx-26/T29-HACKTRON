import React, { useEffect, useMemo, useState } from 'react';
import { learningRepository, LearnerProgressSummary } from '../../services/learningRepository';
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  Flame,
  Search,
  Target,
  TrendingUp,
  Bell,
  ChevronDown
} from 'lucide-react';

interface ProgressViewProps {
  userId: string;
  onNavigateToAssess: () => void;
  onNavigateToLearn: () => void;
}

type ProgressTab = 'overview' | 'skills' | 'assessments' | 'time';

export const ProgressView: React.FC<ProgressViewProps> = ({
  userId,
  onNavigateToAssess,
  onNavigateToLearn
}) => {
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

  return (
    <div className="min-h-screen bg-[#050505] text-[#f1f0f5] font-['Plus_Jakarta_Sans',sans-serif] pb-12 flex flex-col">
      <style>{`
        .stat-card-gradient {
          background: #0d0d12;
          border: 1px solid rgba(255, 255, 255, 0.07);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .stat-card-gradient:hover {
          border-color: rgba(147, 51, 234, 0.3);
        }
      `}</style>

      {/* Top Bar */}
      <header className="h-20 px-6 md:px-8 flex items-center justify-between border-b border-white/[0.06] bg-[#050505] sticky top-0 z-20">
        <div className="relative w-full max-w-xl">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-500">
            <Search size={16} />
          </span>
          <input
            className="w-full bg-[#121217] border border-white/10 rounded-full pl-10 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition shadow-inner"
            placeholder="Search for topics, skills, or questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
          />
        </div>

        <button className="relative p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/5 transition">
          <Bell size={20} className="text-purple-400" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full ring-2 ring-[#050505]" />
        </button>
      </header>

      {/* Body Area */}
      <div className="px-6 md:px-8 pt-8 space-y-6 max-w-[1400px] w-full mx-auto">
        {/* Header Banner */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold tracking-widest text-purple-400 uppercase mb-1">
              Track Your Journey
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">Your Progress</h1>
            <p className="text-xs text-zinc-400">See how far you've come and what's next.</p>
          </div>
          <div className="text-right pb-1">
            <p className="text-sm italic font-serif text-zinc-400">
              “Progress is a journey,<br className="hidden sm:inline" /> not a destination.”
            </p>
          </div>
        </section>

        {/* Tabs Nav */}
        <nav className="flex border-b border-white/[0.08] gap-8 text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 transition ${
              activeTab === 'overview'
                ? 'text-white border-b-2 border-purple-500 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`pb-2.5 transition ${
              activeTab === 'skills'
                ? 'text-white border-b-2 border-purple-500 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Subject Skills
          </button>
          <button
            onClick={() => setActiveTab('assessments')}
            className={`pb-2.5 transition ${
              activeTab === 'assessments'
                ? 'text-white border-b-2 border-purple-500 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Assessments
          </button>
          <button
            onClick={() => setActiveTab('time')}
            className={`pb-2.5 transition ${
              activeTab === 'time'
                ? 'text-white border-b-2 border-purple-500 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Learning Time
          </button>
        </nav>

        {/* Row 1: Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Topics Explored */}
          <div className="stat-card-gradient p-5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-purple-900/30 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <BookOpen size={20} />
              </div>
              <div>
                <p className="text-[11px] text-zinc-400">Topics Explored</p>
                <p className="text-2xl font-bold text-white leading-tight">12</p>
                <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-0.5 mt-0.5">
                  <span>↑</span> +3 this month
                </p>
              </div>
            </div>
          </div>

          {/* Assessments Taken */}
          <div className="stat-card-gradient p-5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-purple-900/30 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <ClipboardList size={20} />
              </div>
              <div>
                <p className="text-[11px] text-zinc-400">Assessments Taken</p>
                <p className="text-2xl font-bold text-white leading-tight">
                  {progress?.total_attempts || 8}
                </p>
                <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-0.5 mt-0.5">
                  <span>↑</span> +5 this month
                </p>
              </div>
            </div>
          </div>

          {/* Average Score */}
          <div className="stat-card-gradient p-5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-purple-900/30 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Target size={20} />
              </div>
              <div>
                <p className="text-[11px] text-zinc-400">Average Score</p>
                <p className="text-2xl font-bold text-white leading-tight">
                  {progress?.score_percentage != null ? `${progress.score_percentage}%` : '72%'}
                </p>
                <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-0.5 mt-0.5">
                  <span>↑</span> +11% improvement
                </p>
              </div>
            </div>
          </div>

          {/* Learning Streak */}
          <div className="stat-card-gradient p-5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-purple-900/30 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Flame size={20} />
              </div>
              <div>
                <p className="text-[11px] text-zinc-400">Learning Streak</p>
                <p className="text-2xl font-bold text-white leading-tight">6 days</p>
                <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Keep going!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Learning Activity Bar Chart (7 cols) */}
          <div className="lg:col-span-7 bg-[#0d0d12] border border-white/[0.07] rounded-2xl p-6 flex flex-col justify-between">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-white">Learning Activity</h2>
              <p className="text-xs text-zinc-400">Questions attempted over time.</p>
            </div>

            <div className="relative w-full h-44 flex items-end">
              <div className="flex flex-col justify-between h-36 text-[10px] text-zinc-500 pr-3 pb-6 select-none text-right">
                <span>50</span>
                <span>40</span>
                <span>20</span>
                <span>10</span>
                <span>0</span>
              </div>

              <div className="flex-1 h-36 flex flex-col justify-between border-b border-zinc-800 pb-2 relative">
                {/* Horizontal grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                  <div className="border-b border-zinc-700 w-full" />
                  <div className="border-b border-zinc-700 w-full" />
                  <div className="border-b border-zinc-700 w-full" />
                  <div className="border-b border-zinc-700 w-full" />
                </div>

                {/* Bars */}
                <div className="flex items-end justify-between h-full px-2 gap-1.5 z-10">
                  {[28, 22, 55, 32, 70, 48, 20, 38, 50, 85, 40, 65, 48, 22, 82, 30, 45, 68].map((h, i) => (
                    <div
                      key={i}
                      className="w-2.5 rounded-t bg-purple-600/90 hover:bg-purple-400 transition"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between text-[10px] text-zinc-500 pl-8 pr-2 pt-2">
              <span>Aug 25</span>
              <span>Aug 28</span>
              <span>Aug 31</span>
              <span>Sep 3</span>
              <span>Sep 6</span>
              <span>Sep 9</span>
              <span>Sep 12</span>
            </div>
          </div>

          {/* Subject Distribution Donut (5 cols) */}
          <div className="lg:col-span-5 bg-[#0d0d12] border border-white/[0.07] rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-sm font-semibold text-white">Subject Distribution</h2>
                <p className="text-xs text-zinc-400">Questions answered across areas.</p>
              </div>
            </div>

            <div className="flex items-center justify-around py-4">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" fill="transparent" r="38" stroke="#1f1d2b" strokeWidth="14" />
                  <circle cx="50" cy="50" fill="transparent" r="38" stroke="#9333ea" strokeDasharray="238.76" strokeDashoffset="0" strokeLinecap="round" strokeWidth="14" />
                  <circle cx="50" cy="50" fill="transparent" r="38" stroke="#a855f7" strokeDasharray="59.69 179.07" strokeDashoffset="-107.44" strokeWidth="14" />
                  <circle cx="50" cy="50" fill="transparent" r="38" stroke="#c084fc" strokeDasharray="35.81 202.95" strokeDashoffset="-167.13" strokeWidth="14" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-white">42</span>
                  <span className="text-[10px] text-zinc-400">Questions</span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 text-xs">
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                    <span className="text-zinc-300">Calculus</span>
                  </div>
                  <span className="font-semibold text-white">45%</span>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span className="text-zinc-300">Algebra</span>
                  </div>
                  <span className="font-semibold text-white">25%</span>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                    <span className="text-zinc-300">Functions</span>
                  </div>
                  <span className="font-semibold text-white">15%</span>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-300" />
                    <span className="text-zinc-300">Others</span>
                  </div>
                  <span className="font-semibold text-white">15%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Skill Mastery & Progress Over Time */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Skill Mastery List (5 cols) */}
          <div className="lg:col-span-5 bg-[#0d0d12] border border-white/[0.07] rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-white">Skill Mastery</h2>
                <button
                  onClick={onNavigateToLearn}
                  className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
                >
                  View All &rarr;
                </button>
              </div>
              <p className="text-xs text-zinc-400 mb-4">Your current understanding across key skills.</p>

              <div className="flex flex-col gap-3.5">
                {[
                  { symbol: 'f.', name: 'Functions', pct: 78 },
                  { symbol: '∞', name: 'Limits', pct: 62 },
                  { symbol: 'λ', name: 'Differentiation', pct: 58 },
                  { symbol: '∫', name: 'Integration', pct: 44 },
                  { symbol: '∠', name: 'Applications', pct: 68 },
                ].map(item => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md bg-purple-900/30 text-purple-300 font-mono text-xs flex items-center justify-center font-bold">
                      {item.symbol}
                    </div>
                    <div className="w-24 text-xs font-medium text-zinc-200">{item.name}</div>
                    <div className="flex-1 bg-zinc-800/80 rounded-full h-2 overflow-hidden">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${item.pct}%` }} />
                    </div>
                    <div className="w-9 text-right text-xs font-semibold text-zinc-300">{item.pct}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Progress Over Time SVG Line Graph (7 cols) */}
          <div className="lg:col-span-7 bg-[#0d0d12] border border-white/[0.07] rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-white">Progress Over Time</h2>
                <span className="text-xs text-zinc-400">Last 14 days</span>
              </div>
              <p className="text-xs text-zinc-400 mb-4">Your average score trend.</p>

              <div className="relative w-full h-44 flex items-end">
                <div className="flex flex-col justify-between h-36 text-[10px] text-zinc-500 pr-3 pb-4 select-none text-right">
                  <span>100</span>
                  <span>80</span>
                  <span>60</span>
                  <span>40</span>
                  <span>20</span>
                  <span>0</span>
                </div>

                <div className="flex-1 h-36 relative border-b border-zinc-800 pb-2">
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 500 130">
                    <defs>
                      <linearGradient id="purpleGradientArea" x1="0%" x2="0%" y1="0%" y2="100%">
                        <stop offset="0%" stopColor="#9333ea" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#9333ea" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Gridlines */}
                    <line opacity="0.3" stroke="#27272a" strokeDasharray="3,3" strokeWidth="1" x1="0" x2="500" y1="20" y2="20" />
                    <line opacity="0.3" stroke="#27272a" strokeDasharray="3,3" strokeWidth="1" x1="0" x2="500" y1="50" y2="50" />
                    <line opacity="0.3" stroke="#27272a" strokeDasharray="3,3" strokeWidth="1" x1="0" x2="500" y1="80" y2="80" />
                    <line opacity="0.3" stroke="#27272a" strokeDasharray="3,3" strokeWidth="1" x1="0" x2="500" y1="110" y2="110" />

                    {/* Gradient area */}
                    <path
                      d="M 0,105 C 40,95 65,95 90,80 C 120,65 140,82 170,82 C 195,82 215,70 240,65 C 275,60 295,65 320,55 C 350,45 375,40 400,25 C 435,20 465,30 500,20 L 500,130 L 0,130 Z"
                      fill="url(#purpleGradientArea)"
                    />

                    {/* Spline curve line */}
                    <path
                      d="M 0,105 C 40,95 65,95 90,80 C 120,65 140,82 170,82 C 195,82 215,70 240,65 C 275,60 295,65 320,55 C 350,45 375,40 400,25 C 435,20 465,30 500,20"
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="2.5"
                    />

                    {/* Points */}
                    {[
                      { x: 90, y: 80 },
                      { x: 170, y: 82 },
                      { x: 240, y: 65 },
                      { x: 320, y: 55 },
                      { x: 400, y: 25 },
                      { x: 500, y: 20 },
                    ].map((pt, idx) => (
                      <circle key={idx} cx={pt.x} cy={pt.y} fill="#9333ea" stroke="#ffffff" strokeWidth="1.5" r="3.5" />
                    ))}
                  </svg>
                </div>
              </div>

              <div className="flex justify-between text-[10px] text-zinc-500 pl-8 pr-2 pt-2">
                <span>Aug 25</span>
                <span>Aug 28</span>
                <span>Aug 31</span>
                <span>Sep 3</span>
                <span>Sep 6</span>
                <span>Sep 9</span>
                <span>Sep 12</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressView;
