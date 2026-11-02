import React from 'react';
import {
  LayoutDashboard,
  Smartphone,
  PlaySquare,
  PackagePlus,
  Grid,
  FolderOpen,
  Activity,
  Server,
  ShieldCheck,
  BookOpen
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'devices'
  | 'workspace'
  | 'apk_installer'
  | 'apps'
  | 'files'
  | 'metrics'
  | 'worker'
  | 'admin'
  | 'docs';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  runningCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  runningCount,
}) => {
  const navItems: Array<{ id: NavTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'devices', label: 'My Devices', icon: Smartphone, badge: runningCount > 0 ? runningCount : undefined },
    { id: 'workspace', label: 'Phone Workspace', icon: PlaySquare },
    { id: 'apk_installer', label: 'APK Installer', icon: PackagePlus },
    { id: 'apps', label: 'App Library', icon: Grid },
    { id: 'files', label: 'File Manager', icon: FolderOpen },
    { id: 'metrics', label: 'System Metrics', icon: Activity },
    { id: 'worker', label: 'KVM Worker Node', icon: Server },
    { id: 'admin', label: 'Admin & Audits', icon: ShieldCheck },
    { id: 'docs', label: 'Documentation', icon: BookOpen },
  ];

  return (
    <aside className="w-64 bg-slate-950/80 border-r border-slate-800/80 p-4 flex flex-col justify-between shrink-0 h-full">
      <div className="space-y-6">
        {/* Brand wordmark */}
        <div className="px-3 py-2 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-md font-bold text-base">
            W
          </div>
          <div>
            <div className="text-base font-bold tracking-tight text-slate-100">WebDroid</div>
            <div className="text-[11px] text-slate-400 font-medium">Cloud Android Runtime</div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-purple-800 text-purple-100' : 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                    }`}
                  >
                    {item.badge} active
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Cloud Environment pill */}
      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-400">Environment</span>
          <span className="text-purple-400 font-mono text-[10px]">Cloud Sandbox</span>
        </div>
        <div className="text-[11px] text-slate-300 truncate">Android 14 (API 34)</div>
      </div>
    </aside>
  );
};
