import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { TeacherOverview } from '../../types';
import {
  Users,
  UserCheck,
  TrendingUp,
  Grid,
  Scale,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
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
  Search,
  Bell,
  UserRound,
  ClipboardCheck,
  ChartNoAxesColumnIncreasing,
  BookOpen,
  Plus,
  Download,
  Lightbulb,
  ChevronRight,
  Pencil,
  Sprout,
  MoreHorizontal
} from 'lucide-react';
import { DocumentUploadModal } from '../upload/DocumentUploadModal';

type TeacherTab = 'overview' | 'students' | 'insights' | 'content';
type TeacherCohortStudent = {
  student_id: string;
  full_name: string;
  overall_mastery: number;
  risk_status: string;
  active_interventions_count: number;
};
type TeacherTopicPerformance = {
  topic_id: string;
  topic_code: string;
  topic_title: string;
  avg_mastery: number;
  students_struggling_count: number;
};

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

interface TeacherOverviewPanelProps {
  students: TeacherOverview['students'];
  topics: TeacherTopicPerformance[];
  totalStudents: number;
  averageMastery: number;
  studentsAtRisk: number;
  onNavigate: (tab: TeacherTab) => void;
}

const TeacherOverviewPanel: React.FC<TeacherOverviewPanelProps> = ({ students, topics, totalStudents, averageMastery, studentsAtRisk, onNavigate }) => {
  const sortedStudents = [...students].sort((a, b) => a.score_percentage - b.score_percentage);
  const chartStudents = sortedStudents.length > 7
    ? Array.from({ length: 7 }, (_, index) => sortedStudents[Math.round(index * (sortedStudents.length - 1) / 6)])
    : sortedStudents;
  const point = (value: number, index: number, count: number) => `${42 + (count <= 1 ? 0 : (index * 610) / (count - 1))},${178 - Math.max(0, Math.min(100, value)) * 1.48}`;
  const scoreLine = chartStudents.map((student, index) => point(student.score_percentage, index, chartStudents.length)).join(' ');
  const averageLine = chartStudents.map((_, index) => point(averageMastery, index, chartStudents.length)).join(' ');
  const engaged = students.filter(student => student.overall_mastery >= 0.7).length;
  const developing = students.filter(student => student.overall_mastery >= 0.4 && student.overall_mastery < 0.7).length;
  const support = students.filter(student => student.overall_mastery < 0.4).length;
  const bandTotal = Math.max(1, engaged + developing + support);
  const engagedPct = Math.round(engaged / bandTotal * 100);
  const developingPct = Math.round(developing / bandTotal * 100);
  const supportPct = students.length ? Math.max(0, 100 - engagedPct - developingPct) : 0;
  const donut = `conic-gradient(#273741 0 ${engagedPct}%, #899197 ${engagedPct}% ${engagedPct + developingPct}%, #c8cccd ${engagedPct + developingPct}% 100%)`;
  const skillRows = topics.slice(0, 5);
  const recentTopics = [...topics].sort((a, b) => b.students_struggling_count - a.students_struggling_count).slice(0, 4);

  const downloadReport = () => {
    const rows = [['Student', 'Mastery', 'Risk', 'Active interventions'], ...students.map(student => [student.name, `${Math.round(student.overall_mastery * 100)}%`, student.primary_gap, String(student.active_misconceptions_count)])];
    const csv = rows.map(row => row.map(value => `"${value.replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'teacher-cohort-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="teacher-overview-content">
      <section className="teacher-overview-stats" aria-label="Cohort summary">
        <article className="teacher-overview-stat"><span className="teacher-stat-icon"><Users size={28} /></span><div><small>Total Students</small><strong>{totalStudents}</strong><p>Enrolled in your cohort</p></div></article>
        <article className="teacher-overview-stat"><span className="teacher-stat-icon"><UserRound size={28} /></span><div><small>Active Learners</small><strong>{students.filter(student => student.overall_mastery > 0).length}</strong><p>With recorded learning evidence</p></div></article>
        <article className="teacher-overview-stat"><span className="teacher-stat-icon"><ClipboardCheck size={28} /></span><div><small>Learners at Risk</small><strong>{studentsAtRisk}</strong><p>Below 50% mastery</p></div></article>
        <article className="teacher-overview-stat"><span className="teacher-stat-icon"><ChartNoAxesColumnIncreasing size={28} /></span><div><small>Average Mastery</small><strong>{averageMastery}%</strong><p>Across current learner records</p></div></article>
      </section>

      <section className="teacher-overview-middle">
        <article className="teacher-overview-panel teacher-performance-panel">
          <header><div><h2>Class Performance</h2><p>Learner mastery compared with the cohort average.</p></div><span className="teacher-chart-legend"><i className="score-dot" /> Learner mastery <i className="mastery-dot" /> Cohort average</span></header>
          {chartStudents.length ? <div className="teacher-chart-wrap">
            <svg className="teacher-performance-chart" viewBox="0 0 700 220" role="img" aria-label="Student scores and twin mastery comparison">
              {[28, 65, 102, 139, 176].map((y, index) => <g key={y}><line x1="42" x2="658" y1={y} y2={y} /><text x="31" y={y + 4}>{100 - index * 25}</text></g>)}
              {chartStudents.length > 1 && <><polyline className="score-line" points={scoreLine} /><polyline className="mastery-line" points={averageLine} /></>}
              {chartStudents.map((student, index) => <g key={student.id}><circle className="score-point" cx={42 + (chartStudents.length <= 1 ? 0 : index * 610 / (chartStudents.length - 1))} cy={178 - Math.max(0, Math.min(100, student.score_percentage)) * 1.48} r="3.5" /><text className="teacher-x-label" x={42 + (chartStudents.length <= 1 ? 0 : index * 610 / (chartStudents.length - 1))} y="204">{chartStudents.length === 1 ? 'Student' : `Student ${index + 1}`}</text></g>)}
            </svg>
          </div> : <p className="teacher-overview-empty">Class performance appears after students record learning evidence.</p>}
        </article>

        <article className="teacher-overview-panel teacher-subject-panel">
          <header><div><h2>Subject Performance</h2><p>Average mastery by topic.</p></div><button onClick={() => onNavigate('insights')}>View all <ArrowRight size={15} /></button></header>
          {skillRows.length ? <div className="teacher-subject-list">{skillRows.map(topic => <div className="teacher-subject-row" key={topic.topic_id}><span title={topic.topic_title}>{topic.topic_title}</span><div><i style={{ width: `${Math.max(0, Math.min(100, topic.avg_mastery * 100))}%` }} /></div><strong>{Math.round(topic.avg_mastery * 100)}%</strong></div>)}</div> : <p className="teacher-overview-empty">Topic mastery will appear as students complete assessments.</p>}
        </article>
      </section>

      <section className="teacher-overview-bottom">
        <article className="teacher-overview-panel teacher-recent-panel">
          <header><div><h2>Recent Learning Signals</h2><p>Topics showing the most support needs.</p></div><button onClick={() => onNavigate('insights')}>View all <ArrowRight size={15} /></button></header>
          <div className="teacher-recent-list">{recentTopics.length ? recentTopics.map(topic => <div key={topic.topic_id}><span className="teacher-recent-icon"><BookOpen size={21} /></span><div><strong>{topic.topic_title}</strong><small>{topic.students_struggling_count} {topic.students_struggling_count === 1 ? 'student may' : 'students may'} need support</small></div></div>) : <p className="teacher-overview-empty">New learning signals will appear here.</p>}</div>
        </article>

        <article className="teacher-overview-panel teacher-engagement-panel">
          <header><div><h2>Student Mastery</h2><p>Cohort distribution by current mastery.</p></div></header>
          <div className="teacher-mastery-summary"><div className="teacher-mastery-donut" style={{ background: students.length ? donut : 'conic-gradient(#d7d9d8 0 100%)' }}><div><strong>{totalStudents}</strong><small>Students</small></div></div><ul><li><i className="engaged-dot" /><span>Established</span><strong>{engagedPct}%</strong></li><li><i className="developing-dot" /><span>Developing</span><strong>{developingPct}%</strong></li><li><i className="support-dot" /><span>Needs support</span><strong>{supportPct}%</strong></li></ul></div>
        </article>

        <article className="teacher-overview-panel teacher-actions-panel">
          <header><div><h2>Quick Actions</h2><p>Common tasks for your teaching workflow.</p></div></header>
          <div className="teacher-quick-actions">
            <button onClick={() => onNavigate('students')}><span><Users size={22} /></span><i><strong>View All Students</strong><small>See student learning profiles</small></i><ChevronRight size={18} /></button>
            <button onClick={() => onNavigate('content')}><span><Plus size={24} /></span><i><strong>Create Assessment</strong><small>Build or assign learning content</small></i><ChevronRight size={18} /></button>
            <button onClick={() => onNavigate('content')}><span><FileText size={22} /></span><i><strong>Share Resources</strong><small>Manage notes and materials</small></i><ChevronRight size={18} /></button>
            <button onClick={downloadReport}><span><Download size={22} /></span><i><strong>Export Report</strong><small>Download cohort mastery data</small></i><ChevronRight size={18} /></button>
          </div>
        </article>
      </section>

      <aside className="teacher-tip-panel"><span><Lightbulb size={23} /></span><div><strong>Teaching Tip</strong><p>{skillRows[0] ? `Use insight reports to review ${skillRows[0].topic_title}, currently averaging ${Math.round(skillRows[0].avg_mastery * 100)}% mastery.` : 'Use insight reports to identify common misconceptions and plan your next class.'}</p></div><button onClick={() => onNavigate('insights')}>View Insights <ArrowRight size={15} /></button></aside>
    </div>
  );
};

interface TeacherStudentsPanelProps {
  students: TeacherOverview['students'];
  totalStudents: number;
  search: string;
  onSearch: (value: string) => void;
  selectedStudentId: string | null;
  onSelectStudent: (id: string) => void;
  onNavigate: (tab: TeacherTab) => void;
}

const TeacherStudentsPanel: React.FC<TeacherStudentsPanelProps> = ({ students, totalStudents, search, onSearch, selectedStudentId, onSelectStudent, onNavigate }) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [search, statusFilter]);
  const pageSize = 6;
  const statusOf = (mastery: number) => mastery >= 0.85 ? 'High Performer' : mastery >= 0.5 ? 'On Track' : 'Needs Support';
  const highPerformers = students.filter(student => student.overall_mastery >= 0.85);
  const needsSupport = students.filter(student => student.overall_mastery < 0.5);
  const onTrack = students.filter(student => student.overall_mastery >= 0.5 && student.overall_mastery < 0.85);
  const matchingStudents = students.filter(student => {
    const matchesSearch = `${student.name} ${student.primary_gap}`.toLowerCase().includes(search.toLowerCase());
    const status = statusOf(student.overall_mastery);
    return matchesSearch && (statusFilter === 'all' || status === statusFilter);
  });
  const pageCount = Math.max(1, Math.ceil(matchingStudents.length / pageSize));
  const visibleStudents = matchingStudents.slice((page - 1) * pageSize, page * pageSize);
  const selectedStudent = students.find(student => student.id === selectedStudentId);
  const countPct = (count: number) => totalStudents ? Math.round(count / totalStudents * 100) : 0;
  const highPct = countPct(highPerformers.length);
  const trackPct = countPct(onTrack.length);
  const supportPct = totalStudents ? Math.max(0, 100 - highPct - trackPct) : 0;
  const ring = `conic-gradient(#263741 0 ${highPct}%, #9ca3a6 ${highPct}% ${highPct + trackPct}%, #d2d5d5 ${highPct + trackPct}% 100%)`;
  const recentSignals = [...students].sort((a, b) => a.overall_mastery - b.overall_mastery).slice(0, 4);
  const firstRow = matchingStudents.length ? (page - 1) * pageSize + 1 : 0;
  const lastRow = Math.min(page * pageSize, matchingStudents.length);

  return <div className="teacher-students-content">
    <section className="teacher-overview-stats" aria-label="Student summary">
      <article className="teacher-overview-stat"><span className="teacher-stat-icon"><Users size={28} /></span><div><small>Total Students</small><strong>{totalStudents}</strong><p>Enrolled in your cohort</p></div></article>
      <article className="teacher-overview-stat"><span className="teacher-stat-icon"><UserRound size={28} /></span><div><small>Active Learners</small><strong>{students.filter(student => student.overall_mastery > 0).length}</strong><p>With recorded learning evidence</p></div></article>
      <article className="teacher-overview-stat"><span className="teacher-stat-icon"><AlertTriangle size={28} /></span><div><small>Needs Support</small><strong>{needsSupport.length}</strong><p>{countPct(needsSupport.length)}% of the cohort</p></div></article>
      <article className="teacher-overview-stat"><span className="teacher-stat-icon"><Award size={28} /></span><div><small>High Performers</small><strong>{highPerformers.length}</strong><p>Mastery at 85% or above</p></div></article>
    </section>

    <section className="teacher-students-layout">
      <article className="teacher-overview-panel teacher-student-roster">
        <header className="teacher-roster-header"><div><h2>Students List</h2><p>View and manage your students’ progress.</p></div><div className="teacher-roster-controls"><label><Search size={17} /><input value={search} onChange={event => { onSearch(event.target.value); setPage(1); }} placeholder="Search students..." aria-label="Search students" /></label><select value={statusFilter} onChange={event => { setStatusFilter(event.target.value); setPage(1); }} aria-label="Filter students by performance"><option value="all">All Students</option><option value="High Performer">High Performers</option><option value="On Track">On Track</option><option value="Needs Support">Needs Support</option></select></div></header>
        <div className="teacher-student-table-wrap"><table className="teacher-student-table"><thead><tr><th>Name</th><th>Learning Focus</th><th>Mastery</th><th>Progress</th><th>Status</th><th>Interventions</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
          {visibleStudents.map(student => { const status = statusOf(student.overall_mastery); return <tr key={student.id} className={selectedStudentId === student.id ? 'is-selected' : ''} onClick={() => onSelectStudent(student.id)}><td><span className="teacher-student-name"><span className="teacher-student-avatar">{student.name.charAt(0)}</span><strong>{student.name}</strong></span></td><td>{student.primary_gap}</td><td>{Math.round(student.overall_mastery * 100)}%</td><td><span className="teacher-progress-track"><i style={{ width: `${Math.max(0, Math.min(100, student.overall_mastery * 100))}%` }} /></span></td><td><span className={`teacher-student-status ${status === 'Needs Support' ? 'status-support' : status === 'High Performer' ? 'status-high' : 'status-track'}`}>{status}</span></td><td>{student.active_misconceptions_count}</td><td><button type="button" aria-label={`View ${student.name}`} onClick={event => { event.stopPropagation(); onSelectStudent(student.id); }}><MoreHorizontal size={19} /></button></td></tr>; })}
          {!visibleStudents.length && <tr><td colSpan={7} className="teacher-student-empty">No students match the current search or filter.</td></tr>}
        </tbody></table></div>
        <footer className="teacher-student-pagination"><span>Showing {firstRow}–{lastRow} of {matchingStudents.length} students</span><nav aria-label="Student pages"><button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage(value => Math.max(1, value - 1))}>‹</button>{Array.from({ length: pageCount }, (_, index) => index + 1).slice(0, 5).map(pageNumber => <button type="button" key={pageNumber} aria-current={page === pageNumber ? 'page' : undefined} className={page === pageNumber ? 'is-current' : ''} onClick={() => setPage(pageNumber)}>{pageNumber}</button>)}{pageCount > 5 && <span>…</span>}{pageCount > 5 && <button type="button" onClick={() => setPage(pageCount)}>{pageCount}</button>}<button type="button" aria-label="Next page" disabled={page >= pageCount} onClick={() => setPage(value => Math.min(pageCount, value + 1))}>›</button></nav></footer>
      </article>

      <aside className="teacher-student-side-panels">
        <article className="teacher-overview-panel teacher-student-distribution"><header><div><h2>Student Performance Distribution</h2><p>Students across current mastery levels.</p></div></header><div className="teacher-student-distribution-body"><div className="teacher-mastery-donut" style={{ background: totalStudents ? ring : 'conic-gradient(#d7d9d8 0 100%)' }}><div><strong>{totalStudents}</strong><small>Students</small></div></div><ul><li><i className="engaged-dot" /><span>High Performers</span><strong>{highPct}% ({highPerformers.length})</strong></li><li><i className="developing-dot" /><span>On Track</span><strong>{trackPct}% ({onTrack.length})</strong></li><li><i className="support-dot" /><span>Needs Support</span><strong>{supportPct}% ({needsSupport.length})</strong></li></ul></div></article>
        <article className="teacher-overview-panel teacher-student-signals"><header><div><h2>Student Support Signals</h2><p>Students with the lowest current mastery.</p></div><button onClick={() => onNavigate('insights')}>View insights <ArrowRight size={14} /></button></header><div className="teacher-recent-list">{recentSignals.length ? recentSignals.map(student => <div key={student.id}><span className="teacher-recent-icon"><AlertTriangle size={20} /></span><div><strong>{student.name} · {Math.round(student.overall_mastery * 100)}% mastery</strong><small>{student.primary_gap}</small></div></div>) : <p className="teacher-overview-empty">Student signals will appear as learners begin.</p>}</div></article>
      </aside>
    </section>

    {selectedStudent && <section className="teacher-overview-panel teacher-selected-student"><header><div><h2>{selectedStudent.name} · Student Profile</h2><p>Current cohort learning snapshot.</p></div><button onClick={() => onNavigate('insights')}>View insights <ArrowRight size={14} /></button></header><div className="teacher-selected-student-metrics"><div><small>Mastery</small><strong>{Math.round(selectedStudent.overall_mastery * 100)}%</strong></div><div><small>Active interventions</small><strong>{selectedStudent.active_misconceptions_count}</strong></div><div><small>Current status</small><strong>{statusOf(selectedStudent.overall_mastery)}</strong></div><div><small>Learning focus</small><strong>{selectedStudent.primary_gap}</strong></div></div></section>}

    <aside className="teacher-tip-panel"><span><Lightbulb size={23} /></span><div><strong>Pro Tip</strong><p>Use student insights to identify learning gaps and create personalized practice sessions.</p></div><button onClick={() => onNavigate('insights')}>View Insights <ArrowRight size={15} /></button></aside>
  </div>;
};

interface TeacherInsightsPanelProps {
  students: TeacherOverview['students'];
  topics: TeacherTopicPerformance[];
  totalStudents: number;
  averageMastery: number;
  onNavigate: (tab: TeacherTab) => void;
}

const TeacherInsightsPanel: React.FC<TeacherInsightsPanelProps> = ({ students, topics, totalStudents, averageMastery, onNavigate }) => {
  const high = students.filter(student => student.overall_mastery >= 0.85).length;
  const onTrack = students.filter(student => student.overall_mastery >= 0.5 && student.overall_mastery < 0.85).length;
  const atRisk = students.filter(student => student.overall_mastery < 0.5).length;
  const active = students.filter(student => student.overall_mastery > 0).length;
  const ranked = [...topics].sort((a, b) => b.avg_mastery - a.avg_mastery);
  const focusTopics = [...topics].sort((a, b) => b.students_struggling_count - a.students_struggling_count);
  const strongTopic = ranked[0];
  const focusTopic = focusTopics[0];
  const plotPoints = topics.slice(0, 6);
  const masteryPoints = plotPoints.map((topic, index) => `${38 + (plotPoints.length < 2 ? 0 : index * 500 / (plotPoints.length - 1))},${156 - Math.max(0, Math.min(100, topic.avg_mastery * 100)) * 1.25}`).join(' ');
  const riskPoints = plotPoints.map((topic, index) => `${38 + (plotPoints.length < 2 ? 0 : index * 500 / (plotPoints.length - 1))},${156 - (totalStudents ? Math.min(100, topic.students_struggling_count / totalStudents * 100) : 0) * 1.25}`).join(' ');
  const highPct = totalStudents ? Math.round(high / totalStudents * 100) : 0;
  const trackPct = totalStudents ? Math.round(onTrack / totalStudents * 100) : 0;
  const riskPct = Math.max(0, 100 - highPct - trackPct);
  const distributionRing = `conic-gradient(#263741 0 ${highPct}%, #8d969b ${highPct}% ${highPct + trackPct}%, #c7ccce ${highPct + trackPct}% 100%)`;
  const evidencePct = totalStudents ? Math.round(active / totalStudents * 100) : 0;

  return <div className="teacher-insights-content">
    <section className="teacher-overview-stats" aria-label="Cohort insight summary">
      <article className="teacher-overview-stat"><span className="teacher-stat-icon"><Users size={28} /></span><div><small>Total Students</small><strong>{totalStudents}</strong><p>In your current cohort</p></div></article>
      <article className="teacher-overview-stat"><span className="teacher-stat-icon"><AlertTriangle size={28} /></span><div><small>At Risk</small><strong>{atRisk}</strong><p>{riskPct}% of the cohort</p></div></article>
      <article className="teacher-overview-stat"><span className="teacher-stat-icon"><UserCheck size={28} /></span><div><small>On Track</small><strong>{onTrack}</strong><p>{totalStudents ? Math.round(onTrack / totalStudents * 100) : 0}% of the cohort</p></div></article>
      <article className="teacher-overview-stat"><span className="teacher-stat-icon"><ChartNoAxesColumnIncreasing size={28} /></span><div><small>Excelling</small><strong>{high}</strong><p>85% mastery or higher</p></div></article>
    </section>

    <section className="teacher-insights-charts">
      <article className="teacher-overview-panel teacher-insight-chart-panel">
        <header><div><h2>Subject Performance</h2><p>Average mastery across topics.</p></div><span className="teacher-chart-legend"><i className="score-dot" /> Average mastery</span></header>
        {ranked.length ? <div className="teacher-insight-bars">{ranked.slice(0, 6).map(topic => <div className="teacher-insight-bar-row" key={topic.topic_id}><span title={topic.topic_title}>{topic.topic_title}</span><div><i style={{ width: `${Math.max(0, Math.min(100, topic.avg_mastery * 100))}%` }} /></div><strong>{Math.round(topic.avg_mastery * 100)}%</strong></div>)}</div> : <p className="teacher-overview-empty">Topic performance will appear as students complete assessments.</p>}
      </article>

      <article className="teacher-overview-panel teacher-insight-chart-panel">
        <header><div><h2>Learning Patterns</h2><p>Mastery and support needs by topic.</p></div><span className="teacher-chart-legend"><i className="score-dot" /> Avg mastery <i className="mastery-dot" /> Needs support</span></header>
        {plotPoints.length ? <svg className="teacher-insight-trend" viewBox="0 0 570 205" role="img" aria-label="Topic mastery and support need comparison">
          {[22, 54, 86, 118, 150].map((y, index) => <g key={y}><line x1="38" x2="540" y1={y} y2={y} /><text x="30" y={y + 4}>{100 - index * 25}</text></g>)}
          {plotPoints.length > 1 && <><polyline className="score-line" points={masteryPoints} /><polyline className="mastery-line" points={riskPoints} /></>}
          {plotPoints.map((topic, index) => <text key={topic.topic_id} className="teacher-topic-axis-label" x={38 + (plotPoints.length < 2 ? 0 : index * 500 / (plotPoints.length - 1))} y="181">{topic.topic_title.length > 11 ? `${topic.topic_title.slice(0, 10)}…` : topic.topic_title}</text>)}
        </svg> : <p className="teacher-overview-empty">Learning patterns will appear when topic data is available.</p>}
      </article>
    </section>

    <section className="teacher-insights-lower">
      <article className="teacher-overview-panel teacher-insight-topic-panel"><header><div><h2>Topic Mastery Distribution</h2><p>Current cohort mastery by topic.</p></div></header>
        {ranked.length ? <div className="teacher-subject-list">{ranked.slice(0, 5).map(topic => <div className="teacher-subject-row" key={topic.topic_id}><span title={topic.topic_title}>{topic.topic_title}</span><div><i style={{ width: `${Math.max(0, Math.min(100, topic.avg_mastery * 100))}%` }} /></div><strong>{Math.round(topic.avg_mastery * 100)}%</strong></div>)}</div> : <p className="teacher-overview-empty">No topic mastery is available yet.</p>}
      </article>
      <article className="teacher-overview-panel teacher-insight-progress-panel"><header><div><h2>Student Progress Overview</h2><p>Distribution across mastery levels.</p></div></header><div className="teacher-student-distribution-body"><div className="teacher-mastery-donut" style={{ background: totalStudents ? distributionRing : 'conic-gradient(#d7d9d8 0 100%)' }}><div><strong>{totalStudents}</strong><small>Students</small></div></div><ul><li><i className="engaged-dot" /><span>Strong</span><strong>{highPct}% ({high})</strong></li><li><i className="developing-dot" /><span>Developing</span><strong>{trackPct}% ({onTrack})</strong></li><li><i className="support-dot" /><span>Needs Attention</span><strong>{riskPct}% ({atRisk})</strong></li></ul></div></article>
      <article className="teacher-overview-panel teacher-insight-evidence-panel"><header><div><h2>Learning Evidence</h2><p>Students with recorded mastery.</p></div></header><div className="teacher-evidence-meter"><div><span>Active learners</span><strong>{active} / {totalStudents}</strong></div><div className="teacher-progress-track"><i style={{ width: `${evidencePct}%` }} /></div><p>{evidencePct}% of students have recorded mastery evidence. Average mastery is {averageMastery}%.</p></div><button className="teacher-insights-secondary-action" onClick={() => onNavigate('students')}>Review students <ArrowRight size={14} /></button></article>
    </section>

    <section className="teacher-insights-actions">
      <article className="teacher-overview-panel teacher-key-insights"><header><div><h2>Key Insights</h2><p>What the cohort data shows.</p></div></header><div className="teacher-key-insight-grid">
        <div><span><TrendingUp size={21} /></span><section><strong>Strongest topic</strong><p>{strongTopic ? `${strongTopic.topic_title} averages ${Math.round(strongTopic.avg_mastery * 100)}% mastery.` : 'Topic results will appear as assessments are completed.'}</p></section></div>
        <div><span><AlertTriangle size={21} /></span><section><strong>Needs attention</strong><p>{focusTopic ? `${focusTopic.topic_title} has ${focusTopic.students_struggling_count} students needing support.` : `${atRisk} students are below 50% mastery.`}</p></section></div>
        <div><span><BookOpen size={21} /></span><section><strong>Cohort mastery</strong><p>The current average mastery across learners is {averageMastery}%.</p></section></div>
      </div></article>
      <article className="teacher-overview-panel teacher-recommendations"><header><div><h2>Actionable Recommendations</h2><p>Suggested next steps from current learning data.</p></div></header><div className="teacher-recommendation-list">
        {(focusTopics.length ? focusTopics.slice(0, 3) : []).map((topic, index) => <button key={topic.topic_id} onClick={() => onNavigate(index === 0 ? 'students' : 'content')}><span>{index === 0 ? <BookOpen size={20} /> : index === 1 ? <Users size={20} /> : <Sparkles size={20} />}</span><i><strong>{index === 0 ? `Focus on ${topic.topic_title}` : index === 1 ? 'Reinforce core concepts' : 'Personalized practice'}</strong><small>{topic.students_struggling_count} students need added practice in this topic.</small></i><ChevronRight size={17} /></button>)}
        {!focusTopics.length && <p className="teacher-overview-empty">Recommendations will appear when topic performance data is available.</p>}
      </div></article>
    </section>
  </div>;
};

type TeacherMaterialDocument = { id: string; title: string; file_path: string; file_size: number; mime_type: string; status: string; uploaded_at: string };
type TeacherMaterialSubject = { id: string; name: string };
type TeacherMaterialChapter = { id: string; title: string; subject_id: string; topics?: Array<{ id: string; title: string }> };

interface TeacherMaterialsPanelProps {
  refreshKey: number;
  onUpload: () => void;
}

const TeacherMaterialsPanel: React.FC<TeacherMaterialsPanelProps> = ({ refreshKey, onUpload }) => {
  const [documents, setDocuments] = useState<TeacherMaterialDocument[]>([]);
  const [subjects, setSubjects] = useState<TeacherMaterialSubject[]>([]);
  const [chapters, setChapters] = useState<TeacherMaterialChapter[]>([]);
  const [activeSubject, setActiveSubject] = useState('all');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let alive = true;
    Promise.allSettled([apiClient.getDocuments(), apiClient.getSubjects(), apiClient.getChapters()]).then(([docsResult, subjectsResult, chaptersResult]) => {
      if (!alive) return;
      if (docsResult.status === 'fulfilled') setDocuments(docsResult.value);
      if (subjectsResult.status === 'fulfilled') setSubjects(subjectsResult.value);
      if (chaptersResult.status === 'fulfilled') setChapters(chaptersResult.value as unknown as TeacherMaterialChapter[]);
    });
    return () => { alive = false; };
  }, [refreshKey]);

  const matchingTopics = subjects.filter(subject => activeSubject === 'all' || subject.id === activeSubject);
  const visibleDocs = documents.filter(doc => doc.title.toLowerCase().includes(query.toLowerCase()));
  const topicCount = chapters.reduce((count, chapter) => count + (chapter.topics?.length || 0), 0);
  const formattedDate = (date: string) => {
    const age = Date.now() - new Date(date).getTime();
    if (!Number.isFinite(age) || age < 0) return 'Recently';
    const hours = Math.floor(age / 3600000);
    if (hours < 24) return hours < 1 ? 'Just now' : `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    const days = Math.floor(hours / 24);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  };
  const materialKind = (mime: string) => mime.includes('pdf') ? 'PDF' : mime.includes('presentation') ? 'Slides' : mime.includes('word') ? 'Document' : 'File';
  const filteredChapters = chapters.filter(chapter => matchingTopics.some(subject => subject.id === chapter.subject_id));

  return <div className="teacher-materials-content">
    <section className="teacher-overview-stats" aria-label="Teaching resource summary">
      <article className="teacher-overview-stat"><span className="teacher-stat-icon"><FileText size={27} /></span><div><small>Total Materials</small><strong>{documents.length}</strong><p>Uploaded to your library</p></div></article>
      <article className="teacher-overview-stat"><span className="teacher-stat-icon"><FolderOpen size={27} /></span><div><small>Organized Topics</small><strong>{topicCount}</strong><p>Across {chapters.length} curriculum units</p></div></article>
      <article className="teacher-overview-stat"><span className="teacher-stat-icon"><BookOpen size={27} /></span><div><small>Subjects</small><strong>{subjects.length}</strong><p>In your curriculum</p></div></article>
      <article className="teacher-overview-stat"><span className="teacher-stat-icon"><CheckCircle2 size={27} /></span><div><small>Processed</small><strong>{documents.filter(doc => doc.status === 'processed').length}</strong><p>Ready in your library</p></div></article>
    </section>

    {notice && <div className="teacher-material-notice" role="status"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss"><X size={15} /></button></div>}
    <section className="teacher-materials-layout">
      <div className="teacher-materials-main">
        <article className="teacher-overview-panel teacher-material-subjects">
          <header><div><h2>Browse by Subject</h2><p>Explore curriculum topics organized into units.</p></div></header>
          <nav className="teacher-material-subject-tabs" aria-label="Filter subjects">
            <button className={activeSubject === 'all' ? 'is-active' : ''} onClick={() => setActiveSubject('all')}>All Subjects</button>
            {subjects.map(subject => <button key={subject.id} className={activeSubject === subject.id ? 'is-active' : ''} onClick={() => setActiveSubject(subject.id)}>{subject.name}</button>)}
          </nav>
        </article>
        <article className="teacher-overview-panel teacher-material-topics">
          <header><div><h2>Topics</h2><p>Curriculum materials organized by subject and topic.</p></div><label><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search topics or materials..." /></label></header>
          {filteredChapters.length ? <div className="teacher-material-topic-grid">{filteredChapters.filter(chapter => `${chapter.title} ${(chapter.topics || []).map(topic => topic.title).join(' ')}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8).map((chapter, index) => <article key={chapter.id}><span>{index % 3 === 0 ? <Grid size={30} /> : index % 3 === 1 ? <Scale size={30} /> : <Sprout size={30} />}</span><strong>{chapter.title}</strong><small>{chapter.topics?.length || 0} topics <i>/</i> Curriculum unit</small><ChevronRight size={17} /></article>)}</div> : <p className="teacher-overview-empty">Curriculum topics will appear here when subjects and units are added.</p>}
        </article>
        <article className="teacher-overview-panel teacher-material-recent">
          <header><div><h2>Recent Materials</h2><p>Your recently uploaded curriculum files.</p></div><button onClick={onUpload}>Upload material <ArrowRight size={15} /></button></header>
          {visibleDocs.length ? <div className="teacher-material-table-wrap"><table><thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Added</th><th>Size</th></tr></thead><tbody>{visibleDocs.slice(0, 6).map(doc => <tr key={doc.id}><td><span><FileText size={18} /></span>{doc.title}</td><td>{materialKind(doc.mime_type)}</td><td><em className={doc.status === 'processed' ? 'is-ready' : ''}>{doc.status}</em></td><td>{formattedDate(doc.uploaded_at)}</td><td>{doc.file_size ? `${Math.max(1, Math.round(doc.file_size / 1024))} KB` : 'Not available'}</td></tr>)}</tbody></table></div> : <div className="teacher-material-empty"><FileText size={26} /><p>No uploaded materials yet.</p><button onClick={onUpload}>Upload a PDF resource</button></div>}
        </article>
      </div>
      <aside className="teacher-materials-side">
        <article className="teacher-overview-panel teacher-material-upload"><header><div><h2>Create / Upload Material</h2><p>Add resources for your students.</p></div></header><div className="teacher-material-action-grid"><button onClick={onUpload}><FileText size={24} /><strong>Upload File</strong><small>PDF curriculum resources</small></button><button onClick={() => setNotice('Link sharing is not connected yet. You can upload PDF curriculum resources here.')}><ArrowRight size={23} /><strong>Add Link</strong><small>Web resources</small></button><button onClick={() => setNotice('Note creation is not connected yet. You can upload PDF curriculum resources here.')}><Pencil size={23} /><strong>Create Notes</strong><small>Write learning notes</small></button><button onClick={() => setNotice('Lesson recording is not connected yet. You can upload PDF curriculum resources here.')}><BookOpen size={23} /><strong>Record Lesson</strong><small>Audio or video</small></button></div></article>
        <article className="teacher-overview-panel teacher-material-types"><header><div><h2>Material Types</h2><p>Formats in the resource library.</p></div></header>{['PDF', 'Slides', 'Document', 'File'].map(kind => { const count = documents.filter(doc => materialKind(doc.mime_type) === kind).length; return <div key={kind}><span><FileText size={20} /></span><i><strong>{kind === 'PDF' ? 'PDF files' : kind === 'Slides' ? 'Slides' : kind === 'Document' ? 'Documents' : 'Other files'}</strong><small>{count} {count === 1 ? 'resource' : 'resources'}</small></i><ChevronRight size={17} /></div>; })}</article>
      </aside>
    </section>
  </div>;
};

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  onSelectStudent,
  activeTab: propActiveTab,
  onTabChange
}) => {
  const [overview, setOverview] = useState<TeacherOverview>(EMPTY_TEACHER_OVERVIEW);
  const [cohortSummary, setCohortSummary] = useState({ total_students: 0, avg_cohort_mastery: 0, struggling_students_count: 0, mastered_students_count: 0, at_risk_percentage: 0 });
  const [topicPerformance, setTopicPerformance] = useState<TeacherTopicPerformance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [internalTab, setInternalTab] = useState<TeacherTab>('overview');
  
  // Selected Student for detailed profile inspection
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  
  // Teacher Material Upload modal
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [materialsRefresh, setMaterialsRefresh] = useState(0);
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
      const [summary, cohort] = await Promise.all([
        apiClient.getTeacherOverview(),
        apiClient.getTeacherCohort()
      ]);
      const topics = await apiClient.getTeacherTopicPerformance().catch(() => []);
      const summaryMetrics = summary as unknown as typeof cohortSummary;
      setCohortSummary(summaryMetrics);
      setTopicPerformance(topics);
      setOverview({
        ...EMPTY_TEACHER_OVERVIEW,
        students: cohort.map((student: TeacherCohortStudent) => ({
          id: student.student_id,
          name: student.full_name,
          score_percentage: Math.round(student.overall_mastery * 100),
          overall_mastery: student.overall_mastery,
          active_misconceptions_count: student.active_interventions_count,
          primary_gap: student.risk_status.replaceAll('_', ' '),
          skills_mastery: {}
        }))
      });
    } catch (e) {
      console.error(e);
      setOverview(EMPTY_TEACHER_OVERVIEW);
      setCohortSummary({ total_students: 0, avg_cohort_mastery: 0, struggling_students_count: 0, mastered_students_count: 0, at_risk_percentage: 0 });
      setTopicPerformance([]);
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

  // Calculate high-level class overview metrics
  const averageScore = overview.students.length ? Math.round(overview.students.reduce((sum, student) => sum + student.score_percentage, 0) / overview.students.length) : 0;
  const filteredStudents = overview.students.filter(student => `${student.name} ${student.primary_gap}`.toLowerCase().includes(studentSearch.toLowerCase()));

  return (
    <div className={`teacher-dashboard ${currentTab === 'overview' || currentTab === 'students' || currentTab === 'insights' || currentTab === 'content' ? 'teacher-overview-dashboard' : ''} flex flex-col gap-6 max-w-6xl mx-auto py-2`}>
      {loadError && <div role="status" className="teacher-load-error"><span>{loadError}</span><button onClick={loadTeacherData}>Retry</button></div>}
      {currentTab !== 'overview' && (
        <button
          type="button"
          className="page-back-button"
          onClick={() => handleTabChange('overview')}
        >
          <ArrowLeft size={15} /> Back to Overview
        </button>
      )}
      <div className="teacher-topbar"><label><Search size={18} /><input value={studentSearch} onChange={event => setStudentSearch(event.target.value)} placeholder={currentTab === 'content' ? 'Search for students, topics, or materials...' : 'Search for students, topics, or insights...'} /></label><button aria-label="Teacher notifications"><Bell size={20} /><i /></button></div>
      
      {/* Header & Sub-Navigation */}
      <div className={`teacher-header ${currentTab === 'overview' || currentTab === 'students' || currentTab === 'insights' || currentTab === 'content' ? 'teacher-overview-hero' : ''} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div>
          <div className="teacher-overview-eyebrow flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold tracking-widest text-primary-light uppercase">
              {currentTab === 'students' ? 'Students' : currentTab === 'insights' ? 'Insights' : currentTab === 'content' ? 'Contents & Materials' : 'Teacher Overview'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary-light border border-primary/30">
              Cohort Intelligence
            </span>
          </div>
          <h1 className="teacher-overview-title text-3xl font-extrabold text-white tracking-tight">
            {currentTab === 'students' ? 'Your Students.' : currentTab === 'insights' ? 'Turn Data into Impact.' : currentTab === 'content' ? 'Your Teaching Resources.' : 'Welcome, Teacher.'}
          </h1>
          <p className="teacher-overview-subtitle text-xs text-surface-variant mt-1">
            {currentTab === 'insights' ? 'Understand learning patterns and make informed decisions.' : currentTab === 'content' ? 'Organize, create, and share materials for better learning.' : 'A clearer picture of student learning.'}
          </p>
        </div>

        {(currentTab === 'overview' || currentTab === 'students' || currentTab === 'insights' || currentTab === 'content') && <div className={`teacher-hero-art ${currentTab === 'students' ? 'teacher-students-hero-art' : ''}`} aria-hidden="true"><div className="teacher-book-stack">{currentTab === 'students' ? <Users size={130} strokeWidth={1.15} /> : <BookOpen size={116} strokeWidth={1.2} />}<Pencil size={46} strokeWidth={1.3} /><Sprout size={36} strokeWidth={1.2} /></div><blockquote>{currentTab === 'students' ? <>Every student<br />has a story worth<br />understanding.</> : currentTab === 'insights' ? <>Data that drives<br />better teaching.</> : currentTab === 'content' ? <>Good materials<br />create brighter<br />minds.</> : <>Better insights.<br />Brighter futures.</>}</blockquote></div>}

        {/* Sidebar remains the primary teacher navigation. */}
        <div className={`teacher-tabs flex items-center gap-1.5 bg-surface-container-high/80 p-1.5 rounded-xl border border-white/10 self-start md:self-auto flex-wrap ${currentTab === 'overview' || currentTab === 'students' || currentTab === 'insights' || currentTab === 'content' ? 'teacher-overview-tabs-hidden' : ''}`}>
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

      {/* Teacher overview dashboard */}
      {currentTab === 'overview' && (
        <TeacherOverviewPanel
          students={overview.students}
          topics={topicPerformance}
          totalStudents={cohortSummary.total_students || overview.students.length}
          averageMastery={Math.round((cohortSummary.avg_cohort_mastery || averageScore / 100) * 100)}
          studentsAtRisk={cohortSummary.struggling_students_count || overview.students.filter(student => student.overall_mastery < 0.5).length}
          onNavigate={handleTabChange}
        />
      )}

      {/* Teacher student roster and support overview */}
      {currentTab === 'students' && (
        <TeacherStudentsPanel
          students={overview.students}
          totalStudents={cohortSummary.total_students || overview.students.length}
          search={studentSearch}
          onSearch={setStudentSearch}
          selectedStudentId={selectedStudentId}
          onSelectStudent={(id) => { setSelectedStudentId(id); onSelectStudent?.(id); }}
          onNavigate={handleTabChange}
        />
      )}

      {/* Teacher insights */}
      {currentTab === 'insights' && (
        <TeacherInsightsPanel
          students={overview.students}
          topics={topicPerformance}
          totalStudents={cohortSummary.total_students || overview.students.length}
          averageMastery={Math.round((cohortSummary.avg_cohort_mastery || averageScore / 100) * 100)}
          onNavigate={handleTabChange}
        />
      )}

      {currentTab === 'content' && <TeacherMaterialsPanel refreshKey={materialsRefresh} onUpload={() => setShowUploadModal(true)} />}

      {/* Upload Material Modal */}
      {showUploadModal && (
        <DocumentUploadModal
          onClose={() => setShowUploadModal(false)}
          onChapterReady={() => {
            setShowUploadModal(false);
            loadTeacherData();
            setMaterialsRefresh(value => value + 1);
          }}
        />
      )}

    </div>
  );
};

export default TeacherDashboard;
