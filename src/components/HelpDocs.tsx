import React from 'react';
import {
  BookOpen,
  Terminal,
  Server,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

export const HelpDocs: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto text-left leading-relaxed">
      <div>
        <h2 className="text-xl font-bold text-slate-100">WebDroid Architecture & Operations Guide</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          In-depth documentation for running and deploying Android Virtual Devices in production.
        </p>
      </div>

      {/* High-Level Architecture Diagram Card */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" /> System Architecture & Data Flow
        </h3>
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 space-y-2 overflow-x-auto">
          <div>[Browser Client (React)] ──────── (WebSocket / WebRTC) ────────▶ [WebDroid Gateway (server.ts)]</div>
          <div className="pl-8">│                                                           │</div>
          <div className="pl-8">▼ (Touch / Key Events)                                     ▼ (REST / ADB Protocol)</div>
          <div>[Video Frame Canvas] ◀────── (scrcpy / H.264 stream) ─────── [Linux KVM Worker / AVD]</div>
        </div>
        <p className="text-xs text-slate-400">
          The WebDroid platform uses a decoupled architecture where the web gateway provides authentication, session quotas, and proxying, while real Android instances execute inside containerized Linux workers with hardware KVM acceleration.
        </p>
      </div>

      {/* Production Deployment Guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>KVM Acceleration Requirements</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Running Android Emulator at 60 FPS requires Linux kernel access to <code className="text-purple-300">/dev/kvm</code>. In cloud environments:
          </p>
          <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
            <li>Google Cloud: Compute Engine with nested virtualization enabled</li>
            <li>AWS: Bare-metal instances (e.g. c5.metal or m5zn.metal)</li>
            <li>Hetzner / OVH: Dedicated root bare-metal servers</li>
          </ul>
        </div>

        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Security & Sandbox Isolation</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Each user virtual device runs in an isolated network namespace. Raw ADB ports (5555) are strictly internal and never exposed to the public internet:
          </p>
          <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
            <li>All ADB commands pass through authorized API gateway</li>
            <li>Uploaded APKs are verified before installation</li>
            <li>Automated garbage collection purges inactive instances</li>
          </ul>
        </div>
      </div>

      {/* Environment Deployment Files Reference */}
      <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
        <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-purple-400" />
          <span>Included Production Deployment Files</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-slate-300">
          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg">
            <span className="text-purple-300">/deploy/docker-compose.yml</span> - Full multi-container stack
          </div>
          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg">
            <span className="text-purple-300">/deploy/schema.sql</span> - PostgreSQL production migrations
          </div>
          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg">
            <span className="text-purple-300">/deploy/nginx.conf</span> - Reverse proxy with WebSocket upgrade
          </div>
          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg">
            <span className="text-purple-300">/deploy/setup-kvm.sh</span> - Host provisioning script
          </div>
        </div>
      </div>
    </div>
  );
};
