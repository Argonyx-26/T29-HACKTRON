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
  FolderOpen,
  ChevronRight
} from 'lucide-react';
import { User } from '../../types';
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
      <aside className="w-64 min-h-screen bg-[#060608] border-r border-white/5 flex flex-col justify-between py-6 px-4 flex-shrink-0 z-30 sticky top-0 h-screen overflow-y-auto">
        <div className="flex flex-col space-y-7">
          {/* Brand Logo Lockup from Stitch */}
          <div
            onClick={onGoToLanding || (() => onNavigate(user.role === 'teacher' ? 'overview' : 'home'))}
            className="px-2 pt-1 flex items-center gap-3 cursor-pointer select-none"
            title="Return to Knowledge Twin Landing Page"
          >
            <img
              src="/knowledge-twin-logo.png"
              alt="Knowledge Twin"
              className="h-8 w-auto object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#6800cb] shadow-[0_0_8px_#8b2cf5]" />
              Knowledge <span className="text-[#a855f7]">Twin</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav aria-label="Main Navigation" className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl font-medium text-xs transition-all text-left ${
                    isActive
                      ? 'text-white bg-gradient-to-r from-[#6800cb]/90 to-[#4c0587]/80 shadow-[0_0_20px_rgba(104,0,203,0.35)] border border-purple-500/30'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-white' : 'text-zinc-400'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="pt-4 border-t border-white/5 space-y-1.5">
          {onGoToLanding && (
            <button
              onClick={onGoToLanding}
              className="w-full flex items-center gap-3.5 px-4 py-2 rounded-xl font-medium text-xs text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all text-left"
            >
              <Globe size={15} className="text-zinc-500" />
              <span>Landing Page</span>
            </button>
          )}

          <button
            onClick={() => setShowSettingsModal(true)}
            className="w-full flex items-center gap-3.5 px-4 py-2 rounded-xl font-medium text-xs text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all text-left"
          >
            <Settings size={15} className="text-zinc-500" />
            <span>Settings</span>
          </button>

          <button
            onClick={() => setShowHelpModal(true)}
            className="w-full flex items-center gap-3.5 px-4 py-2 rounded-xl font-medium text-xs text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all text-left"
          >
            <HelpCircle size={15} className="text-zinc-500" />
            <span>Help</span>
          </button>

          {/* User Profile Pill */}
          <div
            onClick={() => setShowAccountModal(true)}
            className="mt-3 flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.04] cursor-pointer transition-all border border-white/5 bg-[#0a0a0e]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#6800cb] to-[#9333ea] flex items-center justify-center font-bold text-xs text-white shadow-[0_0_10px_rgba(104,0,203,0.5)]">
                {user.role === 'teacher' ? 'T' : 'S'}
              </div>
              <div className="text-left">
                <span className="text-xs font-semibold text-zinc-200 block leading-tight">
                  {user.display_name || (user.role === 'teacher' ? 'Teacher' : 'Student')}
                </span>
                <span className="text-[10px] text-zinc-500 capitalize">{user.role}</span>
              </div>
            </div>
            <ChevronRight size={14} className="text-zinc-500" />
          </div>

          <button
            onClick={onSwitchAccount}
            className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[11px] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] transition-colors"
          >
            <LogOut size={12} />
            <span>Switch Role / Logout</span>
          </button>
        </div>
      </aside>

      {/* Account Modal */}
      {showAccountModal && (
        <AccountModal
          user={user}
          onClose={() => setShowAccountModal(false)}
          onSwitchAccount={onSwitchAccount}
          onUpdateUser={(updated) => {
            if (onUpdateUser) onUpdateUser(updated);
            setShowAccountModal(false);
          }}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e0e14] border border-white/10 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold">Preferences &amp; System</h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-zinc-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4 text-xs text-zinc-300">
              <div className="p-3 bg-[#15151f] rounded-xl border border-white/5 flex items-center justify-between">
                <span>Color Theme</span>
                <span className="text-purple-400 font-semibold">Stitch Purple Dark</span>
              </div>
              <div className="p-3 bg-[#15151f] rounded-xl border border-white/5 flex items-center justify-between">
                <span>Cognitive Diagnostics Engine</span>
                <span className="text-emerald-400 font-semibold">Active &middot; v2.4</span>
              </div>
              <div className="p-3 bg-[#15151f] rounded-xl border border-white/5 flex items-center justify-between">
                <span>Auto-adaptive Remediations</span>
                <span className="text-purple-400 font-semibold">Enabled</span>
              </div>
            </div>
            <button
              onClick={() => setShowSettingsModal(false)}
              className="mt-6 w-full py-2 bg-[#6800cb] text-white rounded-xl text-xs font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e0e14] border border-white/10 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold">Knowledge Twin Help</h3>
              <button onClick={() => setShowHelpModal(false)} className="text-zinc-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 text-xs text-zinc-400 leading-relaxed">
              <p>
                <strong className="text-white">What is a Knowledge Twin?</strong> A mathematical profile of how you understand concepts and where your specific misconceptions lie.
              </p>
              <p>
                <strong className="text-white">How do I improve?</strong> Take short diagnostics in the Assess view or follow targeted 3-minute micro-interventions.
              </p>
              <p>
                <strong className="text-white">For Teachers:</strong> Use the Insights tab to see why students with identical scores need completely different teaching interventions.
              </p>
            </div>
            <button
              onClick={() => setShowHelpModal(false)}
              className="mt-6 w-full py-2 bg-[#6800cb] text-white rounded-xl text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
