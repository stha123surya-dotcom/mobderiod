import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  Server,
  Zap,
  Shield,
  Layers,
  RefreshCw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { EnvironmentDiagnostics } from '../types';
import { api } from '../services/api';

interface SystemMetricsProps {
  envInfo: EnvironmentDiagnostics | null;
  onRefresh: () => void;
}

export const SystemMetrics: React.FC<SystemMetricsProps> = ({
  envInfo,
  onRefresh,
}) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 4000);
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      const data = await api.getSystemMetrics();
      setMetrics(data);
    } catch (err) {
      console.error(err);
    }
  };

  const isKvm = envInfo?.isKvmAvailable;
  const isGvisor = envInfo?.isGvisorContainer;

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">System Telemetry & Architecture</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time host environment diagnostics, hardware virtualization status, and runtime load.
          </p>
        </div>

        <button
          onClick={() => {
            onRefresh();
            loadMetrics();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Host Environment Architecture Notice */}
      <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isKvm
                ? 'bg-emerald-950/60 border border-emerald-800/50 text-emerald-300'
                : 'bg-indigo-950/60 border border-indigo-800/50 text-indigo-300'
            }`}
          >
            {isKvm ? <Zap className="w-5 h-5" /> : <Server className="w-5 h-5" />}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-100">
                {isKvm ? 'Hardware Acceleration (KVM) Active' : 'Container Virtualization Runtime (gVisor)'}
              </h4>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                  isKvm
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                }`}
              >
                {isKvm ? 'QEMU / KVM ACCELERATED' : 'CONTAINER MODE'}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
              {isGvisor
                ? 'Host is operating within a secured Google gVisor sandbox container. Nested /dev/kvm kernel access is restricted by the container manager. WebDroid provides full interactive Android OS runtime capabilities directly in this environment, and supports hot-linking to any dedicated Linux KVM server.'
                : 'Hardware virtualization is active with native /dev/kvm module access. QEMU and Android Emulator run at bare-metal execution speeds.'}
            </p>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <div className="text-xs text-slate-400 mb-1">Host Architecture</div>
          <div className="text-base font-bold text-slate-100 font-mono">
            {envInfo?.platform || 'linux'} · {envInfo?.arch || 'x86_64'}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-1">
            {envInfo?.hostCpus || 4} vCPUs allocated
          </div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <div className="text-xs text-slate-400 mb-1">Host Memory Total</div>
          <div className="text-base font-bold text-slate-100 font-mono tabular-nums">
            {envInfo?.totalMemoryMb || 4096} MB
          </div>
          <div className="text-[11px] text-emerald-400 font-mono mt-1">
            {envInfo?.freeMemoryMb || 3980} MB free
          </div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <div className="text-xs text-slate-400 mb-1">Active Virtual Devices</div>
          <div className="text-base font-bold text-slate-100 font-mono tabular-nums">
            {metrics?.emulator.runningDevices || 1} / {metrics?.emulator.totalDevices || 1} running
          </div>
          <div className="text-[11px] text-purple-400 font-mono mt-1">
            {metrics?.emulator.activeWebSockets || 1} WebSockets streaming
          </div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <div className="text-xs text-slate-400 mb-1">Dedicated Worker Link</div>
          <div className="text-base font-bold text-slate-100 font-mono">
            {envInfo?.workerConnected ? 'Connected' : 'Integrated'}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1 truncate">
            {envInfo?.workerUrl || 'Local cloud runtime'}
          </div>
        </div>
      </div>

      {/* Supported Android Versions Matrix */}
      <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl">
        <h4 className="text-sm font-bold text-slate-100 mb-3">Supported Android SDK Target Images</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {envInfo?.supportedAndroidVersions.map((ver, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center gap-2.5 text-xs text-slate-200 font-mono"
            >
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="truncate">{ver}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
