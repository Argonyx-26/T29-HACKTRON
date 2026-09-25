import React, { useState } from 'react';
import {
  Users,
  Plus,
  ArrowRight,
  BookOpen,
  Lock,
  CheckCircle2,
  FileText,
  Target,
  Share2,
  Clock,
  Sparkles,
  UserPlus,
  Search,
  Bell
} from 'lucide-react';

type TeamView = 'overview' | 'goals' | 'sessions' | 'resources';

interface StudyGroup {
  id: string;
  name: string;
  subject: string;
  code: string;
  memberCount: number;
  description: string;
  targetGoal: string;
  goalProgress: number;
  sharedMaterials: { title: string; type: string; date: string }[];
  collaborativePrompts: { prompt: string; skill: string; completedCount: number }[];
  recentActivity: { user: string; action: string; time: string }[];
}

interface StudyGroupsViewProps {
  role: 'student' | 'teacher';
  userId: string;
  userName: string;
  onNavigateToLearn?: () => void;
  onNavigateToAssess?: () => void;
}

export const StudyGroupsView: React.FC<StudyGroupsViewProps> = ({
  role,
  userId,
  userName,
  onNavigateToLearn,
  onNavigateToAssess
}) => {
  const [groups, setGroups] = useState<StudyGroup[]>([
    {
      id: 'grp_alg_01',
      name: 'Algebra Cohort Study Circle',
      subject: 'Mathematics',
      code: 'KT-ALG-742',
      memberCount: 5,
      description: 'Collaborative revision of linear terms, distribution, and variable isolation before midterm diagnostics.',
      targetGoal: 'Reach 80% Chapter Mastery across all cohort members',
      goalProgress: 68,
      sharedMaterials: [
        { title: 'Linear Equations Summary & Common Traps', type: 'PDF Guide', date: '2 days ago' },
        { title: 'Distributive Property Worked Examples Walkthrough', type: 'Notes', date: 'Yesterday' }
      ],
      collaborativePrompts: [
        { prompt: 'Why does a negative multiplier flip all signs inside parentheses: -(2x - 5)?', skill: 'Distributive Property', completedCount: 4 },
        { prompt: 'Determine which side to move variable terms to keep coefficients positive in 3x + 12 = 7x - 4.', skill: 'Variable Isolation', completedCount: 3 }
      ],
      recentActivity: [
        { user: 'Maya K.', action: 'shared notes on Distributive Rules', time: '1 hour ago' },
        { user: 'Liam P.', action: 'completed collaborative practice question', time: '3 hours ago' },
        { user: 'Dr. Vance', action: 'assigned shared practice challenge', time: '1 day ago' }
      ]
    }
  ]);

  const [selectedGroupId, setSelectedGroupId] = useState<string>('grp_alg_01');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showJoinModal, setShowJoinModal] = useState<boolean>(false);

  // Form states
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupSubject, setNewGroupSubject] = useState('Mathematics');
  const [newGroupGoal, setNewGroupGoal] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [activeTeamView, setActiveTeamView] = useState<TeamView>('overview');
  const [teamSearch, setTeamSearch] = useState('');

  const selectedGroup = groups.find(g => g.id === selectedGroupId) || groups[0];

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const code = `KT-${newGroupSubject.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const newGroup: StudyGroup = {
      id: `grp_${Date.now()}`,
      name: newGroupName.trim(),
      subject: newGroupSubject,
      code,
      memberCount: 1,
      description: newGroupDescription.trim() || 'Collaborative learning group.',
      targetGoal: newGroupGoal.trim() || 'Complete joint curriculum modules',
      goalProgress: 10,
      sharedMaterials: [],
      collaborativePrompts: [],
      recentActivity: [
        { user: userName || 'You', action: 'created the study group', time: 'Just now' }
      ]
    };

    setGroups([...groups, newGroup]);
    setSelectedGroupId(newGroup.id);
    setShowCreateModal(false);
    setNewGroupName('');
    setNewGroupGoal('');
    setNewGroupDescription('');
  };

  const handleJoinGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    const existing = groups.find(g => g.code.toLowerCase() === joinCode.trim().toLowerCase());
    if (existing) {
      setSelectedGroupId(existing.id);
      setShowJoinModal(false);
      setJoinCode('');
    } else {
      // Simulate adding a group from code
      const dummyGroup: StudyGroup = {
        id: `grp_${Date.now()}`,
        name: 'Peer Problem-Solving Hub',
        subject: 'General Studies',
        code: joinCode.trim().toUpperCase(),
        memberCount: 4,
        description: 'Joined via invite code. Collaborative revision and practice prompts.',
        targetGoal: 'Collaborative practice for upcoming diagnostics',
        goalProgress: 45,
        sharedMaterials: [
          { title: 'Core Principles Cheat Sheet', type: 'PDF', date: '3 days ago' }
        ],
        collaborativePrompts: [
          { prompt: 'Explain the difference between an equation and an expression.', skill: 'Core Principles', completedCount: 2 }
        ],
        recentActivity: [
          { user: userName || 'You', action: 'joined the group', time: 'Just now' }
        ]
      };
      setGroups([...groups, dummyGroup]);
      setSelectedGroupId(dummyGroup.id);
      setShowJoinModal(false);
      setJoinCode('');
    }
  };

  return (
    <div className="team-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1220px', margin: '0 auto' }}>
      <div className="team-topbar"><label><Search size={18} /><input value={teamSearch} onChange={event => setTeamSearch(event.target.value)} placeholder="Search topics, goals, and resources..." /></label><button aria-label="Team notifications"><Bell size={20} /><span /></button></div>
      
      {/* Header Banner */}
      <div className="team-heading" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#d7baff' }}>
              COLLABORATE AND GROW
            </span>
            <span className="badge badge-purple" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
              <Lock size={11} /> Personal Twins Private
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            My <span>Team</span>
          </h1>
          <p style={{ fontSize: '0.92rem', color: '#9496a8', marginTop: '4px', maxWidth: '640px', lineHeight: 1.5 }}>
            Learn together. Solve together. Grow together.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowJoinModal(true)}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem' }}
          >
            <UserPlus size={15} /> Join Group
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary purple-glow-btn"
            style={{ fontSize: '0.85rem' }}
          >
            <Plus size={15} /> Create Group
          </button>
        </div>
      </div>

      <nav className="team-tabs" aria-label="Team views" role="tablist">
        {([{ id: 'overview', label: 'Team Overview' }, { id: 'goals', label: 'Shared Goals' }, { id: 'sessions', label: 'Study Sessions' }, { id: 'resources', label: 'Resources' }] as const).map(({ id, label }) => <button key={id} type="button" role="tab" aria-selected={activeTeamView === id} className={activeTeamView === id ? 'is-active' : ''} onClick={() => setActiveTeamView(id)}>{label}</button>)}
      </nav>

      {/* Main Split Layout: Left Group List, Right Group Workspace */}
      {activeTeamView === 'overview' && <div className="team-overview-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(440px, 2fr)', gap: '24px' }}>
        
        {/* Left Column: Group Roster */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: '#d7baff', letterSpacing: '0.06em' }}>
            Active Groups ({groups.length})
          </span>

          {groups.filter(grp => `${grp.name} ${grp.subject} ${grp.description}`.toLowerCase().includes(teamSearch.toLowerCase())).map((grp) => {
            const isSelected = grp.id === selectedGroupId;
            return (
              <div
                key={grp.id}
                onClick={() => setSelectedGroupId(grp.id)}
                className="card-panel"
                style={{
                  padding: '18px 20px',
                  cursor: 'pointer',
                  borderColor: isSelected ? '#a855f7' : 'rgba(255, 255, 255, 0.08)',
                  background: isSelected ? 'rgba(104, 0, 203, 0.2)' : '#0d0d0e',
                  boxShadow: isSelected ? '0 0 16px rgba(104, 0, 203, 0.3)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF' }}>
                    {grp.name}
                  </h3>
                  <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                    {grp.memberCount} members
                  </span>
                </div>

                <div style={{ fontSize: '0.78rem', color: '#d7baff', marginTop: '4px', fontWeight: 600 }}>
                  {grp.subject} • <span style={{ fontFamily: 'monospace' }}>{grp.code}</span>
                </div>

                <p style={{ fontSize: '0.82rem', color: '#9496a8', marginTop: '6px', lineHeight: 1.4 }}>
                  {grp.description}
                </p>

                {/* Mini Goal Progress */}
                <div style={{ marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#9496a8', marginBottom: '4px' }}>
                    <span>Shared Goal</span>
                    <span style={{ color: '#4edea3', fontWeight: 700 }}>{grp.goalProgress}%</span>
                  </div>
                  <div className="progress-container" style={{ height: '4px' }}>
                    <div className="progress-bar-fill" style={{ width: `${grp.goalProgress}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Selected Group Workspace */}
        {selectedGroup && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Group Header Card */}
            <div className="card-panel" style={{ padding: '26px', position: 'relative', overflow: 'hidden' }}>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(192, 132, 252, 0.45), transparent)'
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span className="badge badge-purple">{selectedGroup.subject}</span>
                  <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FFFFFF', marginTop: '6px' }}>
                    {selectedGroup.name}
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: '#9496a8', marginTop: '4px' }}>
                    {selectedGroup.description}
                  </p>
                </div>

                <div style={{
                  padding: '10px 16px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  textAlign: 'right'
                }}>
                  <div style={{ fontSize: '0.7rem', color: '#9496a8', textTransform: 'uppercase', fontWeight: 700 }}>Invite Code</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#d7baff', fontFamily: 'monospace' }}>
                    {selectedGroup.code}
                  </div>
                </div>
              </div>

              {/* Shared Target Goal */}
              <div style={{
                marginTop: '20px',
                padding: '16px',
                background: 'rgba(104, 0, 203, 0.12)',
                borderRadius: '12px',
                border: '1px solid rgba(104, 0, 203, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Target size={20} color="#d7baff" />
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d7baff', textTransform: 'uppercase' }}>
                      Shared Learning Goal
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                      {selectedGroup.targetGoal}
                    </div>
                  </div>
                </div>

                <div style={{ minWidth: '140px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4edea3', textAlign: 'right', marginBottom: '4px' }}>
                    {selectedGroup.goalProgress}% Complete
                  </div>
                  <div className="progress-container">
                    <div className="progress-bar-fill" style={{ width: `${selectedGroup.goalProgress}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Shared Study Materials */}
            <div className="card-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="#d7baff" />
                  Shared Learning Materials
                </h3>
                {onNavigateToLearn && (
                  <button
                    onClick={onNavigateToLearn}
                    style={{ background: 'none', border: 'none', color: '#d7baff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    Share from Curriculum <ArrowRight size={13} />
                  </button>
                )}
              </div>

              {selectedGroup.sharedMaterials.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#9496a8', fontSize: '0.85rem' }}>
                  No materials shared with this group yet. Upload notes or share from the Learn tab.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedGroup.sharedMaterials.map((mat, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '12px 16px',
                        background: '#121216',
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <BookOpen size={16} color="#d7baff" />
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#FFFFFF' }}>{mat.title}</div>
                          <div style={{ fontSize: '0.72rem', color: '#9496a8' }}>{mat.type} • Added {mat.date}</div>
                        </div>
                      </div>
                      <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                        Available
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Collaborative Practice Prompts */}
            <div className="card-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="#d7baff" />
                  Collaborative Practice Challenges
                </h3>
                {onNavigateToAssess && (
                  <button
                    onClick={onNavigateToAssess}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                  >
                    Open Diagnostic
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedGroup.collaborativePrompts.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '14px 16px',
                      background: '#121216',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                        {p.skill}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#4edea3', fontWeight: 600 }}>
                        {p.completedCount} of {selectedGroup.memberCount} answered
                      </span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 600, lineHeight: 1.4 }}>
                      {p.prompt}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Group Activity Log */}
            <div className="card-panel" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#9496a8', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} /> Group Activity
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedGroup.recentActivity.map((act, i) => (
                  <div key={i} style={{ fontSize: '0.82rem', color: '#cdc2d7', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#d7baff', fontWeight: 700 }}>{act.user}</span>
                    <span>{act.action}</span>
                    <span style={{ color: '#71707d', fontSize: '0.72rem', marginLeft: 'auto' }}>{act.time}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>}

      {activeTeamView === 'goals' && selectedGroup && <section className="team-detail-grid"><article className="team-detail-card team-goal-feature"><Target size={25} /><span className="team-card-eyebrow">SHARED LEARNING GOAL</span><h2>{selectedGroup.targetGoal}</h2><p>{selectedGroup.name} · {selectedGroup.memberCount} members</p><div className="team-progress-track"><i style={{ width: `${selectedGroup.goalProgress}%` }} /></div><strong>{selectedGroup.goalProgress}% complete</strong></article><article className="team-detail-card"><h2>Practice together</h2><p>Collaborative prompts from your team’s learning plan.</p>{selectedGroup.collaborativePrompts.filter(item => `${item.prompt} ${item.skill}`.toLowerCase().includes(teamSearch.toLowerCase())).map((prompt, i) => <div className="team-list-item" key={i}><span>{prompt.skill}</span><strong>{prompt.prompt}</strong><small>{prompt.completedCount} of {selectedGroup.memberCount} members responded</small>{onNavigateToAssess && <button onClick={onNavigateToAssess}>Practice <ArrowRight size={14} /></button>}</div>)}</article></section>}

      {activeTeamView === 'sessions' && selectedGroup && <section className="team-detail-card"><span className="team-card-eyebrow">STUDY SESSIONS</span><h2>Plan a focused session</h2><p>Use your team’s shared practice prompts to guide a study session.</p>{selectedGroup.collaborativePrompts.filter(item => `${item.prompt} ${item.skill}`.toLowerCase().includes(teamSearch.toLowerCase())).map((prompt, i) => <div className="team-session-item" key={i}><span className="team-detail-icon"><Clock size={19} /></span><div><strong>{prompt.skill} · Group practice</strong><small>{prompt.prompt}</small></div><span className="team-session-count">{prompt.completedCount}/{selectedGroup.memberCount} complete</span>{onNavigateToAssess && <button onClick={onNavigateToAssess}>Join <ArrowRight size={14} /></button>}</div>)}{selectedGroup.collaborativePrompts.length === 0 && <div className="team-empty">No practice sessions are planned yet.</div>}</section>}

      {activeTeamView === 'resources' && selectedGroup && <section className="team-detail-card"><span className="team-card-eyebrow">SHARED RESOURCES</span><h2>Notes, links, and learning materials</h2><p>Resources shared with {selectedGroup.name}.</p>{selectedGroup.sharedMaterials.filter(item => `${item.title} ${item.type}`.toLowerCase().includes(teamSearch.toLowerCase())).map((resource, i) => <div className="team-session-item" key={i}><span className="team-detail-icon"><FileText size={19} /></span><div><strong>{resource.title}</strong><small>{resource.type} · Added {resource.date}</small></div><button onClick={onNavigateToLearn}>Open <ArrowRight size={14} /></button></div>)}{selectedGroup.sharedMaterials.length === 0 && <div className="team-empty">No resources have been shared yet.</div>}</section>}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="card-panel" style={{ width: '100%', maxWidth: '480px', padding: '28px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>
              Create Study Group
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#9496a8', marginBottom: '20px' }}>
              Organize peers around a subject goal. Personal Knowledge Twins remain strictly private.
            </p>

            <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cdc2d7', marginBottom: '6px' }}>
                  Group Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Linear Equations Mastery Group"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cdc2d7', marginBottom: '6px' }}>
                  Subject / Topic
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics"
                  value={newGroupSubject}
                  onChange={(e) => setNewGroupSubject(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cdc2d7', marginBottom: '6px' }}>
                  Shared Learning Goal
                </label>
                <input
                  type="text"
                  placeholder="e.g. Master prerequisite distribution rules"
                  value={newGroupGoal}
                  onChange={(e) => setNewGroupGoal(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cdc2d7', marginBottom: '6px' }}>
                  Description
                </label>
                <textarea
                  placeholder="What is the focus of this group?"
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', minHeight: '70px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary purple-glow-btn">
                  Create Study Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="card-panel" style={{ width: '100%', maxWidth: '420px', padding: '28px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>
              Join a Study Group
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#9496a8', marginBottom: '20px' }}>
              Enter the invite code shared by your study circle or teacher.
            </p>

            <form onSubmit={handleJoinGroup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cdc2d7', marginBottom: '6px' }}>
                  Group Invite Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KT-ALG-742"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '1.05rem', textAlign: 'center', textTransform: 'uppercase' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowJoinModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary purple-glow-btn">
                  Join Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudyGroupsView;
