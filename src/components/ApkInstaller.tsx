import React, { useState } from 'react';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Play,
  Layers,
  Sparkles,
  Smartphone,
  Cpu,
  FileCode,
  ArrowRight
} from 'lucide-react';
import { VirtualDevice, InstalledApp } from '../types';
import { api } from '../services/api';

interface ApkInstallerProps {
  devices: VirtualDevice[];
  selectedDevice: VirtualDevice | null;
  onSelectDevice: (device: VirtualDevice) => void;
  onAppInstalled: (app: InstalledApp) => void;
  onOpenWorkspace: () => void;
}

export const ApkInstaller: React.FC<ApkInstallerProps> = ({
  devices,
  selectedDevice,
  onSelectDevice,
  onAppInstalled,
  onOpenWorkspace,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [installProgress, setInstallProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lastInstalledApp, setLastInstalledApp] = useState<InstalledApp | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sampleApks = [
    {
      id: 'calculator',
      name: 'Scientific Calculator Pro',
      package: 'com.webdroid.calculator',
      version: 'v3.2.0',
      size: '4.8 MB',
      sdk: 'Android 7.0+ (API 24)',
      permissions: ['VIBRATE'],
      desc: 'Scientific calculation engine with trigonometry and memory recall.',
    },
    {
      id: 'paint',
      name: 'Android Canvas Sketch',
      package: 'com.webdroid.sketch',
      version: 'v1.4.1',
      size: '8.2 MB',
      sdk: 'Android 8.0+ (API 26)',
      permissions: ['WRITE_EXTERNAL_STORAGE'],
      desc: 'Pressure-sensitive drawing tool with touch gesture digitizer testing.',
    },
    {
      id: 'benchmark',
      name: 'Device Antutu GeekBench',
      package: 'com.webdroid.benchmark',
      version: 'v5.0.2',
      size: '22.4 MB',
      sdk: 'Android 9.0+ (API 28)',
      permissions: ['INTERNET', 'ACCESS_NETWORK_STATE'],
      desc: 'Multi-core CPU and SurfaceFlinger OpenGL graphics benchmark utility.',
    },
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.name.endsWith('.apk')) {
        setErrorMsg('Invalid file format. Please upload a valid Android package (.apk) file.');
        return;
      }
      installFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      installFile(e.target.files[0]);
    }
  };

  const installFile = async (file: File) => {
    if (!selectedDevice) {
      setErrorMsg('Please select a target virtual device first.');
      return;
    }
    setErrorMsg(null);
    setUploading(true);
    setStatusMessage('Uploading APK package to Android ADB bridge...');
    setInstallProgress(25);

    try {
      setTimeout(() => {
        setStatusMessage('Parsing AndroidManifest.xml and verifying signatures...');
        setInstallProgress(55);
      }, 500);

      setTimeout(() => {
        setStatusMessage('Executing `adb install -r application.apk`...');
        setInstallProgress(85);
      }, 1000);

      const res = await api.installApk(selectedDevice.id, file);
      setInstallProgress(100);
      setStatusMessage(`Successfully installed ${res.app.appName}!`);
      setLastInstalledApp(res.app);
      onAppInstalled(res.app);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to install APK package');
    } finally {
      setUploading(false);
    }
  };

  const handleInstallPreset = async (presetId: string) => {
    if (!selectedDevice) {
      setErrorMsg('Please select a target virtual device first.');
      return;
    }
    setErrorMsg(null);
    setUploading(true);
    setStatusMessage(`Transferring ${presetId}.apk to virtual device...`);
    setInstallProgress(40);

    try {
      setTimeout(() => {
        setStatusMessage('Running adb package manager...');
        setInstallProgress(75);
      }, 600);

      const res = await api.installApk(selectedDevice.id, presetId);
      setInstallProgress(100);
      setStatusMessage(`Installed ${res.app.appName} successfully!`);
      setLastInstalledApp(res.app);
      onAppInstalled(res.app);
    } catch (err: any) {
      setErrorMsg(err.message || 'Installation failed');
    } finally {
      setUploading(false);
    }
  };

  const handleLaunchInstalled = async () => {
    if (!selectedDevice || !lastInstalledApp) return;
    try {
      await api.launchApp(selectedDevice.id, lastInstalledApp.packageName);
      onOpenWorkspace();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-left">
      <div>
        <h2 className="text-xl font-bold text-slate-100">APK Package Installer</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Deploy and run Android applications directly onto isolated virtual devices using real ADB package management.
        </p>
      </div>

      {/* Target Device Selector Bar */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Smartphone className="w-5 h-5 text-purple-400" />
          <div>
            <div className="text-xs font-bold text-slate-200">Target Virtual Device</div>
            <div className="text-[11px] text-slate-400">
              {selectedDevice ? `${selectedDevice.name} (${selectedDevice.status})` : 'No device selected'}
            </div>
          </div>
        </div>

        <select
          value={selectedDevice?.id || ''}
          onChange={(e) => {
            const dev = devices.find((d) => d.id === e.target.value);
            if (dev) onSelectDevice(dev);
          }}
          className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-medium outline-none focus:border-purple-500"
        >
          {devices.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} · {d.androidVersion} ({d.status.toUpperCase()})
            </option>
          ))}
        </select>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Upload Drag & Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-all ${
          dragActive
            ? 'border-purple-500 bg-purple-950/20'
            : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-purple-400 mb-4 shadow-lg">
          <Upload className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-200 mb-1">Upload Android Package (.apk)</h3>
        <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
          Drag and drop your APK binary here, or browse files on your computer. Packages are validated against Android ABI and installed securely via adb.
        </p>

        <label className="cursor-pointer px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md">
          <span>Browse APK Files</span>
          <input
            type="file"
            accept=".apk"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {/* Progress & Installation Result */}
      {uploading && (
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-purple-300 font-semibold">{statusMessage}</span>
            <span className="text-slate-400 tabular-nums">{installProgress}%</span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
            <div
              className="bg-purple-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${installProgress}%` }}
            />
          </div>
        </div>
      )}

      {lastInstalledApp && !uploading && (
        <div className="p-5 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-900/60 border border-emerald-700/50 flex items-center justify-center text-emerald-300">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-emerald-200">
                {lastInstalledApp.appName} Installed Successfully
              </div>
              <div className="text-xs font-mono text-emerald-400/80">
                Package: {lastInstalledApp.packageName} · Version {lastInstalledApp.versionName}
              </div>
            </div>
          </div>

          <button
            onClick={handleLaunchInstalled}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md shrink-0"
          >
            <Play className="w-3.5 h-3.5" /> Launch on Phone
          </button>
        </div>
      )}

      {/* Ready-to-Test Sample APK Library */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-slate-100">Ready-to-Test Sample APKs</h3>
        </div>
        <p className="text-xs text-slate-400">
          Click any pre-packaged open source APK below to test immediate ADB installation and launch.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {sampleApks.map((app) => (
            <div
              key={app.id}
              className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition-all text-left shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold text-slate-100">{app.name}</div>
                  <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 border border-purple-800/40 px-1.5 py-0.5 rounded">
                    {app.version}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mb-2">{app.package}</div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">{app.desc}</p>
                <div className="text-[10px] text-slate-500 font-mono space-y-0.5">
                  <div>Size: {app.size} · {app.sdk}</div>
                  <div className="truncate">Perms: {app.permissions.join(', ')}</div>
                </div>
              </div>

              <button
                onClick={() => handleInstallPreset(app.id)}
                disabled={uploading}
                className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-purple-600 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-colors border border-slate-700 hover:border-purple-600"
              >
                <Upload className="w-3.5 h-3.5" /> 1-Click Install
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
