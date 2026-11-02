import React, { useState } from 'react';
import {
  Server,
  Zap,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Terminal,
  ShieldAlert
} from 'lucide-react';
import { EnvironmentDiagnostics } from '../types';
import { api } from '../services/api';

interface WorkerSetupModalProps {
  envInfo: EnvironmentDiagnostics | null;
  onRefreshEnv: () => void;
}

export const WorkerSetupModal: React.FC<WorkerSetupModalProps> = ({
  envInfo,
  onRefreshEnv,
}) => {
  const [workerUrl, setWorkerUrl] = useState(envInfo?.workerUrl || '');
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const dockerCommand = `docker run -d --name webdroid-kvm-worker \\
  --device /dev/kvm \\
  -e ANDROID_API=34 \\
  -e WEBRTC_PORT=8554 \\
  -p 5555:5555 -p 8554:8554 \\
  webdroid/emulator-worker:latest`;

  const handleCopy = () => {
    navigator.clipboard.writeText(dockerCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsTesting(true);
      const res = await api.updateWorkerConfig(workerUrl);
      setMessage(res.message);
      onRefreshEnv();
    } catch (err: any) {
      setMessage(err.message || 'Failed to link worker');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-left">
      <div>
        <h2 className="text-xl font-bold text-slate-100">KVM Emulator Worker Cluster</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Connect dedicated Linux servers with bare-metal KVM acceleration to run heavy AVD instances.
        </p>
      </div>

      {/* Current Worker Status */}
      <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-purple-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">Worker Node Status</div>
            <div className="text-[11px] text-slate-400 font-mono">
              {envInfo?.workerConnected
                ? `Connected to: ${envInfo.workerUrl}`
                : 'Using integrated WebDroid cloud runtime with full app execution.'}
            </div>
          </div>
        </div>

        <span
          className={`text-xs px-2.5 py-1 rounded-lg font-mono font-semibold ${
            envInfo?.workerConnected
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
          }`}
        >
          {envInfo?.workerConnected ? 'REMOTE WORKER ACTIVE' : 'INTEGRATED RUNTIME'}
        </span>
      </div>

      {/* Connect Remote Worker Form */}
      <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl">
        <h3 className="text-sm font-bold text-slate-100 mb-2">Connect Dedicated KVM Node</h3>
        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          If you have a Linux server (AWS, GCP, Hetzner, Bare Metal) with nested virtualization enabled, point WebDroid to your worker's ADB/WebRTC endpoint.
        </p>

        <form onSubmit={handleSaveConfig} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={workerUrl}
            onChange={(e) => setWorkerUrl(e.target.value)}
            placeholder="http://your-kvm-worker-host.com:5555"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 font-mono outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            disabled={isTesting}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
          >
            {isTesting ? 'Testing Link...' : 'Save & Link Node'}
          </button>
        </form>

        {message && (
          <div className="mt-3 p-3 bg-purple-950/40 border border-purple-800/60 rounded-xl text-xs text-purple-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
            <span>{message}</span>
          </div>
        )}
      </div>

      {/* Docker Command Quick Setup */}
      <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-purple-400" />
            <h4 className="text-xs font-bold text-slate-200">1-Line Worker Deploy Command (Docker)</h4>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
          {dockerCommand}
        </pre>
      </div>
    </div>
  );
};
