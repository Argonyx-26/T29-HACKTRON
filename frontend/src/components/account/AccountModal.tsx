import React, { useState } from 'react';
import { User } from '../../types';
import { learningRepository } from '../../services/learningRepository';
import { UserCheck, Shield, Key, LogOut, Check, X, Sparkles } from 'lucide-react';

interface AccountModalProps {
  user: User;
  onClose: () => void;
  onUpdateUser: (updatedUser: User) => void;
  onSwitchAccount: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  user,
  onClose,
  onUpdateUser,
  onSwitchAccount
}) => {
  const [displayName, setDisplayName] = useState<string>(user.display_name);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    const updated = learningRepository.updateUser(user.user_id, displayName.trim());
    onUpdateUser(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div className="card-panel" style={{ width: '100%', maxWidth: '460px', padding: '30px', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '18px', right: '18px', background: 'none', border: 'none', cursor: 'pointer', color: '#9496a8' }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(104, 0, 203, 0.25)',
            color: '#d7baff',
            border: '1px solid rgba(215, 186, 255, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.1rem'
          }}>
            {user.display_name ? user.display_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>
              Learner Account
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#9496a8' }}>
              Persistent identity & session profile
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cdc2d7', marginBottom: '6px' }}>
              Learner Name
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cdc2d7', marginBottom: '6px' }}>
              Assigned Role
            </label>
            <div style={{
              padding: '10px 14px',
              background: '#121216',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#FFFFFF',
              textTransform: 'capitalize',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>{user.role}</span>
              <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>Authorized</span>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cdc2d7', marginBottom: '6px' }}>
              Persistent Learner ID (UUID)
            </label>
            <div style={{
              padding: '10px 14px',
              background: '#121216',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#9496a8',
              fontSize: '0.76rem',
              fontFamily: 'monospace',
              wordBreak: 'break-all'
            }}>
              {user.user_id}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#71707d', marginTop: '4px' }}>
              Used to persistently anchor your cognitive graph across sessions.
            </div>
          </div>

          {savedSuccess && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(78, 222, 163, 0.15)',
              border: '1px solid rgba(78, 222, 163, 0.3)',
              borderRadius: '8px',
              color: '#4edea3',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Check size={14} /> Learner identity updated successfully.
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                onSwitchAccount();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffb4ab',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <LogOut size={14} /> Switch Account
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountModal;
