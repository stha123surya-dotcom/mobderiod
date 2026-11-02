import React, { useState } from 'react';
import { X, Smartphone, Layers, Cpu, HardDrive, ShieldCheck, Check } from 'lucide-react';
import { api } from '../services/api';

interface DeviceWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceCreated: () => void;
}

export const DeviceWizardModal: React.FC<DeviceWizardModalProps> = ({
  isOpen,
  onClose,
  onDeviceCreated,
}) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('Pixel 8 Pro - Dev Sandbox');
  const [model, setModel] = useState('Google Pixel 8 Pro');
  const [androidVersion, setAndroidVersion] = useState('Android 14 (API 34)');
  const [apiLevel, setApiLevel] = useState(34);
  const [cpuCores, setCpuCores] = useState(4);
  const [ramMb, setRamMb] = useState(4096);
  const [storageMb, setStorageMb] = useState(32768);
  const [resolution, setResolution] = useState({ width: 1080, height: 2400, density: 420 });
  const [hasPlayStore, setHasPlayStore] = useState(true);
  const [networkMode, setNetworkMode] = useState<'nat' | 'bridge' | 'isolated'>('nat');

  if (!isOpen) return null;

  const devicePresets = [
    {
      model: 'Google Pixel 8 Pro',
      resolution: { width: 1080, height: 2400, density: 420 },
      ram: 8192,
      cpu: 4,
      desc: 'Flagship device with high DPI display and hardware acceleration.',
    },
    {
      model: 'Google Pixel 7a',
      resolution: { width: 1080, height: 2400, density: 420 },
      ram: 4096,
      cpu: 4,
      desc: 'Balanced mid-tier profile optimized for general app compatibility.',
    },
    {
      model: 'Samsung Galaxy S24',
      resolution: { width: 1080, height: 2340, density: 416 },
      ram: 8192,
      cpu: 8,
      desc: 'High-performance multi-core configuration for gaming and heavy workloads.',
    },
    {
      model: 'Android Tablet 10"',
      resolution: { width: 1200, height: 1920, density: 240 },
      ram: 4096,
      cpu: 4,
      desc: 'Tablet form factor for testing responsive dual-pane layouts.',
    },
  ];

  const handleSelectPreset = (p: typeof devicePresets[0]) => {
    setModel(p.model);
    setResolution(p.resolution);
    setRamMb(p.ram);
    setCpuCores(p.cpu);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.createDevice({
        name,
        model,
        androidVersion,
        apiLevel,
        cpuCores,
        ramMb,
        storageMb,
        resolution,
        hasPlayStore,
        networkMode,
      });
      onDeviceCreated();
      onClose();
    } catch (err) {
      console.error('Failed to create device:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col text-left">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100">Create Android Virtual Device</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Step {step} of 2: {step === 1 ? 'Hardware Profile & Android OS' : 'Resources & Networking'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Device Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Pixel 8 Pro - Testbed"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Device Hardware Preset</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {devicePresets.map((p) => {
                    const isSelected = model === p.model;
                    return (
                      <div
                        key={p.model}
                        onClick={() => handleSelectPreset(p)}
                        className={`cursor-pointer p-3.5 rounded-2xl border transition-all text-left ${
                          isSelected
                            ? 'bg-purple-950/40 border-purple-500 ring-1 ring-purple-500/50'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-200">{p.model}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-purple-400" />}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{p.desc}</p>
                        <div className="text-[10px] text-slate-400 font-mono mt-2">
                          {p.resolution.width}x{p.resolution.height} · {p.ram / 1024}GB RAM
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Android System Image</label>
                <select
                  value={androidVersion}
                  onChange={(e) => {
                    setAndroidVersion(e.target.value);
                    if (e.target.value.includes('34')) setApiLevel(34);
                    if (e.target.value.includes('33')) setApiLevel(33);
                    if (e.target.value.includes('32')) setApiLevel(32);
                    if (e.target.value.includes('30')) setApiLevel(30);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
                >
                  <option value="Android 14 (API 34)">Android 14 (API 34) - Upside Down Cake (Default)</option>
                  <option value="Android 13 (API 33)">Android 13 (API 33) - Tiramisu</option>
                  <option value="Android 12L (API 32)">Android 12L (API 32) - Large Screen</option>
                  <option value="Android 11 (API 30)">Android 11 (API 30) - Red Velvet Cake</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">RAM Allocation</label>
                  <select
                    value={ramMb}
                    onChange={(e) => setRamMb(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono"
                  >
                    <option value={2048}>2 GB (Lightweight)</option>
                    <option value={4096}>4 GB (Recommended)</option>
                    <option value={8192}>8 GB (High Performance)</option>
                    <option value={12288}>12 GB (Heavy Multitasking)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">vCPU Cores</label>
                  <select
                    value={cpuCores}
                    onChange={(e) => setCpuCores(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono"
                  >
                    <option value={2}>2 Cores</option>
                    <option value={4}>4 Cores (Recommended)</option>
                    <option value={8}>8 Cores (Heavy Workloads)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Internal Storage</label>
                  <select
                    value={storageMb}
                    onChange={(e) => setStorageMb(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono"
                  >
                    <option value={16384}>16 GB</option>
                    <option value={32768}>32 GB (Standard)</option>
                    <option value={65536}>64 GB</option>
                    <option value={131072}>128 GB</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Network Architecture</label>
                  <select
                    value={networkMode}
                    onChange={(e) => setNetworkMode(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono"
                  >
                    <option value="nat">NAT (Standard Internet)</option>
                    <option value="bridge">Bridge (Direct LAN Access)</option>
                    <option value="isolated">Isolated (Offline Sandbox)</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-200">Google Play Store & Services</div>
                  <div className="text-[11px] text-slate-400">Include Google Play Services for GMS dependent apps</div>
                </div>
                <input
                  type="checkbox"
                  checked={hasPlayStore}
                  onChange={(e) => setHasPlayStore(e.target.checked)}
                  className="w-4 h-4 accent-purple-600 rounded"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            {step === 2 ? (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-slate-100 font-semibold"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 font-semibold"
              >
                Cancel
              </button>
              {step === 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Next: Resources
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Provisioning...' : 'Provision Virtual Device'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
