import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { TeacherOverview } from '../../types';
import {
  Users,
  Search,
  Bell,
  TrendingUp,
  ClipboardList,
  PieChart,
  Calendar,
  ChevronDown,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  FileText,
  UploadCloud,
  FolderOpen,
  Check,
  X
} from 'lucide-react';
import { DocumentUploadModal } from '../upload/DocumentUploadModal';

type TeacherTab = 'overview' | 'students' | 'insights' | 'content';

const EMPTY_TEACHER_OVERVIEW: TeacherOverview = {
  students: [],
  heatmap: [],
  patterns: [],
  same_score_comparison: {
    target_score: 70,
    headline: 'Learning comparisons will appear as students complete assessments.',
    student_a: { name: 'Aarav Sharma', score: 70, diagnosis_type: 'Procedural Slip', primary_weakness: 'Sign flips in composite functions', active_misconception: 'Distributive property misapplication', recommended_next_step: 'Targeted 3-minute visual algebra module' },
    student_b: { name: 'Diya Patel', score: 70, diagnosis_type: 'Prerequisite Gap', primary_weakness: 'Domain restrictions in rational limits', active_misconception: 'Conflating limit existence with continuity', recommended_next_step: 'Foundational review on vertical asymptotes' },
    core_thesis: 'Identical scores mask completely different cognitive failure points.'
  }
};

interface TeacherDashboardProps {
  onSelectStudent?: (studentId: string) => void;
  activeTab?: TeacherTab;
  onTabChange?: (tab: TeacherTab) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  onSelectStudent,
  activeTab: propActiveTab,
  onTabChange
}) => {
  const [overview, setOverview] = useState<TeacherOverview>(EMPTY_TEACHER_OVERVIEW);
  const [loading, setLoading] = useState<boolean>(true);
  const [internalTab, setInternalTab] = useState<TeacherTab>('overview');
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const [insightsSubTab, setInsightsSubTab] = useState<'gaps' | 'mastery' | 'engagement' | 'comparison'>('gaps');
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);

  const currentTab = propActiveTab || internalTab;

  const handleTabChange = (t: TeacherTab) => {
    setInternalTab(t);
    if (onTabChange) onTabChange(t);
  };

  useEffect(() => {
    loadTeacherData();
  }, []);

  const loadTeacherData = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getTeacherOverview();
      setOverview(data);
    } catch (e) {
      console.warn('Backend unavailable, using default cohort models', e);
      setOverview(EMPTY_TEACHER_OVERVIEW);
    } finally {
      setLoading(false);
    }
  };

  // Mock list for Students Management matching Stitch screen 51f69dedcfb64a8fafa2e7f847ff8a0f
  const sampleStudents = [
    { id: '1', name: 'Aarav Sharma', class: 'Class 10', avgScore: 88, status: 'High Performer', statusColor: 'bg-[#0f241a] text-[#4ade80] border-emerald-500/20', lastActive: '2 hours ago' },
    { id: '2', name: 'Diya Patel', class: 'Class 10', avgScore: 76, status: 'On Track', statusColor: 'bg-[#0f1f2e] text-[#38bdf8] border-sky-500/20', lastActive: '5 hours ago' },
    { id: '3', name: 'Rohan Mehta', class: 'Class 10', avgScore: 62, status: 'Needs Support', statusColor: 'bg-[#291408] text-[#fb923c] border-orange-500/20', lastActive: '1 day ago' },
    { id: '4', name: 'Sneha Iyer', class: 'Class 10', avgScore: 91, status: 'High Performer', statusColor: 'bg-[#0f241a] text-[#4ade80] border-emerald-500/20', lastActive: '3 hours ago' },
    { id: '5', name: 'Karthik Rao', class: 'Class 10', avgScore: 58, status: 'Needs Support', statusColor: 'bg-[#291408] text-[#fb923c] border-orange-500/20', lastActive: '1 day ago' },
    { id: '6', name: 'Ananya Singh', class: 'Class 10', avgScore: 73, status: 'On Track', statusColor: 'bg-[#0f1f2e] text-[#38bdf8] border-sky-500/20', lastActive: '6 hours ago' },
  ];

  const filteredStudents = sampleStudents.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesClass = selectedClass === 'All Classes' || s.class === selectedClass;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="min-h-screen bg-[#060608] text-slate-200 font-['Plus_Jakarta_Sans',sans-serif] pb-12 flex flex-col">
      <style>{`
        .glow-card {
          background: #0d0d12;
          border: 1px solid rgba(255, 255, 255, 0.07);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .glow-card:hover {
          border-color: rgba(147, 51, 234, 0.25);
        }
        .text-glow-purple {
          background: linear-gradient(135deg, #a855f7 0%, #7e22ce 50%, #6800cb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      {/* Top Bar Search & Notifications */}
      <header className="px-6 md:px-8 py-4 flex items-center justify-between gap-6 border-b border-white/[0.04] bg-[#060608] sticky top-0 z-30">
        <div className="relative w-full max-w-xl">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
            <Search size={16} />
          </span>
          <input
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0c0c10] border border-white/10 rounded-full text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-inner"
            placeholder="Search for students, topics, or insights..."
            type="text"
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            className="w-9 h-9 rounded-full bg-[#0d0d12] border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/20 transition-all relative"
            type="button"
            aria-label="Notifications"
          >
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-500 ring-2 ring-[#060608]" />
          </button>
        </div>
      </header>

      {/* Dashboard Body Container */}
      <div className="px-6 md:px-8 pt-6 space-y-6 max-w-[1400px] w-full mx-auto">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-1">
          <div>
            <span className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase">
              Teacher Overview
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1">
              Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-500 to-indigo-400">Teacher.</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1 font-normal">A clearer picture of your students' learning.</p>
          </div>

          {/* Slogan Quote */}
          <div className="text-right">
            <p className="text-sm font-medium italic text-zinc-300 font-serif tracking-wide">
              “Better insights. Brighter futures.”
            </p>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3 overflow-x-auto">
          <button
            onClick={() => handleTabChange('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'overview'
                ? 'bg-gradient-to-r from-[#6800cb]/90 to-[#4c0587]/80 text-white shadow-[0_0_15px_rgba(104,0,203,0.35)] border border-purple-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => handleTabChange('students')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'students'
                ? 'bg-gradient-to-r from-[#6800cb]/90 to-[#4c0587]/80 text-white shadow-[0_0_15px_rgba(104,0,203,0.35)] border border-purple-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Students
          </button>
          <button
            onClick={() => handleTabChange('insights')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'insights'
                ? 'bg-gradient-to-r from-[#6800cb]/90 to-[#4c0587]/80 text-white shadow-[0_0_15px_rgba(104,0,203,0.35)] border border-purple-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Insights
          </button>
          <button
            onClick={() => handleTabChange('content')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'content'
                ? 'bg-gradient-to-r from-[#6800cb]/90 to-[#4c0587]/80 text-white shadow-[0_0_15px_rgba(104,0,203,0.35)] border border-purple-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Content &amp; Materials
          </button>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: OVERVIEW (Stitch Screen b589392163f24a009d51d7d65a8eabd1) */}
        {/* ============================================================ */}
        {currentTab === 'overview' && (
          <div className="space-y-6">
            {/* Row 1 - KPI Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Students */}
              <div className="glow-card rounded-2xl p-5 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#201138] border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
                  <Users size={24} />
                </div>
                <div>
                  <span className="text-xs text-zinc-400 font-medium block">Total Students</span>
                  <span className="text-2xl font-bold text-white tracking-tight mt-0.5 block leading-none">48</span>
                  <div className="flex items-center gap-1 mt-2 text-[11px] font-semibold text-emerald-400">
                    <TrendingUp size={12} />
                    <span>+3 this week</span>
                  </div>
                </div>
              </div>

              {/* Active Learners */}
              <div className="glow-card rounded-2xl p-5 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#201138] border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
                  <PieChart size={24} />
                </div>
                <div>
                  <span className="text-xs text-zinc-400 font-medium block">Active Learners</span>
                  <span className="text-2xl font-bold text-white tracking-tight mt-0.5 block leading-none">42</span>
                  <span className="text-[11px] font-medium text-zinc-400 block mt-2">87% engaged</span>
                </div>
              </div>

              {/* Assessments Taken */}
              <div className="glow-card rounded-2xl p-5 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#201138] border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
                  <ClipboardList size={24} />
                </div>
                <div>
                  <span className="text-xs text-zinc-400 font-medium block">Assessments Taken</span>
                  <span className="text-2xl font-bold text-white tracking-tight mt-0.5 block leading-none">320</span>
                  <div className="flex items-center gap-1 mt-2 text-[11px] font-semibold text-emerald-400">
                    <TrendingUp size={12} />
                    <span>+12% this month</span>
                  </div>
                </div>
              </div>

              {/* Average Score */}
              <div className="glow-card rounded-2xl p-5 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#201138] border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <span className="text-xs text-zinc-400 font-medium block">Average Score</span>
                  <span className="text-2xl font-bold text-white tracking-tight mt-0.5 block leading-none">68%</span>
                  <div className="flex items-center gap-1 mt-2 text-[11px] font-semibold text-emerald-400">
                    <TrendingUp size={12} />
                    <span>+8% improvement</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2 - Middle Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left: Class Performance Chart (7 cols) */}
              <div className="lg:col-span-7 glow-card rounded-2xl p-6 flex flex-col justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight">Class Performance</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">Average scores across subjects.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button className="px-3 py-1.5 rounded-lg bg-[#16161d] border border-white/10 text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-2 transition-colors">
                      <span>Last 14 days</span>
                      <ChevronDown size={14} className="text-zinc-400" />
                    </button>
                  </div>
                </div>

                {/* Chart Legends */}
                <div className="flex items-center justify-end gap-5 text-xs text-zinc-400 mt-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#9333ea]" />
                    <span className="text-[11px]">Class Average</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#6800cb]" />
                    <span className="text-[11px]">Your Class</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 border-t-2 border-dashed border-zinc-400 inline-block" />
                    <span className="text-[11px]">Target</span>
                  </div>
                </div>

                {/* SVG Multi-Series Area & Line Chart */}
                <div className="w-full mt-4 h-52 relative">
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 650 200">
                    <defs>
                      <linearGradient id="purpleGradLight" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#9333ea" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#9333ea" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="purpleGradDark" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#6800cb" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#6800cb" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <g stroke="rgba(255,255,255,0.05)" strokeWidth="1">
                      <line x1="30" x2="640" y1="10" y2="10" />
                      <line x1="30" x2="640" y1="45" y2="45" />
                      <line x1="30" x2="640" y1="80" y2="80" />
                      <line x1="30" x2="640" y1="115" y2="115" />
                      <line x1="30" x2="640" y1="150" y2="150" />
                      <line x1="30" x2="640" y1="185" y2="185" />
                    </g>
                    {/* Target Dashed Line at 60% */}
                    <line opacity="0.8" stroke="#71717a" strokeDasharray="4,4" strokeWidth="1.5" x1="30" x2="640" y1="80" y2="80" />
                    <text fill="#71717a" fontSize="10" x="5" y="14">100</text>
                    <text fill="#71717a" fontSize="10" x="10" y="49">80</text>
                    <text fill="#71717a" fontSize="10" x="10" y="84">60</text>
                    <text fill="#71717a" fontSize="10" x="10" y="119">40</text>
                    <text fill="#71717a" fontSize="10" x="10" y="154">20</text>
                    <text fill="#71717a" fontSize="10" x="15" y="189">0</text>

                    {/* Series 1: Your Class */}
                    <path d="M 50 145 C 130 140, 200 135, 270 120 C 340 108, 410 110, 480 115 C 530 120, 580 90, 620 80 L 620 185 L 50 185 Z" fill="url(#purpleGradDark)" />
                    <path d="M 50 145 C 130 140, 200 135, 270 120 C 340 108, 410 110, 480 115 C 530 120, 580 90, 620 80" fill="none" stroke="#6800cb" strokeWidth="2.5" />
                    <circle cx="50" cy="145" fill="#6800cb" r="3" stroke="#0e0e0e" strokeWidth="1.5" />
                    <circle cx="140" cy="138" fill="#6800cb" r="3" stroke="#0e0e0e" strokeWidth="1.5" />
                    <circle cx="230" cy="130" fill="#6800cb" r="3" stroke="#0e0e0e" strokeWidth="1.5" />
                    <circle cx="320" cy="115" fill="#6800cb" r="3" stroke="#0e0e0e" strokeWidth="1.5" />
                    <circle cx="410" cy="110" fill="#6800cb" r="3" stroke="#0e0e0e" strokeWidth="1.5" />
                    <circle cx="500" cy="118" fill="#6800cb" r="3" stroke="#0e0e0e" strokeWidth="1.5" />
                    <circle cx="620" cy="80" fill="#6800cb" r="3.5" stroke="#ffffff" strokeWidth="1.5" />

                    {/* Series 2: Class Average */}
                    <path d="M 50 135 C 130 130, 200 115, 270 100 C 340 85, 410 82, 480 90 C 530 95, 570 70, 620 50 L 620 185 L 50 185 Z" fill="url(#purpleGradLight)" />
                    <path d="M 50 135 C 130 130, 200 115, 270 100 C 340 85, 410 82, 480 90 C 530 95, 570 70, 620 50" fill="none" stroke="#9333ea" strokeWidth="2.5" />
                    <circle cx="50" cy="135" fill="#9333ea" r="3" stroke="#0e0e0e" strokeWidth="1.5" />
                    <circle cx="140" cy="125" fill="#9333ea" r="3" stroke="#0e0e0e" strokeWidth="1.5" />
                    <circle cx="230" cy="110" fill="#9333ea" r="3" stroke="#0e0e0e" strokeWidth="1.5" />
                    <circle cx="320" cy="95" fill="#9333ea" r="3" stroke="#0e0e0e" strokeWidth="1.5" />
                    <circle cx="410" cy="84" fill="#9333ea" r="3" stroke="#0e0e0e" strokeWidth="1.5" />
                    <circle cx="500" cy="90" fill="#9333ea" r="3" stroke="#0e0e0e" strokeWidth="1.5" />
                    <circle cx="620" cy="50" fill="#9333ea" r="3.5" stroke="#ffffff" strokeWidth="1.5" />
                  </svg>
                  <div className="flex justify-between pl-8 pr-2 pt-2 text-[10px] text-zinc-500 font-medium">
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

              {/* Right: Subject Performance Progress Bars (5 cols) */}
              <div className="lg:col-span-5 glow-card rounded-2xl p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight">Subject Performance</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">Average score by subject.</p>
                  </div>
                  <button
                    onClick={() => handleTabChange('insights')}
                    className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                  >
                    <span>View All</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                <div className="space-y-4 my-auto pt-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-300 font-medium">Functions</span>
                      <span className="text-zinc-200 font-semibold">78%</span>
                    </div>
                    <div className="w-full bg-[#181820] h-2.5 rounded-full overflow-hidden p-[1px]">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#6800cb] via-[#8b2cf5] to-[#a855f7]" style={{ width: '78%' }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-300 font-medium">Limits</span>
                      <span className="text-zinc-200 font-semibold">62%</span>
                    </div>
                    <div className="w-full bg-[#181820] h-2.5 rounded-full overflow-hidden p-[1px]">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#6800cb] to-[#8b2cf5]" style={{ width: '62%' }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-300 font-medium">Differentiation</span>
                      <span className="text-zinc-200 font-semibold">58%</span>
                    </div>
                    <div className="w-full bg-[#181820] h-2.5 rounded-full overflow-hidden p-[1px]">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#6800cb] to-[#8b2cf5]" style={{ width: '58%' }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-300 font-medium">Integration</span>
                      <span className="text-zinc-200 font-semibold">71%</span>
                    </div>
                    <div className="w-full bg-[#181820] h-2.5 rounded-full overflow-hidden p-[1px]">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#6800cb] to-[#a855f7]" style={{ width: '71%' }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-300 font-medium">Applications</span>
                      <span className="text-zinc-200 font-semibold">65%</span>
                    </div>
                    <div className="w-full bg-[#181820] h-2.5 rounded-full overflow-hidden p-[1px]">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#6800cb] to-[#9333ea]" style={{ width: '65%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3 - Recent Activity, Student Engagement, Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Column 1: Recent Activity */}
              <div className="glow-card rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-bold text-white tracking-tight">Recent Activity</h2>
                      <p className="text-xs text-zinc-400 mt-0.5">Latest student activity in your classes.</p>
                    </div>
                  </div>

                  <div className="space-y-3.5 mt-2">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#201138] border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0 mt-0.5">
                        <ClipboardList size={16} />
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-zinc-100 leading-snug">New assessment submitted</h3>
                        <p className="text-[11px] text-zinc-400 mt-0.5">Class 10 • 2 minutes ago</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#201138] border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0 mt-0.5">
                        <TrendingUp size={16} />
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-zinc-100 leading-snug">Improved score in Functions</h3>
                        <p className="text-[11px] text-zinc-400 mt-0.5">Aarav Sharma • 15 minutes ago</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#201138] border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0 mt-0.5">
                        <Users size={16} />
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-zinc-100 leading-snug">Student requested help</h3>
                        <p className="text-[11px] text-zinc-400 mt-0.5">Rohan Mehta • 1 hour ago</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#201138] border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0 mt-0.5">
                        <FileText size={16} />
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-zinc-100 leading-snug">Practice session completed</h3>
                        <p className="text-[11px] text-zinc-400 mt-0.5">Diya Patel • 2 hours ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2: Student Engagement (Donut Chart) */}
              <div className="glow-card rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Student Engagement</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Activity distribution across your students.</p>
                </div>

                <div className="flex items-center justify-between gap-4 py-3 my-auto">
                  <div className="relative w-36 h-36 flex items-center justify-center flex-shrink-0">
                    <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 130 130">
                      <circle cx="65" cy="65" fill="none" r="50" stroke="#1c1c24" strokeWidth="14" />
                      {/* Actively Engaged (87%) */}
                      <circle cx="65" cy="65" fill="none" r="50" stroke="#7e22ce" strokeDasharray="314.15" strokeDashoffset="40.8" strokeLinecap="round" strokeWidth="14" />
                      {/* Moderately Active (8%) */}
                      <circle cx="65" cy="65" fill="none" r="50" stroke="#a855f7" strokeDasharray="314.15" strokeDashoffset="288.9" strokeWidth="14" transform="rotate(313.2 65 65)" />
                      {/* Low Activity (5%) */}
                      <circle cx="65" cy="65" fill="none" r="50" stroke="#f97316" strokeDasharray="314.15" strokeDashoffset="298.4" strokeLinecap="round" strokeWidth="14" transform="rotate(342 65 65)" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                      <span className="text-2xl font-bold text-white tracking-tight leading-none">48</span>
                      <span className="text-[10px] text-zinc-400 mt-0.5">Students</span>
                    </div>
                  </div>

                  <div className="space-y-3 flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#7e22ce]" />
                        <span className="text-zinc-300 text-[11px]">Actively Engaged</span>
                      </div>
                      <span className="font-bold text-zinc-100 text-xs">87%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#a855f7]" />
                        <span className="text-zinc-300 text-[11px]">Moderately Active</span>
                      </div>
                      <span className="font-bold text-zinc-100 text-xs">8%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]" />
                        <span className="text-zinc-300 text-[11px]">Low Activity</span>
                      </div>
                      <span className="font-bold text-zinc-100 text-xs">5%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 3: Quick Actions */}
              <div className="glow-card rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Quick Actions</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Common tasks for your teaching workflow.</p>
                </div>

                <div className="space-y-2 mt-3">
                  <button
                    onClick={() => handleTabChange('students')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#14141c]/60 hover:bg-[#1b1b26] border border-white/5 hover:border-purple-500/30 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#201138] text-purple-400 flex items-center justify-center">
                        <Users size={16} />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-zinc-200 leading-tight">View All Students</h3>
                        <p className="text-[10px] text-zinc-400">See detailed student profiles</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-zinc-500" />
                  </button>

                  <button
                    onClick={() => handleTabChange('insights')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#14141c]/60 hover:bg-[#1b1b26] border border-white/5 hover:border-purple-500/30 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#201138] text-purple-400 flex items-center justify-center">
                        <Sparkles size={16} />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-zinc-200 leading-tight">Compare Same-Scores</h3>
                        <p className="text-[10px] text-zinc-400">Deep diagnostic divergence</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-zinc-500" />
                  </button>

                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#14141c]/60 hover:bg-[#1b1b26] border border-white/5 hover:border-purple-500/30 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#201138] text-purple-400 flex items-center justify-center">
                        <UploadCloud size={16} />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-zinc-200 leading-tight">Share Resources</h3>
                        <p className="text-[10px] text-zinc-400">Send notes and materials</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-zinc-500" />
                  </button>
                </div>
              </div>
            </div>

            {/* Row 4 - Teaching Tip Banner */}
            <section className="glow-card rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border border-purple-900/30 bg-gradient-to-r from-[#120d1c] via-[#0e0e14] to-[#0c0c10]">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="w-10 h-10 rounded-full bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-300 flex-shrink-0 shadow-[0_0_12px_rgba(147,51,234,0.3)]">
                  <Lightbulb size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Teaching Tip</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Use insight reports to identify common misconceptions and plan your next class.</p>
                </div>
              </div>
              <button
                onClick={() => handleTabChange('insights')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-purple-500/40 bg-purple-950/30 hover:bg-purple-900/50 text-xs font-semibold text-purple-200 hover:text-white flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(104,0,203,0.15)] hover:shadow-[0_0_20px_rgba(104,0,203,0.35)] flex-shrink-0"
              >
                <span>View Insights</span>
                <ArrowRight size={14} />
              </button>
            </section>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: STUDENTS MANAGEMENT (Stitch Screen 51f69dedcfb64a8fafa2e7f847ff8a0f) */}
        {/* ============================================================ */}
        {currentTab === 'students' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column: Students List Card (8 cols) */}
            <section className="lg:col-span-8 bg-[#0e0e10] rounded-2xl border border-white/[0.08] p-5 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <div>
                    <h2 className="text-base font-bold text-white">Students List</h2>
                    <p className="text-xs text-neutral-400">View and manage your students' progress.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" size={14} />
                      <input
                        className="bg-[#151518] border border-white/[0.08] rounded-lg py-1.5 pl-8 pr-3 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-[#6800CB] w-44 transition-colors"
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        placeholder="Search students..."
                        type="text"
                      />
                    </div>
                    {/* Class Filter Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setClassDropdownOpen(!classDropdownOpen)}
                        className="bg-[#151518] border border-white/[0.08] text-neutral-300 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-neutral-800 transition-colors"
                      >
                        <span>{selectedClass}</span>
                        <ChevronDown size={14} />
                      </button>
                      {classDropdownOpen && (
                        <div className="absolute right-0 mt-1 w-32 bg-[#17171b] border border-white/10 rounded-lg shadow-2xl py-1 z-30">
                          {['All Classes', 'Class 10', 'Class 9'].map(cls => (
                            <button
                              key={cls}
                              onClick={() => { setSelectedClass(cls); setClassDropdownOpen(false); }}
                              className="w-full text-left px-3 py-1.5 text-xs text-neutral-300 hover:bg-[#6800CB]/40 hover:text-white"
                            >
                              {cls}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Table Container */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-neutral-400 border-b border-white/[0.06]">
                        <th className="pb-3 px-2 font-semibold">Name</th>
                        <th className="pb-3 px-2 font-semibold">Class</th>
                        <th className="pb-3 px-2 font-semibold">Avg. Score</th>
                        <th className="pb-3 px-2 font-semibold min-w-[110px]">Progress</th>
                        <th className="pb-3 px-2 font-semibold">Status</th>
                        <th className="pb-3 px-2 font-semibold">Last Active</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03] text-neutral-300">
                      {filteredStudents.map((st) => (
                        <tr
                          key={st.id}
                          className="hover:bg-white/[0.03] cursor-pointer transition-colors"
                          onClick={() => onSelectStudent && onSelectStudent(st.id)}
                        >
                          <td className="py-3 px-2 font-medium text-white whitespace-nowrap">{st.name}</td>
                          <td className="py-3 px-2 text-neutral-400 whitespace-nowrap">{st.class}</td>
                          <td className="py-3 px-2 font-semibold text-neutral-200">{st.avgScore}%</td>
                          <td className="py-3 px-2">
                            <div className="w-28 bg-[#18181c] h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-[#6800CB] to-[#9d4edd] h-full rounded-full shadow-[0_0_8px_rgba(157,78,221,0.5)]"
                                style={{ width: `${st.avgScore}%` }}
                              />
                            </div>
                          </td>
                          <td className="py-3 px-2 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${st.statusColor}`}>
                              {st.status}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-neutral-400 whitespace-nowrap">{st.lastActive}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination Bar */}
              <div className="pt-4 mt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-neutral-400">
                <span>Showing <strong className="text-white">1–{filteredStudents.length}</strong> of <strong className="text-white">48</strong> students</span>
                <div className="flex items-center gap-1">
                  <button className="w-7 h-7 flex items-center justify-center rounded bg-[#6800CB] text-white font-bold">1</button>
                  <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-neutral-800 hover:text-white">2</button>
                  <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-neutral-800 hover:text-white">3</button>
                </div>
              </div>
            </section>

            {/* Right Column: Performance Distribution (4 cols) */}
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-[#0e0e10] rounded-2xl border border-white/[0.08] p-5 shadow-xl">
                <h2 className="text-base font-bold text-white">Student Performance Distribution</h2>
                <p className="text-xs text-neutral-400 mb-4">Number of students across performance levels.</p>

                <div className="flex items-center gap-6">
                  <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" fill="transparent" r="38" stroke="#1c1a26" strokeWidth="12" />
                      <circle cx="50" cy="50" fill="transparent" r="38" stroke="#8e2dfc" strokeDasharray="59.7 179.1" strokeDashoffset="0" strokeWidth="12" />
                      <circle cx="50" cy="50" fill="transparent" r="38" stroke="#4f46e5" strokeDasharray="138.5 100.3" strokeDashoffset="-59.7" strokeWidth="12" />
                      <circle cx="50" cy="50" fill="transparent" r="38" stroke="#ea580c" strokeDasharray="40.6 198.2" strokeDashoffset="-198.2" strokeWidth="12" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-white leading-none">48</span>
                      <span className="text-[10px] text-neutral-400 mt-0.5">Students</span>
                    </div>
                  </div>

                  <div className="space-y-2.5 flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#8e2dfc]" />
                        <span className="text-neutral-300">High Performers</span>
                      </div>
                      <span className="text-neutral-300 font-semibold">25% (12)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#4f46e5]" />
                        <span className="text-neutral-300">On Track</span>
                      </div>
                      <span className="text-neutral-300 font-semibold">58% (28)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ea580c]" />
                        <span className="text-neutral-300">Needs Support</span>
                      </div>
                      <span className="text-neutral-300 font-semibold">17% (8)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: INSIGHTS & SAME-SCORE COMPARISON (Stitch Screen e0a56bf6595f4a63844e708afeea03a1) */}
        {/* ============================================================ */}
        {currentTab === 'insights' && (
          <div className="space-y-6">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1c1c24] pb-2">
              <div className="flex items-center gap-6 text-xs">
                <button
                  onClick={() => setInsightsSubTab('gaps')}
                  className={`pb-2.5 font-semibold transition-all relative ${
                    insightsSubTab === 'gaps'
                      ? 'text-white after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#a855f7]'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Learning Gaps
                </button>
                <button
                  onClick={() => setInsightsSubTab('comparison')}
                  className={`pb-2.5 font-semibold transition-all relative ${
                    insightsSubTab === 'comparison'
                      ? 'text-white after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#a855f7]'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Same-Score Divergence
                </button>
              </div>
              <div className="text-xs text-neutral-400">
                Last 30 days • Cohort Class 10
              </div>
            </div>

            {/* KPI Metric Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0f0f14] border border-[#1d1d27] rounded-xl p-4 flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-lg bg-[#27153e] flex items-center justify-center text-purple-400">
                  <Users size={20} />
                </div>
                <div>
                  <p className="text-[11px] text-neutral-400 font-medium">Total Students</p>
                  <span className="text-2xl font-bold text-white tracking-tight">48</span>
                  <p className="text-[10px] text-emerald-400 mt-0.5">↑ +12% from last month</p>
                </div>
              </div>

              <div className="bg-[#0f0f14] border border-[#1d1d27] rounded-xl p-4 flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-lg bg-[#341818] flex items-center justify-center text-orange-400">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <p className="text-[11px] text-neutral-400 font-medium">At Risk</p>
                  <span className="text-2xl font-bold text-white tracking-tight">8</span>
                  <p className="text-[10px] text-neutral-400 mt-0.5">17% of total</p>
                </div>
              </div>

              <div className="bg-[#0f0f14] border border-[#1d1d27] rounded-xl p-4 flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-lg bg-[#142338] flex items-center justify-center text-sky-400">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className="text-[11px] text-neutral-400 font-medium">On Track</p>
                  <span className="text-2xl font-bold text-white tracking-tight">32</span>
                  <p className="text-[10px] text-neutral-400 mt-0.5">67% of total</p>
                </div>
              </div>

              <div className="bg-[#0f0f14] border border-[#1d1d27] rounded-xl p-4 flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-lg bg-[#27153e] flex items-center justify-center text-purple-400">
                  <Sparkles size={20} />
                </div>
                <div>
                  <p className="text-[11px] text-neutral-400 font-medium">Excelling</p>
                  <span className="text-2xl font-bold text-white tracking-tight">8</span>
                  <p className="text-[10px] text-emerald-400 mt-0.5">↑ +5% from last month</p>
                </div>
              </div>
            </div>

            {/* Same-Score Comparison Feature */}
            <div className="p-6 rounded-2xl bg-[#0e0e13] border border-purple-500/20 shadow-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  CORE INTELLIGENCE
                </span>
                <span className="text-xs text-neutral-400">Score Divergence Diagnosis</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight mb-2">
                Why 70% Does Not Equal 70%
              </h2>
              <p className="text-xs text-neutral-400 max-w-2xl mb-6">
                {overview.same_score_comparison.headline}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Student A Card */}
                <div className="p-5 rounded-xl bg-[#14141d] border border-purple-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-white">{overview.same_score_comparison.student_a.name}</span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-purple-950/60 text-purple-300 border border-purple-500/40">
                      Score: {overview.same_score_comparison.student_a.score}%
                    </span>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold">Diagnosis Pattern</span>
                      <p className="font-semibold text-purple-300">{overview.same_score_comparison.student_a.diagnosis_type}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold">Active Misconception</span>
                      <p className="text-zinc-300">{overview.same_score_comparison.student_a.active_misconception}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold">Recommended Intervention</span>
                      <p className="text-emerald-400 font-medium">{overview.same_score_comparison.student_a.recommended_next_step}</p>
                    </div>
                  </div>
                </div>

                {/* Student B Card */}
                <div className="p-5 rounded-xl bg-[#14141d] border border-sky-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-white">{overview.same_score_comparison.student_b.name}</span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-sky-950/60 text-sky-300 border border-sky-500/40">
                      Score: {overview.same_score_comparison.student_b.score}%
                    </span>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold">Diagnosis Pattern</span>
                      <p className="font-semibold text-sky-300">{overview.same_score_comparison.student_b.diagnosis_type}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold">Active Misconception</span>
                      <p className="text-zinc-300">{overview.same_score_comparison.student_b.active_misconception}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold">Recommended Intervention</span>
                      <p className="text-emerald-400 font-medium">{overview.same_score_comparison.student_b.recommended_next_step}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mid Charts: Top Learning Gaps & Topic Mastery Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-[#0e0e13] border border-[#1b1b24] rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Top Learning Gaps</h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Topics where students are struggling the most.</p>
                  <div className="mt-5 space-y-4">
                    {[
                      { name: 'Application Questions', pct: 68 },
                      { name: 'Multi-step Problems', pct: 52 },
                      { name: 'Conceptual Clarity', pct: 44 },
                      { name: 'Graph Interpretation', pct: 42 },
                      { name: 'Proof-based Questions', pct: 38 },
                    ].map(g => (
                      <div key={g.name} className="flex items-center justify-between gap-4">
                        <span className="text-xs text-neutral-300 w-36 flex-shrink-0">{g.name}</span>
                        <div className="flex-1 bg-[#1c1c27] h-2.5 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-[#7c3aed] to-[#9333ea] h-full rounded-full" style={{ width: `${g.pct}%` }} />
                        </div>
                        <span className="text-xs font-medium text-neutral-200 w-8 text-right flex-shrink-0">{g.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actionable Insights */}
              <div className="bg-[#0e0e13] border border-[#1b1b24] rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Actionable Recommendations</h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">AI-powered recommendations for your teaching.</p>
                  <div className="mt-4 space-y-3">
                    <div className="p-3 rounded-xl bg-[#14141c]/70 border border-[#1f1f2a] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#27153e] flex items-center justify-center text-purple-400">
                          <AlertTriangle size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-medium text-white">Focus on application-based questions</h4>
                          <p className="text-[10px] text-neutral-400">68% of students are struggling</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-zinc-500" />
                    </div>

                    <div className="p-3 rounded-xl bg-[#14141c]/70 border border-[#1f1f2a] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#27153e] flex items-center justify-center text-purple-400">
                          <BookOpen size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-medium text-white">Reinforce conceptual foundation</h4>
                          <p className="text-[10px] text-neutral-400">Common gaps in core prerequisite topics</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-zinc-500" />
                    </div>

                    <div className="p-3 rounded-xl bg-[#14141c]/70 border border-[#1f1f2a] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#27153e] flex items-center justify-center text-purple-400">
                          <Sparkles size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-medium text-white">Deploy adaptive micro-quizzes</h4>
                          <p className="text-[10px] text-neutral-400">Individualized pathways resolve errors 3x faster</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-zinc-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: CONTENT & MATERIALS */}
        {/* ============================================================ */}
        {currentTab === 'content' && (
          <div className="glow-card rounded-2xl p-8 text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto mb-4">
              <UploadCloud size={32} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Cohort Learning Materials</h2>
            <p className="text-xs text-zinc-400 mb-6">
              Upload custom syllabus documents, textbook chapters, or question sets. The AI engine automatically indexes prerequisites and generates custom diagnostic twins.
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-2.5 rounded-xl bg-[#6800cb] hover:bg-[#7b14df] text-white text-xs font-bold transition shadow-[0_0_20px_rgba(104,0,203,0.5)]"
            >
              Upload New Documents
            </button>
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <DocumentUploadModal
          onClose={() => setShowUploadModal(false)}
          onChapterReady={() => {
            setShowUploadModal(false);
            loadTeacherData();
          }}
        />
      )}
    </div>
  );
};

export default TeacherDashboard;
