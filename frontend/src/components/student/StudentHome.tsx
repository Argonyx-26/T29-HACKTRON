import React, { useState } from 'react';
import { KnowledgeTwinView, Chapter } from '../../types';
import { ArrowRight, Bell, BookOpen, CheckSquare, Compass, FileText, Search, Sparkles, Sprout, Target, TrendingUp } from 'lucide-react';

interface StudentHomeProps {
  twin: KnowledgeTwinView | null;
  activeChapter: Chapter | null;
  onNavigateToLearn: () => void;
  onNavigateToAssess: () => void;
  onNavigateToTwin: () => void;
  onNavigateToProgress: () => void;
  onNavigateToIntervention: (skillId: string, patternId: string, classification: string) => void;
  onSearchTopics?: (query: string) => void;
}

export const StudentHome: React.FC<StudentHomeProps> = ({ twin, activeChapter, onNavigateToLearn, onNavigateToAssess, onNavigateToTwin, onNavigateToProgress, onNavigateToIntervention, onSearchTopics }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const skills = twin?.skills || [];
  const evidencedSkills = skills.filter(skill => skill.evidence_count > 0);
  const responseCount = skills.reduce((sum, skill) => sum + skill.evidence_count, 0);
  const misconceptions = twin?.active_misconceptions || [];
  const mastery = twin?.overall_mastery != null && responseCount ? Math.round(twin.overall_mastery * 100) : null;
  const currentChapter = activeChapter?.title || twin?.current_chapter_title || 'Choose a topic to start';
  const currentSubject = activeChapter?.subject || twin?.current_subject || 'Subject';
  const currentSkill = skills.find(skill => skill.mastery_probability < 0.7) || skills[0];
  const tasksLeft = (skills.length > evidencedSkills.length ? 1 : 0) + (misconceptions.length ? 1 : 0);
  const focusPercent = tasksLeft ? 100 - Math.round((tasksLeft / Math.max(2, skills.length)) * 100) : 100;
  const firstMisconception = misconceptions[0];
  const beginPractice = () => firstMisconception
    ? onNavigateToIntervention(skills.find(skill => skill.skill_name === firstMisconception.skill_name)?.skill_id || '', firstMisconception.pattern_id, firstMisconception.classification)
    : onNavigateToAssess();

  return (
    <div className="learning-home fade-in">
      <div className="learning-topbar">
        <label className="learning-search">
          <Search size={18} />
          <input
            aria-label="Search topics, skills, or questions"
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter' && searchQuery.trim() && onSearchTopics) {
                onSearchTopics(searchQuery.trim());
              }
            }}
            placeholder="Search for topics, skills, or questions..."
          />
          <kbd>⌘ K</kbd>
        </label>
        <button className="learning-notifications" aria-label="Notifications" onClick={onNavigateToTwin}><Bell size={19} /><i /></button>
      </div>

      <header className="learning-heading">
        <div><span className="learning-eyebrow">YOUR LEARNING SPACE</span><h1>Welcome <span>back.</span></h1><p>Your Knowledge Twin gets smarter with every response.</p></div>
        <blockquote>“Small steps,<br />bigger understanding.”</blockquote>
      </header>

      <div className="learning-layout">
        <div className="learning-main-column">
          <section className="continue-card">
            <div className="continue-copy"><span className="learning-eyebrow">CONTINUE LEARNING</span><h2>Pick up where you left off.</h2><div className="continue-current"><span className="continue-book-icon"><BookOpen size={23} /></span><div><small>{currentSubject} · {currentChapter}</small><strong>{currentSkill?.skill_name || 'Current Skill'}</strong><p>{currentSkill ? 'Continue from your last learning session.' : 'Choose a topic to start building your learning map.'}</p></div></div><div className="continue-actions"><button className="learning-primary" onClick={currentSkill ? onNavigateToAssess : onNavigateToLearn}>{currentSkill ? 'Continue Learning' : 'Explore Topics'} <ArrowRight size={16} /></button><button className="learning-secondary" onClick={onNavigateToLearn}>View Chapter</button></div></div>
            <div className="continue-art" aria-hidden="true"><BookOpen /><Sprout /></div>
          </section>

          <section className="twin-summary">
            <div className="learning-section-heading"><div><h2>Your Knowledge Twin</h2><p>What your recent learning evidence tells us.</p></div><button className="learning-link" onClick={onNavigateToTwin}>View Details <ArrowRight size={15} /></button></div>
            <div className="twin-evidence-grid">
              <article className="evidence-card"><span className="evidence-icon"><TrendingUp size={20} /></span><div><small>CURRENT MASTERY</small><strong>{mastery === null ? 'Getting started' : `${mastery}%`}</strong><p>{mastery === null ? 'Your estimate grows with each response.' : 'Based on recent demonstrated performance.'}</p></div></article>
              <article className="evidence-card"><span className="evidence-icon"><FileText size={20} /></span><div><small>EVIDENCE</small><strong>{responseCount} {responseCount === 1 ? 'response' : 'recent responses'}</strong><p>From learning and assessments.</p></div></article>
              <article className="evidence-card"><span className="evidence-icon"><Sparkles size={20} /></span><div><small>LEARNING TREND</small><strong>{evidencedSkills.length ? (evidencedSkills.some(skill => skill.trend === 'improving') ? 'Improving' : 'Taking shape') : 'Ready to begin'}</strong><p>{evidencedSkills.length ? 'Your twin is learning from your practice.' : 'Try a diagnostic to find your next step.'}</p></div></article>
            </div>
          </section>

          <section className="recommendations">
            <div className="learning-section-heading"><div><h2>Recommended for You</h2><p>Personalized based on your learning patterns.</p></div><button className="learning-link" onClick={onNavigateToLearn}>See More <ArrowRight size={15} /></button></div>
            <div className="recommendation-grid">
              {[
                { title: 'Target Practice', body: currentSkill ? `Focus on ${currentSkill.skill_name.toLowerCase()}.` : 'Focus on areas that need more practice.', icon: <Target size={21} />, action: beginPractice },
                { title: 'Strengthen Basics', body: 'Revisit key concepts for better clarity.', icon: <BookOpen size={21} />, action: onNavigateToLearn },
                { title: 'Challenge Yourself', body: 'Try questions at a higher level.', icon: <TrendingUp size={21} />, action: onNavigateToAssess },
              ].map(item => <button className="recommendation-tile" key={item.title} onClick={item.action}><span className="evidence-icon">{item.icon}</span><span><strong>{item.title}</strong><small>{item.body}</small></span><ArrowRight className="tile-arrow" size={16} /></button>)}
            </div>
          </section>
        </div>

        <aside className="learning-side-column">
          <section className="focus-card"><h2>Today’s Focus</h2><div className="focus-content"><div className="focus-donut" style={{ '--focus-value': `${focusPercent}%` } as React.CSSProperties}><span><strong>{tasksLeft}</strong><small>Tasks left</small></span></div><ul><li><i className="focus-dot purple" />{skills.length > evidencedSkills.length ? '1 Learning' : '0 Learning'}</li><li><i className="focus-dot violet" />{misconceptions.length ? `${misconceptions.length} Practice` : '1 Assessment'}</li><li><i className="focus-dot muted" />{responseCount ? `${evidencedSkills.length} Skills explored` : '0 Completed'}</li></ul></div></section>
          <section className="learning-quote-card"><p>“Consistency<br />builds clarity.”</p><span /></section>
          <section className="quick-actions-card"><h2>Quick Actions</h2><button onClick={onNavigateToLearn}><Compass size={18} />Explore Topics <ArrowRight size={16} /></button><button onClick={onNavigateToAssess}><CheckSquare size={18} />Take a Diagnostic <ArrowRight size={16} /></button><button onClick={onNavigateToProgress}><TrendingUp size={18} />View Progress <ArrowRight size={16} /></button></section>
          <section className="learning-promo-card"><span>Learn deeper.<br />Go further.</span><i /></section>
        </aside>
      </div>
    </div>
  );
};

export default StudentHome;
