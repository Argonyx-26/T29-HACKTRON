import React, { useState } from 'react';
import { mockStudyGroups } from '../../services/learningRepository';
import { StudyGroup } from '../../types';

export const StudyGroupsView: React.FC = () => {
  const [groups] = useState<StudyGroup[]>(mockStudyGroups);

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h2>Collaborative Study Cohorts</h2>
          <p className="subtitle">AI matches students based on complementary mastery profiles and pacing</p>
        </div>
        <button className="btn btn-primary">+ Create New Cohort</button>
      </div>

      <div className="cards-grid">
        {groups.map((group) => (
          <div key={group.id} className="card group-card">
            <div className="group-card-header">
              <span className="badge badge-accent">{group.topic}</span>
              <span className="active-dot">● {group.activeNow} online</span>
            </div>
            <h3>{group.name}</h3>
            <p className="text-muted small">Collaborative peer problem solving and group Twin consultations.</p>

            <div className="group-stats">
              <div>
                <span className="stat-label">Members</span>
                <strong>{group.membersCount}</strong>
              </div>
              <div>
                <span className="stat-label">Next Live Session</span>
                <strong>{group.nextSessionTime}</strong>
              </div>
            </div>

            <div className="group-card-footer">
              <button className="btn btn-secondary btn-block">Join Session Room</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudyGroupsView;
