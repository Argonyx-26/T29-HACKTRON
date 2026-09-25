import React, { useState } from 'react';
import {
  Home,
  Compass,
  CheckSquare,
  Layers,
  TrendingUp,
  Settings,
  HelpCircle,
  LogOut,
  Users,
  Sparkles,
  X,
  Globe,
  UserCheck,
  FolderOpen
} from 'lucide-react';
import { User } from '../../types';
import { KnowledgeTwinLogo } from '../auth/LoginView';
import { AccountModal } from '../account/AccountModal';

interface SidebarProps {
  user: User;
  activeTab: string;
  onNavigate: (tab: string) => void;
  onSwitchAccount: () => void;
  onGoToLanding?: () => void;
  onUpdateUser?: (updated: User) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeTab,
  onNavigate,
  onSwitchAccount,
  onGoToLanding,
  onUpdateUser
}) => {
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);

  const studentItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'learn', label: 'Learn', icon: Compass },
    { id: 'assess', label: 'Assess', icon: CheckSquare },
    { id: 'twin', label: 'My Twin', icon: Layers },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'groups', label: 'Study Groups', icon: Users }
  ];

  const teacherItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'insights', label: 'Insights', icon: Sparkles },
    { id: 'content', label: 'Content & Materials', icon: FolderOpen },
  ];

  const navItems = user.role === 'teacher' ? teacherItems : studentItems;

  return (
    <>
      <aside className={`app-sidebar ${user.role === 'teacher' ? 'teacher-sidebar' : activeTab === 'home' ? 'student-home-sidebar' : activeTab === 'learn' ? 'student-learn-sidebar' : activeTab === 'assess' ? 'student-assess-sidebar' : activeTab === 'twin' ? 'student-twin-sidebar' : activeTab === 'progress' ? 'student-progress-sidebar' : activeTab === 'groups' ? 'student-groups-sidebar' : ''}`} style={{
        width: '240px',
        flexShrink: 0,
        background: '#000000',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        position: 'sticky',
        top: 0,
        height: '100vh',
        boxSizing: 'border-box',
        zIndex: 20
      }}>
        {/* Brand Header with crisp Knowledge Twin Vector Logo */}
        <div
          onClick={onGoToLanding || (() => onNavigate(user.role === 'teacher' ? 'overview' : 'home'))}
          style={{
            padding: '24px 20px 20px 20px',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
          }}
          title="Return to Knowledge Twin Landing Page"
        >
          <KnowledgeTwinLogo />
        </div>

        {/* Primary Navigation Items */}
        <nav className="app-sidebar-nav" style={{ padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, overflowY: 'auto' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`sidebar-nav-button${isActive ? ' is-active purple-glow-btn' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isActive ? '#6800cb' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#9e9da8',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  letterSpacing: '0.01em'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#FFFFFF';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#9e9da8';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Icon size={19} color={isActive ? '#FFFFFF' : '#727082'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Section: Settings, Help, Account */}
        <div className="app-sidebar-footer" style={{ padding: '14px 12px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {onGoToLanding && (
            <button
              onClick={onGoToLanding}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '9px 14px',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                color: '#71707d',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#71707d'}
            >
              <Globe size={16} color="#71707d" />
              <span>Landing Page</span>
            </button>
          )}

          <button
            onClick={() => setShowSettingsModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '9px 14px',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              color: '#71707d',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#71707d'}
          >
            <Settings size={16} color="#71707d" />
            <span>Settings</span>
          </button>

          <button
            onClick={() => setShowHelpModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '9px 14px',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              color: '#71707d',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#71707d'}
          >
            <HelpCircle size={16} color="#71707d" />
            <span>Help</span>
          </button>

          {/* Account Profile Item */}
          <button
            onClick={() => setShowAccountModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '9px 14px',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              color: '#71707d',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#71707d'}
          >
            <UserCheck size={16} color="#71707d" />
            <span>Account</span>
          </button>

          {/* Account Profile Card */}
          <div style={{
            marginTop: '8px',
            padding: '12px',
            background: '#0d0d0e',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <div
              onClick={() => setShowAccountModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', cursor: 'pointer' }}
              title="Manage Account"
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: user.role === 'teacher' ? 'rgba(109, 17, 173, 0.4)' : 'rgba(104, 0, 203, 0.35)',
                color: '#d7baff',
                border: '1px solid rgba(215, 186, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.85rem',
                flexShrink: 0
              }}>
                {user.display_name ? user.display_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {user.display_name}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#9496a8', textTransform: 'capitalize' }}>
                  {user.role}
                </div>
              </div>
            </div>

            <button
              onClick={onSwitchAccount}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '7px 10px',
                background: '#18181c',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                color: '#cdc2d7',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#FFFFFF';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#cdc2d7';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              }}
              title="Switch user account"
            >
              <LogOut size={12} /> Switch account
            </button>
          </div>
        </div>
      </aside>

      {/* Account Modal */}
      {showAccountModal && (
        <AccountModal
          user={user}
          onClose={() => setShowAccountModal(false)}
          onUpdateUser={(updated) => {
            if (onUpdateUser) onUpdateUser(updated);
          }}
          onSwitchAccount={onSwitchAccount}
        />
      )}

      {/* Settings Modal (Dark Stitch Theme) */}
      {showSettingsModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="card-panel" style={{ width: '100%', maxWidth: '440px', padding: '28px', position: 'relative' }}>
            <button
              onClick={() => setShowSettingsModal(false)}
              style={{ position: 'absolute', top: '18px', right: '18px', background: 'none', border: 'none', cursor: 'pointer', color: '#9496a8' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '18px' }}>
              Platform Settings
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.88rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, color: '#cdc2d7', marginBottom: '6px' }}>
                  Display Name
                </label>
                <div style={{ padding: '10px 14px', background: '#121216', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#FFFFFF' }}>
                  {user.display_name}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, color: '#cdc2d7', marginBottom: '6px' }}>
                  Assigned Role
                </label>
                <div style={{ padding: '10px 14px', background: '#121216', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#FFFFFF', textTransform: 'capitalize' }}>
                  {user.role}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, color: '#cdc2d7', marginBottom: '6px' }}>
                  Learner User ID (UUID)
                </label>
                <div style={{ padding: '10px 14px', background: '#121216', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#9496a8', fontSize: '0.78rem', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                  {user.user_id}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal (Dark Stitch Theme) */}
      {showHelpModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="card-panel" style={{ width: '100%', maxWidth: '520px', padding: '28px', position: 'relative' }}>
            <button
              onClick={() => setShowHelpModal(false)}
              style={{ position: 'absolute', top: '18px', right: '18px', background: 'none', border: 'none', cursor: 'pointer', color: '#9496a8' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>
              Knowledge Twin Help & Guidance
            </h3>

            <p style={{ fontSize: '0.88rem', color: '#9496a8', marginBottom: '20px', lineHeight: 1.5 }}>
              Knowledge Twin builds an adaptive model of what you know and diagnoses why learning breaks down.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
              <div style={{ padding: '14px', background: '#121216', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <strong style={{ color: '#d7baff' }}>1. Learn & Explore:</strong>
                <p style={{ color: '#cdc2d7', margin: '4px 0 0 0' }}>
                  Browse any subject, view curriculum skills, or upload your own notes/documents.
                </p>
              </div>

              <div style={{ padding: '14px', background: '#121216', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <strong style={{ color: '#d7baff' }}>2. Diagnostic Assessments:</strong>
                <p style={{ color: '#cdc2d7', margin: '4px 0 0 0' }}>
                  Each question diagnoses specific mistake patterns and prerequisite gaps rather than just scoring right/wrong.
                </p>
              </div>

              <div style={{ padding: '14px', background: '#121216', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <strong style={{ color: '#d7baff' }}>3. Living Twin & Targeted Retests:</strong>
                <p style={{ color: '#cdc2d7', margin: '4px 0 0 0' }}>
                  Inspect your mastery graph and resolve identified gaps through targeted micro-interventions.
                </p>
              </div>
            </div>

            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button
                onClick={() => setShowHelpModal(false)}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem' }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
