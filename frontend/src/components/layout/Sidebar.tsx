import React, { useState } from 'react';
import {
  Home,
  Compass,
  CheckSquare,
  Layers,
  TrendingUp,
  LogOut,
  Users,
  Sparkles,
  UserCheck,
  FolderOpen,
  RotateCcw
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
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);

  const studentItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'learn', label: 'Learn', icon: Compass },
    { id: 'assess', label: 'Assess', icon: CheckSquare },
    { id: 'twin', label: 'My Twin', icon: Layers },
    { id: 'revision', label: 'Revision Engine', icon: RotateCcw },
    { id: 'progress', label: 'Progress', icon: TrendingUp }
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
      <aside className={`app-sidebar ${user.role === 'teacher' ? 'teacher-sidebar' : activeTab === 'home' ? 'student-home-sidebar' : activeTab === 'learn' ? 'student-learn-sidebar' : activeTab === 'assess' ? 'student-assess-sidebar' : activeTab === 'twin' ? 'student-twin-sidebar' : activeTab === 'revision' ? 'student-revision-sidebar' : activeTab === 'progress' ? 'student-progress-sidebar' : ''}`} style={{
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
                <span style={{ flex: 1, color: isActive ? '#FFFFFF' : 'inherit', fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
                {item.id === 'revision' && (
                  <span style={{
                    fontSize: '0.64rem',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '8px',
                    background: isActive ? '#FFFFFF' : 'rgba(245, 158, 11, 0.15)',
                    color: isActive ? '#10212d' : '#FBBF24',
                    border: isActive ? 'none' : '1px solid rgba(245, 158, 11, 0.35)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase'
                  }}>
                    Due
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section: Account */}
        <div className="app-sidebar-footer" style={{ padding: '14px 12px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '4px' }}>

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
    </>
  );
};

export default Sidebar;
