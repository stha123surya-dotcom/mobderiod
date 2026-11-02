import React from 'react';
import {
  Smartphone,
  Play,
  Upload,
  Plus,
  Activity,
  HardDrive,
  Layers,
  Sparkles,
  ExternalLink,
  Cpu,
  Clock,
  ArrowRight
} from 'lucide-react';
import { VirtualDevice, EnvironmentDiagnostics, User } from '../types';
import { NavTab } from './Sidebar';

interface DashboardOverviewProps {
  devices: VirtualDevice[];
  currentDevice: VirtualDevice | null;
  envInfo: EnvironmentDiagnostics | null;
  currentUser: User | null;
  onSelectTab: (tab: NavTab) => void;
  onOpenCreateModal: () => void;
  onSelectDevice: (device: VirtualDevice) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  devices,
  currentDevice,
  envInfo,
  currentUser,
  onSelectTab,
  onOpenCreateModal,
  onSelectDevice,
}) => {
  const runningDevices = devices.filter((d) => d.status === 'running');

  return (
    <div className="space-y-6 text-left">
      {/* Welcome & Primary CTA Hero */}
      <div className="p-6 bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/30 border border-slate-800 rounded-3xl relative overflow-hidden shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-purple-400 font-mono">WebDroid Virtualization Cloud</span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-400">Android 14 (API 34)</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">
              Welcome back, {currentUser?.name || 'Dev Engineer'}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Operate genuine Android virtual devices directly in your web browser. Run APKs, debug with ADB, and stream real-time displays without local emulator overhead.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-950/50"
            >
              <Plus className="w-4 h-4" /> Create Device
            </button>
            {currentDevice && (
              <button
                onClick={() => onSelectTab('workspace')}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-bold transition-all border border-slate-700"
              >
                <Smartphone className="w-4 h-4 text-purple-400" /> Open Workspace
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Top Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Running Devices</div>
            <div className="text-xl font-bold text-slate-100 font-mono mt-1 tabular-nums">
              {runningDevices.length} <span className="text-xs font-normal text-slate-500">/ {devices.length}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Virtualization Engine</div>
            <div className="text-sm font-bold text-slate-100 font-mono mt-1">
              {envInfo?.isKvmAvailable ? 'QEMU / KVM' : 'Cloud Sandbox'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-purple-400">
            <Cpu className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Host Memory Status</div>
            <div className="text-sm font-bold text-slate-100 font-mono mt-1 tabular-nums">
              {envInfo?.freeMemoryMb || 3980} MB Free
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-800/40 flex items-center justify-center text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">ADB Bridge Service</div>
            <div className="text-sm font-bold text-emerald-400 font-mono mt-1">
              Active :5555
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Primary Running Device Quick View & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Phone Spotlight */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-slate-100">Primary Device Status</h3>
              </div>
              <button
                onClick={() => onSelectTab('devices')}
                className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {currentDevice ? (
              <div className="p-5 bg-slate-950/70 border border-slate-800/80 rounded-2xl space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-bold text-slate-100">{currentDevice.name}</h4>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {currentDevice.model} · {currentDevice.androidVersion}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded font-mono font-semibold ${
                      currentDevice.status === 'running'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {currentDevice.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono py-3 border-y border-slate-800">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Uptime</span>
                    <span className="text-slate-200">
                      {Math.floor(currentDevice.uptimeSeconds / 60)}m {currentDevice.uptimeSeconds % 60}s
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">CPU Load</span>
                    <span className="text-slate-200">{currentDevice.cpuUsagePercent.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">RAM Usage</span>
                    <span className="text-slate-200">{currentDevice.ramMb} MB</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Resolution</span>
                    <span className="text-slate-200">
                      {currentDevice.resolution.width}x{currentDevice.resolution.height}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={() => {
                      onSelectDevice(currentDevice);
                      onSelectTab('workspace');
                    }}
                    className="flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-md"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Launch Interactive Phone
                  </button>
                  <button
                    onClick={() => onSelectTab('apk_installer')}
                    className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors border border-slate-700"
                  >
                    Install APK
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/60">
                <p className="text-xs text-slate-400 mb-3">No devices currently available.</p>
                <button
                  onClick={onOpenCreateModal}
                  className="px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-xl"
                >
                  Create Your First Device
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Fast Utilities */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 mb-3">Quick Navigation</h3>
            <div className="space-y-2.5">
              <button
                onClick={() => onSelectTab('apk_installer')}
                className="w-full p-3 bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800/80 rounded-2xl flex items-center gap-3 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-800/40 flex items-center justify-center text-purple-400 shrink-0">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">APK Installer</div>
                  <div className="text-[11px] text-slate-400">Deploy .apk packages via adb</div>
                </div>
              </button>

              <button
                onClick={() => onSelectTab('files')}
                className="w-full p-3 bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800/80 rounded-2xl flex items-center gap-3 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-950/80 border border-indigo-800/40 flex items-center justify-center text-indigo-400 shrink-0">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">File Manager</div>
                  <div className="text-[11px] text-slate-400">Transfer files to /sdcard</div>
                </div>
              </button>

              <button
                onClick={() => onSelectTab('worker')}
                className="w-full p-3 bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800/80 rounded-2xl flex items-center gap-3 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-800/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">KVM Cluster Node</div>
                  <div className="text-[11px] text-slate-400">Dedicated Linux worker setup</div>
                </div>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
            WebDroid v2.4 · Cloud Runtime Verified
          </div>
        </div>
      </div>
    </div>
  );
};
