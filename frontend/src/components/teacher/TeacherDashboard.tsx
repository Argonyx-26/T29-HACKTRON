import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { TeacherOverview } from '../../types';
import {
  Users,
  Grid,
  Scale,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Award,
  CheckCircle2,
  PieChart,
  ClipboardList,
  BarChart2,
  RefreshCw,
  X,
  FileText,
  UploadCloud,
  FolderOpen,
  Check,
  Lock,
  Search,
  Bell
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
    student_a: { name: 'Student A', score: 0, diagnosis_type: 'No data', primary_weakness: 'No learning data yet', active_misconception: 'No misconception recorded', recommended_next_step: 'Invite students to complete an assessment.' },
    student_b: { name: 'Student B', score: 0, diagnosis_type: 'No data', primary_weakness: 'No learning data yet', active_misconception: 'No misconception recorded', recommended_next_step: 'Invite students to complete an assessment.' },
    core_thesis: 'Class insights will become available as student activity is recorded.'
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [internalTab, setInternalTab] = useState<TeacherTab>('overview');
  
  // Selected Student for detailed profile inspection
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  
  // Teacher Material Upload modal
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [studentSearch, setStudentSearch] = useState('');

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
    setLoadError(null);
    try {
      const data = await apiClient.getTeacherOverview();
      setOverview(data);
    } catch (e) {
      console.error(e);
      setOverview(EMPTY_TEACHER_OVERVIEW);
      setLoadError('Classroom data could not be reached. The dashboard is open with empty data; retry when the service is available.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card-panel p-16 text-center text-surface-variant flex flex-col items-center justify-center gap-3 border border-white/10 rounded-2xl">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <span className="text-sm font-medium">Loading classroom learning models from database...</span>
      </div>
    );
  }

  const ss = overview.same_score_comparison;

  // Calculate high-level class overview metrics
  const totalGapsCount = overview.students.reduce(
    (acc, s) => acc + s.active_misconceptions_count, 0
  );
  const activeLearners = overview.students.filter(student => student.overall_mastery > 0).length;
  const averageScore = overview.students.length ? Math.round(overview.students.reduce((sum, student) => sum + student.score_percentage, 0) / overview.students.length) : 0;
  const filteredStudents = overview.students.filter(student => `${student.name} ${student.primary_gap}`.toLowerCase().includes(studentSearch.toLowerCase()));

  const selectedStudent = overview.students.find(s => s.id === selectedStudentId);

  return (
    <div className="teacher-dashboard flex flex-col gap-6 max-w-6xl mx-auto py-2">
      {loadError && <div role="status" className="teacher-load-error"><span>{loadError}</span><button onClick={loadTeacherData}>Retry</button></div>}
      <div className="teacher-topbar"><label><Search size={18} /><input value={studentSearch} onChange={event => setStudentSearch(event.target.value)} placeholder="Search for students, topics, or insights..." /></label><button aria-label="Teacher notifications"><Bell size={20} /><i /></button></div>
      
      {/* Header & Sub-Navigation */}
      <div className="teacher-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold tracking-widest text-primary-light uppercase">
              Teacher Overview
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary-light border border-primary/30">
              Cohort Intelligence
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Welcome, <span>Teacher.</span>
          </h1>
          <p className="text-xs text-surface-variant mt-1">
            A clearer picture of your students’ learning.
          </p>
        </div>

        {/* 5-Item Capsule Navigation */}
        <div className="teacher-tabs flex items-center gap-1.5 bg-surface-container-high/80 p-1.5 rounded-xl border border-white/10 self-start md:self-auto flex-wrap">
          <button
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentTab === 'overview'
                ? 'bg-primary text-black shadow-[0_0_14px_rgba(215,186,255,0.4)]'
                : 'text-surface-variant hover:text-white'
            }`}
            onClick={() => handleTabChange('overview')}
          >
            Overview
          </button>
          <button
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentTab === 'students'
                ? 'bg-primary text-black shadow-[0_0_14px_rgba(215,186,255,0.4)]'
                : 'text-surface-variant hover:text-white'
            }`}
            onClick={() => handleTabChange('students')}
          >
            Students
          </button>
          <button
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentTab === 'insights'
                ? 'bg-primary text-black shadow-[0_0_14px_rgba(215,186,255,0.4)]'
                : 'text-surface-variant hover:text-white'
            }`}
            onClick={() => handleTabChange('insights')}
          >
            Insights
          </button>
          <button
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentTab === 'content'
                ? 'bg-primary text-black shadow-[0_0_14px_rgba(215,186,255,0.4)]'
                : 'text-surface-variant hover:text-white'
            }`}
            onClick={() => handleTabChange('content')}
          >
            Content & Materials
          </button>
        </div>
      </div>

      {/* 1. OVERVIEW VIEW */}
      {currentTab === 'overview' && (
        <div className="flex flex-col gap-6">
          
          {/* 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Students Needing Attention */}
            <div className="card-panel p-5 rounded-2xl border border-white/10 hover:border-amber-500/40 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Action required
                </span>
              </div>
              <div className="text-[11px] font-medium text-surface-variant uppercase tracking-wider">
                Total Students
              </div>
              <div className="text-3xl font-black text-amber-400 leading-tight mt-1">
                {overview.students.length}
              </div>
              <div className="text-[11px] text-surface-variant mt-1">
                Learners in your cohort
              </div>
            </div>

            {/* Card 2: Emerging Gaps */}
            <div className="card-panel p-5 rounded-2xl border border-white/10 hover:border-red-500/40 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-300 border border-red-500/20">
                  Patterns
                </span>
              </div>
              <div className="text-[11px] font-medium text-surface-variant uppercase tracking-wider">
                Active Learners
              </div>
              <div className="text-3xl font-black text-red-400 leading-tight mt-1">
                {activeLearners}
              </div>
              <div className="text-[11px] text-surface-variant mt-1">
                Showing demonstrated learning
              </div>
            </div>

            {/* Card 3: Class Mastery */}
            <div className="card-panel p-5 rounded-2xl border border-white/10 hover:border-primary/40 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary-light">
                  <Award className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary-light border border-primary/30">
                  Cohort Mean
                </span>
              </div>
              <div className="text-[11px] font-medium text-surface-variant uppercase tracking-wider">
                Learning Gaps
              </div>
              <div className="text-3xl font-black text-white leading-tight mt-1">
                {totalGapsCount}
              </div>
              <div className="text-[11px] text-surface-variant mt-1">
                Active patterns across learners
              </div>
            </div>

            {/* Card 4: Enrolled Learners */}
            <div className="card-panel p-5 rounded-2xl border border-white/10 hover:border-emerald-500/40 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Active
                </span>
              </div>
              <div className="text-[11px] font-medium text-surface-variant uppercase tracking-wider">
                Average Score
              </div>
              <div className="text-3xl font-black text-white leading-tight mt-1">
                {averageScore}%
              </div>
              <div className="text-[11px] text-surface-variant mt-1">
                Across current learner records
              </div>
            </div>
          </div>

          {/* Class Performance SVG Graph */}
          <div className="card-panel p-6 rounded-2xl border border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-primary-light" />
                  Cohort Performance Trajectory
                </h3>
                <p className="text-xs text-surface-variant mt-0.5">Average demonstrated score vs target competency</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-surface-variant">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary-container inline-block"></span> Class Average
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary inline-block"></span> Live Active
                </span>
              </div>
            </div>

            {/* SVG Graph */}
            <div className="mt-6 overflow-hidden">
              <svg className="w-full h-44 overflow-visible" preserveAspectRatio="none" viewBox="0 0 760 180">
                <defs>
                  <linearGradient id="teacherAreaGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#6800cb" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#6800cb" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <line x1="30" x2="740" y1="20" y2="20" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                <text x="20" y="24" fill="#978da0" fontSize="10" textAnchor="end">100%</text>
                <line x1="30" x2="740" y1="60" y2="60" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                <text x="20" y="64" fill="#978da0" fontSize="10" textAnchor="end">75%</text>
                <line x1="30" x2="740" y1="100" y2="100" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                <text x="20" y="104" fill="#978da0" fontSize="10" textAnchor="end">50%</text>
                <line x1="30" x2="740" y1="140" y2="140" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                <text x="20" y="144" fill="#978da0" fontSize="10" textAnchor="end">25%</text>

                <line x1="30" x2="740" y1="80" y2="80" stroke="#9d4edd" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.6" />

                <path d="M 40 150 Q 140 135 220 120 T 400 95 T 560 75 T 720 55 L 720 160 L 40 160 Z" fill="url(#teacherAreaGradient)" />

                <path
                  d="M 40 150 Q 140 135 220 120 T 400 95 T 560 75 T 720 55"
                  fill="none"
                  stroke="#d7baff"
                  strokeWidth="2.5"
                  style={{ filter: 'drop-shadow(0 0 6px #6800cb)' }}
                />

                <circle cx="40" cy="150" fill="#d7baff" r="4" stroke="#050505" strokeWidth="2" />
                <circle cx="220" cy="120" fill="#d7baff" r="4" stroke="#050505" strokeWidth="2" />
                <circle cx="400" cy="95" fill="#d7baff" r="4" stroke="#050505" strokeWidth="2" />
                <circle cx="560" cy="75" fill="#d7baff" r="4" stroke="#050505" strokeWidth="2" />
                <circle cx="720" cy="55" fill="#ffffff" r="5" stroke="#d7baff" strokeWidth="2.5" />
              </svg>
            </div>
          </div>

          {/* Quick Roster Snapshot */}
          <div className="card-panel p-6 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary-light" />
                  Active Cohort Snapshot
                </h3>
                <p className="text-xs text-surface-variant mt-0.5">Summary of demonstrated understanding by learner</p>
              </div>
              <button
                className="btn btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-all text-white"
                onClick={() => handleTabChange('students')}
              >
                View Full Roster <ArrowRight size={13} />
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {filteredStudents.slice(0, 4).map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    setSelectedStudentId(s.id);
                    handleTabChange('students');
                  }}
                  className="p-4 rounded-xl bg-surface-container-low border border-white/5 flex items-center justify-between gap-4 hover:border-white/15 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-primary-light flex items-center justify-center font-bold text-xs text-black">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">{s.name}</div>
                      <div className="text-[11px] text-surface-variant mt-0.5">
                        Primary focus: <span className="text-gray-300 font-medium">{s.primary_gap}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[10px] text-surface-variant uppercase font-bold">Mastery</div>
                      <div className="font-black text-sm text-white">
                        {Math.round(s.overall_mastery * 100)}%
                      </div>
                    </div>

                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        s.active_misconceptions_count > 0
                          ? 'bg-amber-950/40 text-amber-300 border-amber-500/30'
                          : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {s.active_misconceptions_count > 0 ? `${s.active_misconceptions_count} gap` : 'On track'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. STUDENTS ROSTER & INDIVIDUAL PROFILE VIEW */}
      {currentTab === 'students' && (
        <div className="flex flex-col gap-6">
          <div className="card-panel p-6 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h3 className="text-xl font-bold text-white">
                  Student Learning Roster
                </h3>
                <p className="text-xs text-surface-variant mt-1">
                  Click on any learner to inspect their verified mastery, active misconceptions, intervention records, and learning trajectory.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-surface-variant">
                <Lock size={12} />
                <span>Teachers observe evidence without editing personal twins</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {filteredStudents.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedStudentId(s.id)}
                  className={`p-4 rounded-xl border flex items-center justify-between gap-4 flex-wrap cursor-pointer transition-all ${
                    selectedStudentId === s.id
                      ? 'bg-primary/20 border-primary shadow-[0_0_16px_rgba(104,0,203,0.3)]'
                      : 'bg-surface-container-low border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-primary-light flex items-center justify-center font-black text-sm text-black shadow-md">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-base text-white">
                        {s.name}
                      </div>
                      <div className="text-xs text-surface-variant mt-0.5">
                        Current focus: <strong className="text-gray-200">{s.primary_gap}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-[10px] text-surface-variant uppercase font-bold">Accuracy</div>
                      <div className="font-bold text-sm text-white">{s.score_percentage}%</div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-surface-variant uppercase font-bold">Twin Mastery</div>
                      <div className="font-black text-sm text-primary-light">
                        {Math.round(s.overall_mastery * 100)}%
                      </div>
                    </div>

                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        s.active_misconceptions_count > 0
                          ? 'bg-amber-950/40 text-amber-300 border-amber-500/30'
                          : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {s.active_misconceptions_count > 0 ? `${s.active_misconceptions_count} Gaps` : 'On Track'}
                    </span>

                    <button
                      className="btn btn-secondary text-xs px-3 py-1.5 rounded-lg border border-white/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStudentId(s.id);
                      }}
                    >
                      Inspect Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Student Learning Profile Modal / Inspection Drawer */}
          {selectedStudent && (
            <div className="card-panel p-6 rounded-2xl border border-primary/40 bg-surface-container-low shadow-[0_0_30px_rgba(104,0,203,0.2)]">
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-primary-light flex items-center justify-center font-black text-sm text-black">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">
                      {selectedStudent.name} — Student Learning Profile
                    </h4>
                    <p className="text-xs text-surface-variant">
                      Verified continuous model state • Read-only observation
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedStudentId(null)}
                  className="text-surface-variant hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Profile Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                <div className="p-4 bg-surface-container rounded-xl border border-white/5">
                  <div className="text-[11px] text-surface-variant uppercase font-bold">Estimated Mastery</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    {Math.round(selectedStudent.overall_mastery * 100)}%
                  </div>
                  <div className="text-xs text-surface-variant mt-1">High confidence evidence</div>
                </div>

                <div className="p-4 bg-surface-container rounded-xl border border-white/5">
                  <div className="text-[11px] text-surface-variant uppercase font-bold">Active Learning Gaps</div>
                  <div className="text-2xl font-black text-amber-400 mt-1">
                    {selectedStudent.active_misconceptions_count}
                  </div>
                  <div className="text-xs text-surface-variant mt-1">Requiring targeted instruction</div>
                </div>

                <div className="p-4 bg-surface-container rounded-xl border border-white/5">
                  <div className="text-[11px] text-surface-variant uppercase font-bold">Primary Root Gap</div>
                  <div className="text-sm font-bold text-white mt-2">
                    {selectedStudent.primary_gap}
                  </div>
                  <div className="text-xs text-surface-variant mt-1">Identified from question responses</div>
                </div>
              </div>

              {/* Recommended Teaching Action */}
              <div className="p-4 bg-primary/10 rounded-xl border border-primary/30 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="text-xs font-bold text-primary-light uppercase tracking-wider">
                    Recommended Teaching Action
                  </div>
                  <div className="text-sm font-semibold text-white mt-1">
                    Reinforce the distributive principle: review applying multipliers across all terms inside parentheses before retesting.
                  </div>
                </div>
                <button
                  className="btn btn-primary purple-glow-btn text-xs px-4 py-2"
                  onClick={() => handleTabChange('insights')}
                >
                  View in Comparative Insights
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. INSIGHTS VIEW (SAME-SCORE DIFFERENT-TWINS COMPARATIVE PROOF) */}
      {currentTab === 'insights' && ss && (
        <div className="flex flex-col gap-6">
          
          {/* Banner */}
          <div className="card-panel relative overflow-hidden p-8 rounded-2xl border border-white/10 text-center">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-0" />
            
            <div className="relative z-10">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/20 text-primary-light border border-primary/30 uppercase tracking-wider mb-2 inline-block">
                Same-Score Comparison
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                {ss.headline}
              </h2>
              <p className="text-sm text-surface-variant max-w-2xl mx-auto mt-2 leading-relaxed">
                {ss.core_thesis}
              </p>
            </div>
          </div>

          {/* Side-by-Side Dual Card Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Student A Card */}
            <div className="card-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-primary/40 transition-all">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                  <span className="text-sm font-bold text-white px-3 py-1 rounded-full bg-primary/20 border border-primary/30">
                    {ss.student_a.name}
                  </span>
                  <div className="text-right">
                    <div className="text-[10px] text-surface-variant uppercase font-bold">Identical Score</div>
                    <div className="text-2xl font-black text-white">
                      {ss.student_a.score}%
                    </div>
                  </div>
                </div>

                <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">
                  Primary Cognitive Gap
                </div>
                <h4 className="text-lg font-bold text-white mb-3">
                  {ss.student_a.primary_weakness}
                </h4>

                <div className="p-3.5 bg-surface-container-low rounded-xl border border-white/5 text-xs mb-3">
                  <div className="text-surface-variant font-semibold">Detected Mistake Pattern:</div>
                  <div className="font-mono font-bold text-white mt-1">
                    {ss.student_a.active_misconception}
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-950/20 rounded-xl border border-emerald-500/20 text-xs">
                  <div className="text-emerald-400 font-semibold">Recommended Intervention:</div>
                  <div className="text-emerald-200/90 mt-1 leading-relaxed">
                    {ss.student_a.recommended_next_step}
                  </div>
                </div>
              </div>
            </div>

            {/* Student B Card */}
            <div className="card-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-primary-light/40 transition-all">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                  <span className="text-sm font-bold text-white px-3 py-1 rounded-full bg-secondary-container/40 border border-secondary/30">
                    {ss.student_b.name}
                  </span>
                  <div className="text-right">
                    <div className="text-[10px] text-surface-variant uppercase font-bold">Identical Score</div>
                    <div className="text-2xl font-black text-white">
                      {ss.student_b.score}%
                    </div>
                  </div>
                </div>

                <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">
                  Primary Cognitive Gap
                </div>
                <h4 className="text-lg font-bold text-white mb-3">
                  {ss.student_b.primary_weakness}
                </h4>

                <div className="p-3.5 bg-surface-container-low rounded-xl border border-white/5 text-xs mb-3">
                  <div className="text-surface-variant font-semibold">Detected Mistake Pattern:</div>
                  <div className="font-mono font-bold text-white mt-1">
                    {ss.student_b.active_misconception}
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-950/20 rounded-xl border border-emerald-500/20 text-xs">
                  <div className="text-emerald-400 font-semibold">Recommended Intervention:</div>
                  <div className="text-emerald-200/90 mt-1 leading-relaxed">
                    {ss.student_b.recommended_next_step}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Differentiator Conclusion Banner */}
          <div className="card-panel p-5 rounded-2xl border border-white/10 text-center bg-surface-container-low">
            <span className="text-sm font-bold text-white">
              Same score. Different evidence. Different cognitive needs.
            </span>
          </div>
        </div>
      )}

      {/* 4. CONTENT & MATERIALS TAB */}
      {currentTab === 'content' && (
        <div className="flex flex-col gap-6">
          <div className="card-panel p-6 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">
                  Teaching Content & Curated Materials
                </h3>
                <p className="text-xs text-surface-variant mt-1">
                  Upload teaching materials, review extracted skills, and curate diagnostic assessments for your cohort.
                </p>
              </div>

              <button
                className="btn btn-primary purple-glow-btn flex items-center gap-2 text-xs px-4 py-2 rounded-xl"
                onClick={() => setShowUploadModal(true)}
              >
                <UploadCloud size={16} /> Upload Teaching Material (PDF)
              </button>
            </div>

            {/* Content Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-surface-container-low border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <span className="badge badge-purple">Core Module</span>
                  <span className="text-xs text-surface-variant">Active in Curriculum</span>
                </div>
                <h4 className="text-base font-bold text-white">
                  Linear Equations in One Variable
                </h4>
                <p className="text-xs text-surface-variant mt-1 mb-4 leading-relaxed">
                  Equality principles, multi-step term collection, distributive property expansion, and variable isolation.
                </p>
                <div className="flex items-center justify-between text-xs border-t border-white/5 pt-3">
                  <span className="text-gray-300">4 Core Skills • 8 Diagnostic Questions</span>
                  <span className="text-emerald-400 font-semibold">Ready</span>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-surface-container-low border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <span className="badge badge-emerald">Uploaded Material</span>
                  <span className="text-xs text-surface-variant">Processed</span>
                </div>
                <h4 className="text-base font-bold text-white">
                  Quadratic Expressions & Factoring
                </h4>
                <p className="text-xs text-surface-variant mt-1 mb-4 leading-relaxed">
                  Polynomial factorization, roots identification, and zero-product rule application.
                </p>
                <div className="flex items-center justify-between text-xs border-t border-white/5 pt-3">
                  <span className="text-gray-300">3 Identified Skills • 6 Diagnostic Questions</span>
                  <span className="text-emerald-400 font-semibold">Available to Cohort</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Material Modal */}
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
