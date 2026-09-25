import React from 'react';
import { UserProfile } from '../../types';

interface AccountModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updated: UserProfile) => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({ user, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="avatar-circle">
            {user.name.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <h3>{user.name}</h3>
            <p className="subtitle">{user.email} • <span className="badge badge-accent">{user.role}</span></p>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="info-grid">
            <div className="info-stat">
              <span className="stat-label">Cognitive Streak</span>
              <span className="stat-val">{user.streakDays} Days 🔥</span>
            </div>
            <div className="info-stat">
              <span className="stat-label">Mastery Points</span>
              <span className="stat-val">{user.totalPoints.toLocaleString()} XP</span>
            </div>
            <div className="info-stat">
              <span className="stat-label">Curriculum Track</span>
              <span className="stat-val">{user.gradeLevel || 'Standard'}</span>
            </div>
          </div>

          <div className="form-group">
            <label>AI Twin Sensitivity</label>
            <select defaultValue="adaptive" className="input-field">
              <option value="adaptive">Dynamic Adaptive (Automatic difficulty tuning)</option>
              <option value="challenging">High Rigor (Strict prerequisite validation)</option>
              <option value="gentle">Scaffolded (Step-by-step guidance)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Cognitive Sync Frequency</label>
            <select defaultValue="realtime" className="input-field">
              <option value="realtime">Real-time (Every interaction)</option>
              <option value="session">End of session</option>
            </select>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={onClose}>Save Preferences</button>
        </div>
      </div>
    </div>
  );
};

export default AccountModal;
