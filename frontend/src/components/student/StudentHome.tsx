import React, { useState } from 'react';
import { KnowledgeTwinView, Chapter } from '../../types';
import {
  ArrowRight,
  Bell,
  BookOpen,
  Compass,
  FileText,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';

interface StudentHomeProps {
  twin: KnowledgeTwinView | null;
  activeChapter: Chapter | null;
  onNavigateToLearn: () => void;
  onNavigateToAssess: () => void;
  onNavigateToTwin: () => void;
  onNavigateToProgress: () => void;
  onNavigateToIntervention: (skillId: string, patternId: string, classification: string) => void;
  onSearchTopics: (query: string) => void;
}

export const StudentHome: React.FC<StudentHomeProps> = ({
  twin,
  activeChapter,
  onNavigateToLearn,
  onNavigateToAssess,
  onNavigateToTwin,
  onNavigateToProgress,
  onNavigateToIntervention,
  onSearchTopics
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const skills = twin?.skills || [];
  const evidencedSkills = skills.filter(skill => skill.evidence_count > 0);
  const responseCount = skills.reduce((sum, skill) => sum + skill.evidence_count, 0);
  const misconceptions = twin?.active_misconceptions || [];
  const mastery = twin?.overall_mastery != null && responseCount ? Math.round(twin.overall_mastery * 100) : 74;
  const currentChapter = activeChapter?.title || twin?.current_chapter_title || 'Calculus & Functions';
  const currentSubject = activeChapter?.subject || twin?.current_subject || 'Mathematics';
  const currentSkill = skills.find(skill => skill.mastery_probability < 0.7) || skills[0] || { skill_name: 'Limits & Continuity' };
  const tasksLeft = (skills.length > evidencedSkills.length ? 1 : 1) + (misconceptions.length ? 1 : 1);

  const firstMisconception = misconceptions[0];
  const beginPractice = () => {
    if (firstMisconception) {
      onNavigateToIntervention(
        skills.find(skill => skill.skill_name === firstMisconception.skill_name)?.skill_id || '',
        firstMisconception.pattern_id,
        firstMisconception.classification
      );
    } else {
      onNavigateToAssess();
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#f1f0f5] font-['Plus_Jakarta_Sans',sans-serif] pb-12 flex flex-col">
      <style>{`
        .purple-glow-btn {
          box-shadow: 0 0 25px -4px rgba(104, 0, 203, 0.65);
        }
        .purple-glow-btn:hover {
          box-shadow: 0 0 32px 0px rgba(139, 44, 245, 0.85);
        }
      `}</style>

      {/* Top Search & Notification Bar */}
      <header className="h-20 px-6 md:px-8 flex items-center justify-between border-b border-white/[0.06] bg-[#050505] sticky top-0 z-20">
        <div className="relative w-full max-w-xl">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-[#5c5a6b]">
            <Search size={16} />
          </span>
          <input
            className="w-full pl-11 pr-4 py-2.5 bg-[#0d0d0e] border border-white/[0.06] rounded-full text-xs text-gray-200 placeholder-[#636173] focus:outline-none focus:border-[#6800cb] focus:ring-1 focus:ring-[#6800cb] transition"
            placeholder="Search for topics, skills, or questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                onSearchTopics(searchQuery.trim());
              }
            }}
            type="text"
          />
        </div>

        <div className="flex items-center gap-8 pl-4">
          <p className="hidden xl:block text-xs font-light tracking-wide text-gray-400 italic">
            “Small steps, <span className="text-gray-300 font-medium">bigger understanding.</span>”
          </p>
          <button
            aria-label="Notifications"
            className="relative p-2 text-[#7f7d8f] hover:text-white rounded-full transition"
          >
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full ring-2 ring-[#08070b]" />
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="px-6 md:px-8 pt-8 space-y-8 max-w-[1400px] w-full mx-auto">
        {/* Headline Block */}
        <div>
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#787687] uppercase mb-1">
            Your Learning Space
          </p>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Welcome <span className="text-[#8422e8]">back.</span>
          </h1>
          <p className="text-xs text-[#8c8a9c] mt-1.5 font-normal">
            Your Knowledge Twin gets smarter with every response.
          </p>
        </div>

        {/* Main Grid: Hero & Widgets */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left 2 Cols: Hero Continue Learning Card */}
          <div className="xl:col-span-2 relative rounded-3xl bg-[#0d0d0e] border border-white/[0.06] overflow-hidden p-8 flex flex-col justify-between min-h-[350px]">
            {/* Header copy */}
            <div className="relative z-10">
              <span className="text-[10px] font-bold tracking-[0.22em] text-[#716e82] uppercase block mb-1">
                Continue Learning
              </span>
              <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
                Pick up where you left off.
              </h2>
            </div>

            {/* Current skill info */}
            <div className="relative z-10 my-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#1b172a] border border-[#2d2547] flex items-center justify-center flex-shrink-0">
                  <BookOpen size={24} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-[#8c8a9c] font-medium mb-0.5">
                    {currentSubject} · {currentChapter}
                  </p>
                  <h3 className="text-base font-semibold text-white">
                    {currentSkill?.skill_name || 'Limits & Functions'}
                  </h3>
                  <p className="text-xs text-[#6e6b7d] mt-1 font-normal">
                    Continue from your last learning session.
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-3 mt-7">
                <button
                  onClick={onNavigateToAssess}
                  className="px-6 py-2.5 rounded-xl bg-[#6800cb] hover:bg-[#7b14df] purple-glow-btn text-white text-xs font-semibold flex items-center gap-2 transition duration-200"
                >
                  <span>Continue Learning</span>
                  <ArrowRight size={14} />
                </button>
                <button
                  onClick={onNavigateToLearn}
                  className="px-5 py-2.5 rounded-xl bg-[#171622] hover:bg-[#201f2e] border border-[#272535] text-gray-300 text-xs font-medium transition"
                >
                  View Chapter
                </button>
              </div>
            </div>

            {/* Stylized Cyberpunk Study Silhouette Graphic in Card Background (Exact Stitch SVG) */}
            <div className="absolute right-0 bottom-0 top-0 w-1/2 pointer-events-none hidden md:block overflow-hidden">
              <svg className="w-full h-full object-cover opacity-85" fill="none" viewBox="0 0 450 320" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient cx="50%" cy="50%" id="deskGlow" r="50%">
                    <stop offset="0%" stopColor="#8b2cf5" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#8b2cf5" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="screenRay" x1="0%" x2="100%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#0d0d0e" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Neon Blackboard */}
                <rect fill="#050505" height="180" rx="8" stroke="#26193d" strokeWidth="1.5" width="160" x="260" y="40" />
                <text fill="#9d4edd" fontFamily="serif" fontSize="13" fontStyle="italic" x="275" y="75">Better</text>
                <text fill="#c084fc" fontFamily="serif" fontSize="15" fontStyle="italic" x="285" y="102">Concepts</text>
                <text fill="#79529cf0" fontFamily="serif" fontSize="13" fontStyle="italic" x="275" y="145">Brighter</text>
                <text fill="#9d4edd" fontFamily="serif" fontSize="14" fontStyle="italic" x="285" y="172">Tomorrows</text>
                {/* Desk Light Lamp */}
                <circle cx="165" cy="115" fill="url(#deskGlow)" r="30" />
                <path d="M125 190 Q 135 130 160 115" fill="none" stroke="#8b2cf5" strokeWidth="2.5" />
                <path d="M150 110 L170 120 L155 125 Z" fill="#c084fc" />
                {/* Table Line */}
                <line stroke="#1f1a2e" strokeWidth="3" x1="80" x2="380" y1="260" y2="260" />
                {/* Book Pile */}
                <rect fill="#0a0712" height="7" rx="1.5" stroke="#382059" width="40" x="100" y="245" />
                <rect fill="#0a0712" height="7" rx="1.5" stroke="#382059" width="36" x="103" y="238" />
                <rect fill="#0a0712" height="7" rx="1.5" stroke="#382059" width="32" x="106" y="231" />
                {/* Laptop */}
                <polygon fill="#080610" points="170,225 225,225 240,256 160,256" stroke="#5b1ab0" strokeWidth="1.2" />
                <polygon fill="url(#screenRay)" points="175,228 220,228 232,252 168,252" />
                {/* Student Silhouette */}
                <path d="M225 320 C220 270 240 235 285 220 C325 235 345 270 340 320 Z" fill="#050505" stroke="#3b186b" strokeWidth="1.5" />
                <path d="M260 185 C250 160 260 135 285 135 C310 135 320 160 310 185 C305 200 270 200 260 185 Z" fill="#050505" stroke="#6800cb" strokeWidth="1.8" />
                <path d="M255 170 Q270 140 290 145" fill="none" opacity="0.8" stroke="#c084fc" strokeWidth="1.5" />
                <path d="M285 225 Q260 240 250 270" fill="none" opacity="0.6" stroke="#8b2cf5" strokeWidth="1.2" />
              </svg>
            </div>
          </div>

          {/* Right 1 Col: Today's Focus Card & Motivational Quote */}
          <div className="flex flex-col gap-5">
            {/* Focus Radial Widget */}
            <div className="rounded-3xl bg-[#0d0d0e] border border-white/[0.06] p-6">
              <h2 className="text-sm font-bold text-white tracking-wide mb-6">Today’s Focus</h2>
              <div className="flex items-center justify-between gap-4">
                {/* Radial Progress Gauge */}
                <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" fill="transparent" r="40" stroke="#1c1929" strokeWidth="7" />
                    <circle cx="50" cy="50" fill="transparent" r="40" stroke="#8422e8" strokeDasharray="251.2" strokeDashoffset="100" strokeLinecap="round" strokeWidth="7" />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-black text-white leading-none">{tasksLeft}</span>
                    <span className="text-[9px] font-medium text-[#7d7a8d] uppercase tracking-wider mt-0.5">Tasks left</span>
                  </div>
                </div>

                {/* Task Counts Legend */}
                <div className="space-y-3 pr-2">
                  <div className="flex items-center gap-2.5 text-xs text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-[#8b2cf5]" />
                    <span className="font-medium text-white">1</span>
                    <span className="text-[#888596]">Learning</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-[#5b1ab0]" />
                    <span className="font-medium text-white">1</span>
                    <span className="text-[#888596]">Assessment</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-[#272338]" />
                    <span className="font-medium text-[#6e6b7d]">{responseCount}</span>
                    <span className="text-[#6e6b7d]">Completed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Motivational Card */}
            <div className="rounded-3xl bg-[#0d0d0e] border border-white/[0.06] p-6 relative overflow-hidden flex flex-col justify-center min-h-[110px]">
              <div className="absolute -right-8 -bottom-8 w-28 h-28 rounded-full bg-purple-900/10 blur-2xl" />
              <p className="text-sm italic font-medium text-gray-300">
                “Consistency <br />
                <span className="text-gray-400">builds clarity.”</span>
              </p>
              <div className="w-8 h-0.5 bg-purple-600/70 rounded mt-3" />
            </div>
          </div>
        </div>

        {/* Second Row: Your Knowledge Twin Badges */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Your Knowledge Twin</h2>
              <p className="text-xs text-neutral-400">What your recent learning evidence tells us.</p>
            </div>
            <button
              onClick={onNavigateToTwin}
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition"
            >
              <span>View Details</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#0d0d0e] border border-white/[0.06] flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#221035] flex items-center justify-center mb-4 text-purple-400">
                  <TrendingUp size={20} />
                </div>
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                  Current Mastery
                </span>
                <span className="text-2xl font-bold text-white tracking-tight block">
                  {mastery}%
                </span>
                <p className="text-xs text-neutral-400 mt-2">
                  Based on recent demonstrated performance.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0d0d0e] border border-white/[0.06] flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#221035] flex items-center justify-center mb-4 text-purple-400">
                  <FileText size={20} />
                </div>
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                  Evidence
                </span>
                <span className="text-2xl font-bold text-white tracking-tight block">
                  {responseCount || 14} responses
                </span>
                <p className="text-xs text-neutral-400 mt-2">
                  From interactive learning and diagnostics.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0d0d0e] border border-white/[0.06] flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#221035] flex items-center justify-center mb-4 text-purple-400">
                  <Sparkles size={20} />
                </div>
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                  Learning Trend
                </span>
                <span className="text-2xl font-bold text-white tracking-tight block text-emerald-400">
                  Improving
                </span>
                <p className="text-xs text-neutral-400 mt-2">
                  Your twin is active and adapting to your pace.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Third Row: Recommended for You */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Recommended for You</h2>
              <p className="text-xs text-neutral-400">Personalized based on your learning patterns.</p>
            </div>
            <button
              onClick={onNavigateToLearn}
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition"
            >
              <span>See More</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={beginPractice}
              className="p-5 rounded-2xl bg-[#0d0d0e] hover:bg-[#14141c] border border-white/[0.06] hover:border-purple-500/30 text-left transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#221035] flex items-center justify-center text-purple-400">
                  <Target size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">Target Practice</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Focus on {currentSkill?.skill_name || 'key prerequisites'}.</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-zinc-500 group-hover:text-white transition-colors" />
            </button>

            <button
              onClick={onNavigateToLearn}
              className="p-5 rounded-2xl bg-[#0d0d0e] hover:bg-[#14141c] border border-white/[0.06] hover:border-purple-500/30 text-left transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#221035] flex items-center justify-center text-purple-400">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">Strengthen Basics</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Revisit key concepts for better clarity.</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-zinc-500 group-hover:text-white transition-colors" />
            </button>

            <button
              onClick={onNavigateToAssess}
              className="p-5 rounded-2xl bg-[#0d0d0e] hover:bg-[#14141c] border border-white/[0.06] hover:border-purple-500/30 text-left transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#221035] flex items-center justify-center text-purple-400">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">Challenge Yourself</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Try questions at a higher mastery level.</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-zinc-500 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentHome;
