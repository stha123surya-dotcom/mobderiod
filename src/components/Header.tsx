import React from 'react';
import { Plus } from 'lucide-react';
import { NavTab } from './Sidebar';
import { User } from '../types';

interface HeaderProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenCreateModal: () => void;
  currentUser: User | null;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenCreateModal,
  currentUser,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-8 py-3.5 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('dashboard');
          }}
          className="text-base font-bold tracking-tight text-slate-100 whitespace-nowrap hover:text-purple-300 transition-colors"
        >
          WebDroid Cloud
        </a>
      </div>

      {/* Zone 2: 4–5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-400">
        <button
          onClick={() => onSelectTab('devices')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'devices' ? 'text-purple-400' : ''
          }`}
        >
          Devices
        </button>
        <button
          onClick={() => onSelectTab('workspace')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'workspace' ? 'text-purple-400' : ''
          }`}
        >
          Phone Workspace
        </button>
        <button
          onClick={() => onSelectTab('apk_installer')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'apk_installer' ? 'text-purple-400' : ''
          }`}
        >
          APK Installer
        </button>
        <button
          onClick={() => onSelectTab('files')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'files' ? 'text-purple-400' : ''
          }`}
        >
          File Manager
        </button>
        <button
          onClick={() => onSelectTab('metrics')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'metrics' ? 'text-purple-400' : ''
          }`}
        >
          System Diagnostics
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-4 shrink-0">
        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-600 rounded-xl hover:bg-purple-500 transition-all shadow-md shadow-purple-950/40 whitespace-nowrap shrink-0 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Device</span>
        </button>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
          <img
            src="/src/assets/images/avatar_engineer_1793616370542.jpg"
            alt="Engineer profile"
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-full object-cover border border-purple-500/40 ring-2 ring-purple-500/20"
          />
          <div className="hidden lg:block text-left text-xs">
            <div className="font-semibold text-slate-200 leading-tight truncate max-w-[100px]">
              {currentUser?.name || 'Dev Engineer'}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Admin</div>
          </div>
        </div>
      </div>
    </header>
  );
};
