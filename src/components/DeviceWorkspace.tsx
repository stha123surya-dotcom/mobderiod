import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCcw,
  Camera,
  Video,
  Volume2,
  VolumeX,
  Power,
  Square,
  Circle,
  ChevronLeft,
  Maximize2,
  Minimize2,
  Clipboard,
  Terminal,
  Wifi,
  BatteryCharging,
  Battery,
  Layers,
  Sparkles,
  ExternalLink,
  Upload,
  RefreshCw,
  Search,
  CheckCircle2,
  Folder,
  Sliders,
  Play
} from 'lucide-react';
import { VirtualDevice, InstalledApp } from '../types';
import { api } from '../services/api';

interface DeviceWorkspaceProps {
  device: VirtualDevice | null;
  onRefreshDevice: () => void;
  onOpenApkInstaller: () => void;
  onOpenFileBrowse: () => void;
}

export const DeviceWorkspace: React.FC<DeviceWorkspaceProps> = ({
  device,
  onRefreshDevice,
  onOpenApkInstaller,
  onOpenFileBrowse,
}) => {
  const [activeApp, setActiveApp] = useState<string | null>(device?.activeAppPackage || null);
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [showClipboardModal, setShowClipboardModal] = useState(false);
  const [clipboardText, setClipboardText] = useState(device?.clipboard || '');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [scale, setScale] = useState<'fit' | '100' | '75'>('fit');
  const [isLandscape, setIsLandscape] = useState(device?.orientation === 'landscape');
  const [touchFeedback, setTouchFeedback] = useState<{ x: number; y: number } | null>(null);
  const [showPowerMenu, setShowPowerMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    'WebDroid Virtual Android Shell v14.0.0 (Linux 6.1.0-android)',
    'Type "help", "pm list packages", "getprop", "df -h", or "uname -a"',
  ]);
  const [calculatorState, setCalculatorState] = useState({ display: '0', prev: '', op: '' });
  const [notesList, setNotesList] = useState<string[]>([
    'Welcome to WebDroid Cloud Emulator!',
    'Test APK installation from APK Installer tab.',
    'ADB bridge active on port 5555.',
  ]);
  const [newNoteInput, setNewNoteInput] = useState('');
  const [browserUrl, setBrowserUrl] = useState('https://developer.android.com');
  const [browserSearchInput, setBrowserSearchInput] = useState('https://developer.android.com');

  const screenRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Sync state when device updates
  useEffect(() => {
    if (device) {
      setActiveApp(device.activeAppPackage ?? null);
      setIsLandscape(device.orientation === 'landscape');
      loadApps();
    }
  }, [device?.id, device?.activeAppPackage, device?.orientation]);

  // Keep clock updated
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadApps = async () => {
    if (!device) return;
    try {
      const list = await api.getApps(device.id);
      setInstalledApps(list);
    } catch (err) {
      console.error('Failed to load apps:', err);
    }
  };

  const handleTouch = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!screenRef.current || !device || device.status !== 'running' || !device.isScreenOn) return;
    const rect = screenRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    setTouchFeedback({ x, y });
    setTimeout(() => setTouchFeedback(null), 300);
  };

  const sendHardwareKey = async (button: 'power' | 'vol_up' | 'vol_down' | 'back' | 'home' | 'recents') => {
    if (!device) return;
    if (button === 'power') {
      setShowPowerMenu(true);
    } else if (button === 'home') {
      setActiveApp(null);
      await api.launchApp(device.id, 'com.android.launcher3').catch(() => {});
      onRefreshDevice();
    } else if (button === 'back') {
      if (activeApp) {
        setActiveApp(null);
      }
    } else if (button === 'recents') {
      setActiveApp('com.android.systemui.recents');
    } else if (button === 'vol_up') {
      setVolume((prev) => Math.min(100, prev + 10));
      setIsMuted(false);
    } else if (button === 'vol_down') {
      setVolume((prev) => {
        const next = Math.max(0, prev - 10);
        if (next === 0) setIsMuted(true);
        return next;
      });
    }
  };

  const toggleRotate = () => {
    const next = !isLandscape;
    setIsLandscape(next);
  };

  const takeScreenshot = () => {
    if (!screenRef.current) return;
    // Client-side instant capture of the rendered Android phone display
    const canvas = document.createElement('canvas');
    const rect = screenRef.current.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(2, 2);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, rect.width, rect.height);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 16px Plus Jakarta Sans, sans-serif';
      ctx.fillText(`WebDroid Screenshot - ${device?.name || 'Pixel 8'}`, 24, 40);
      ctx.font = '12px JetBrains Mono, monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`Timestamp: ${new Date().toISOString()}`, 24, 64);
      ctx.fillText(`Resolution: ${device?.resolution.width || 1080}x${device?.resolution.height || 2400} (${device?.resolution.density} dpi)`, 24, 84);
      ctx.fillText(`Active Package: ${activeApp || 'com.android.launcher3'}`, 24, 104);

      // Download
      const link = document.createElement('a');
      link.download = `webdroid-screenshot-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      // Finish recording
      if (recordedChunks.length > 0) {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `webdroid-session-${Date.now()}.webm`;
        a.click();
        setRecordedChunks([]);
      }
    } else {
      setIsRecording(true);
      // Record simulated stream
      setRecordedChunks([new Blob(['webdroid_video_stream_mock'], { type: 'video/webm' })]);
    }
  };

  const handleLaunchApp = async (pkg: string) => {
    if (!device) return;
    try {
      await api.launchApp(device.id, pkg);
      setActiveApp(pkg);
      onRefreshDevice();
    } catch (err) {
      console.error('Launch failed:', err);
    }
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim();
    if (!cmd) return;

    let response = `shell@webdroid:/ $ ${cmd}\n`;
    if (cmd === 'help') {
      response += 'Available commands: help, pm list packages, getprop, df -h, uname -a, clear, adb devices, id';
    } else if (cmd === 'clear') {
      setTerminalOutput([]);
      setTerminalInput('');
      return;
    } else if (cmd.startsWith('pm list packages')) {
      response += installedApps.map((a) => `package:${a.packageName}`).join('\n');
    } else if (cmd === 'getprop') {
      response += `[ro.build.version.release]: [14]\n[ro.build.version.sdk]: [34]\n[ro.product.model]: [${device?.model || 'Pixel 8 Pro'}]\n[ro.product.cpu.abi]: [x86_64]\n[ro.build.type]: [userdebug]`;
    } else if (cmd === 'df -h') {
      response += 'Filesystem      Size  Used Avail Use% Mounted on\n/dev/block/sda   64G  4.8G   59G   8% /\n/dev/block/sdb   32G  1.2G   30G   4% /data\n/dev/block/sdc  512M   12M  500M   3% /sdcard';
    } else if (cmd === 'uname -a') {
      response += 'Linux localhost 6.1.25-android14-11 #1 SMP PREEMPT x86_64 GNU/Linux';
    } else if (cmd === 'adb devices') {
      response += `List of devices attached\nemulator-${device?.adbPort || 5555}    device`;
    } else if (cmd === 'id') {
      response += 'uid=2000(shell) gid=2000(shell) groups=2000(shell),1004(input),1007(log),1011(adb),1015(sdcard_rw)';
    } else {
      response += `sh: ${cmd}: command executed successfully (exit code 0)`;
    }

    setTerminalOutput((prev) => [...prev, response]);
    setTerminalInput('');
  };

  const handleCalcButton = (val: string) => {
    if (val === 'C') {
      setCalculatorState({ display: '0', prev: '', op: '' });
      return;
    }
    if (['+', '-', '*', '/'].includes(val)) {
      setCalculatorState({ display: '0', prev: calculatorState.display, op: val });
      return;
    }
    if (val === '=') {
      const prevNum = parseFloat(calculatorState.prev) || 0;
      const currNum = parseFloat(calculatorState.display) || 0;
      let res = 0;
      if (calculatorState.op === '+') res = prevNum + currNum;
      if (calculatorState.op === '-') res = prevNum - currNum;
      if (calculatorState.op === '*') res = prevNum * currNum;
      if (calculatorState.op === '/') res = currNum !== 0 ? prevNum / currNum : 0;
      setCalculatorState({ display: String(res), prev: '', op: '' });
      return;
    }
    setCalculatorState((prev) => ({
      ...prev,
      display: prev.display === '0' ? val : prev.display + val,
    }));
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteInput.trim()) return;
    setNotesList((prev) => [newNoteInput.trim(), ...prev]);
    setNewNoteInput('');
  };

  const handleFetchLogs = async () => {
    if (!device) return;
    try {
      const logData = await api.getLogs(device.id);
      setLogs(logData);
      setShowLogs(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveClipboard = async () => {
    if (!device) return;
    try {
      await fetch(`/api/devices/${device.id}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'clipboard_paste', text: clipboardText }),
      });
      setShowClipboardModal(false);
      onRefreshDevice();
    } catch {}
  };

  if (!device) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[calc(100vh-160px)]">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-purple-400">
          <Layers className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-100 mb-2">No Virtual Device Selected</h3>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          Select or boot an Android virtual machine from the My Devices tab to begin real-time streaming and ADB interaction.
        </p>
      </div>
    );
  }

  const isRunning = device.status === 'running';

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl mx-auto items-start">
      {/* Phone Canvas Center Area */}
      <div className="flex-1 flex flex-col items-center w-full">
        {/* Workspace Toolbar */}
        <div className="w-full flex items-center justify-between gap-4 px-4 py-2.5 mb-4 bg-slate-900/90 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-200 truncate max-w-xs">{device.name}</span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-mono text-purple-300">{device.model}</span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-mono text-slate-400">
              {device.resolution.width}x{device.resolution.height}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleRotate}
              title="Rotate Screen"
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={takeScreenshot}
              title="Capture Screenshot"
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
            <button
              onClick={toggleRecording}
              title={isRecording ? 'Stop Recording' : 'Record Screen'}
              className={`p-1.5 rounded-lg transition-colors ${
                isRecording ? 'text-red-400 bg-red-950/60 animate-pulse' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`}
            >
              <Video className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowClipboardModal(true)}
              title="Clipboard Synchronization"
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Clipboard className="w-4 h-4" />
            </button>
            <button
              onClick={handleFetchLogs}
              title="View Logcat"
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Terminal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Physical Phone Enclosure with Side Hardware Buttons */}
        <div className="relative flex items-center justify-center p-4">
          {/* Left Hardware Buttons (Volume Up & Down) */}
          <div className="absolute -left-1 flex flex-col gap-3 z-10">
            <button
              onClick={() => sendHardwareKey('vol_up')}
              title="Volume Up"
              className="w-1.5 h-12 bg-slate-700 hover:bg-purple-500 rounded-l-md transition-colors shadow-md"
            />
            <button
              onClick={() => sendHardwareKey('vol_down')}
              title="Volume Down"
              className="w-1.5 h-12 bg-slate-700 hover:bg-purple-500 rounded-l-md transition-colors shadow-md"
            />
          </div>

          {/* Right Hardware Button (Power Button) */}
          <div className="absolute -right-1 top-24 z-10">
            <button
              onClick={() => sendHardwareKey('power')}
              title="Power Button"
              className="w-1.5 h-14 bg-slate-700 hover:bg-purple-500 rounded-r-md transition-colors shadow-md"
            />
          </div>

          {/* Phone Frame */}
          <div
            className={`transition-all duration-300 relative bg-neutral-950 rounded-[44px] p-3 shadow-2xl border-4 border-slate-800 ${
              isLandscape ? 'w-[740px] h-[390px]' : 'w-[370px] h-[740px]'
            }`}
          >
            {/* Screen Glass */}
            <div
              ref={screenRef}
              onClick={handleTouch}
              className="relative w-full h-full bg-slate-950 rounded-[34px] overflow-hidden flex flex-col select-none cursor-pointer"
            >
              {/* Touch ripple feedback */}
              {touchFeedback && (
                <div
                  className="absolute z-50 w-6 h-6 rounded-full bg-white/40 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 animate-ping"
                  style={{ left: touchFeedback.x, top: touchFeedback.y }}
                />
              )}

              {/* Top Bezel / Camera Punch Hole & Android Status Bar */}
              <div className="relative z-30 flex items-center justify-between px-6 pt-2 pb-1 text-xs text-slate-300 font-mono">
                <span>{currentTime}</span>
                {/* Punch Hole Camera */}
                <div className="w-3.5 h-3.5 rounded-full bg-black border border-neutral-800 mx-auto" />
                <div className="flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5" />
                  <span className="text-[10px]">5G</span>
                  {device.isBatteryCharging ? (
                    <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Battery className="w-3.5 h-3.5" />
                  )}
                  <span className="text-[10px] tabular-nums">{device.batteryLevel}%</span>
                </div>
              </div>

              {/* Display Viewport Content */}
              <div className="flex-1 relative overflow-hidden flex flex-col">
                {!isRunning || !device.isScreenOn ? (
                  /* Screen Off or Booting State */
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-black">
                    {device.status === 'booting' ? (
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
                        <span className="text-sm font-semibold text-slate-300">Android is starting...</span>
                        <span className="text-xs font-mono text-slate-500">Loading zygote & services</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <Power className="w-8 h-8 text-slate-700" />
                        <span className="text-xs text-slate-500">Screen Off</span>
                        <button
                          onClick={() => sendHardwareKey('power')}
                          className="px-3 py-1 text-xs bg-slate-900 border border-slate-800 text-purple-400 rounded-lg hover:bg-slate-800 transition-colors"
                        >
                          Wake Screen
                        </button>
                      </div>
                    )}
                  </div>
                ) : activeApp === null ? (
                  /* Android 14 Material Launcher Home */
                  <div className="flex-1 p-4 flex flex-col justify-between bg-gradient-to-b from-slate-900 via-slate-950 to-indigo-950/40">
                    {/* Clock & Weather Widget */}
                    <div className="pt-4 flex flex-col items-center">
                      <div className="text-4xl font-extralight tracking-tight text-slate-100 font-mono tabular-nums">
                        {currentTime}
                      </div>
                      <div className="text-xs text-purple-300 font-medium mt-1">
                        Monday, Nov 2 · 22°C Clear
                      </div>
                    </div>

                    {/* Google Search Widget Pill */}
                    <div className="mx-2 my-2 py-2 px-3 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-between border border-white/10">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Search className="w-3.5 h-3.5 text-purple-400" />
                        <span>Search apps or web</span>
                      </div>
                      <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center text-[10px] text-white font-bold">
                        G
                      </div>
                    </div>

                    {/* Installed App Icons Grid */}
                    <div className="grid grid-cols-4 gap-3 py-2">
                      {installedApps.map((app) => (
                        <button
                          key={app.id}
                          onClick={() => handleLaunchApp(app.packageName)}
                          className="flex flex-col items-center gap-1 group text-center p-1 rounded-xl hover:bg-white/5 transition-all"
                        >
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
                            {app.appName.includes('Chrome') ? (
                              <ExternalLink className="w-6 h-6" />
                            ) : app.appName.includes('Settings') ? (
                              <Sliders className="w-6 h-6" />
                            ) : app.appName.includes('Files') ? (
                              <Folder className="w-6 h-6" />
                            ) : app.appName.includes('Camera') ? (
                              <Camera className="w-6 h-6" />
                            ) : app.appName.includes('Terminal') ? (
                              <Terminal className="w-6 h-6" />
                            ) : (
                              <Sparkles className="w-6 h-6" />
                            )}
                          </div>
                          <span className="text-[11px] text-slate-200 font-medium truncate max-w-[64px]">
                            {app.appName}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Dock Apps Bar */}
                    <div className="pt-2 pb-1 border-t border-white/10 flex items-center justify-around">
                      <button
                        onClick={() => handleLaunchApp('org.chromium.chrome')}
                        className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md hover:scale-105 transition-transform"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleLaunchApp('jackpal.androidterm')}
                        className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 shadow-md hover:scale-105 transition-transform"
                      >
                        <Terminal className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleLaunchApp('com.android.documentsui')}
                        className="w-11 h-11 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-md hover:scale-105 transition-transform"
                      >
                        <Folder className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleLaunchApp('com.android.settings')}
                        className="w-11 h-11 rounded-2xl bg-slate-700 flex items-center justify-center text-purple-300 shadow-md hover:scale-105 transition-transform"
                      >
                        <Sliders className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : activeApp === 'com.android.settings' ? (
                  /* Settings App Screen */
                  <div className="flex-1 bg-slate-950 p-4 overflow-y-auto text-left">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
                      <Sliders className="w-5 h-5 text-purple-400" />
                      <h4 className="text-base font-semibold text-slate-100">Android Settings</h4>
                    </div>
                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                        <div className="text-slate-400">Device Name</div>
                        <div className="text-slate-100 font-medium">{device.name}</div>
                      </div>
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                        <div className="text-slate-400">Android Version</div>
                        <div className="text-slate-100 font-medium">{device.androidVersion}</div>
                        <div className="text-slate-500 font-mono mt-0.5">Build: UP1A.231005.007</div>
                      </div>
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                        <div className="text-slate-400">Memory & Storage</div>
                        <div className="text-slate-100 font-medium">{device.ramMb / 1024} GB RAM · {device.storageMb / 1024} GB Storage</div>
                      </div>
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                        <div className="text-slate-400">ADB Status</div>
                        <div className="text-emerald-400 font-mono flex items-center gap-1.5 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Listening on port {device.adbPort}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : activeApp === 'org.chromium.chrome' ? (
                  /* Chrome Browser App Screen */
                  <div className="flex-1 bg-slate-950 flex flex-col text-left">
                    <div className="p-2 bg-slate-900 border-b border-slate-800 flex items-center gap-2">
                      <input
                        type="text"
                        value={browserSearchInput}
                        onChange={(e) => setBrowserSearchInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && setBrowserUrl(browserSearchInput)}
                        className="flex-1 bg-slate-950 border border-slate-700 px-3 py-1 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
                      />
                      <button
                        onClick={() => setBrowserUrl(browserSearchInput)}
                        className="px-2 py-1 bg-purple-600 text-white rounded text-xs"
                      >
                        Go
                      </button>
                    </div>
                    <div className="flex-1 p-4 bg-slate-900/50 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mb-3">
                        <ExternalLink className="w-6 h-6" />
                      </div>
                      <h5 className="text-sm font-semibold text-slate-200">Chrome Android Engine</h5>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs">
                        Rendering web content: <span className="text-purple-300 font-mono">{browserUrl}</span>
                      </p>
                    </div>
                  </div>
                ) : activeApp === 'jackpal.androidterm' ? (
                  /* Terminal App Screen */
                  <div className="flex-1 bg-black p-3 font-mono text-xs flex flex-col text-left text-emerald-400">
                    <div className="flex-1 overflow-y-auto space-y-1">
                      {terminalOutput.map((out, i) => (
                        <div key={i} className="whitespace-pre-wrap">{out}</div>
                      ))}
                    </div>
                    <form onSubmit={handleTerminalSubmit} className="pt-2 flex items-center gap-1 border-t border-slate-800">
                      <span className="text-purple-400">$</span>
                      <input
                        type="text"
                        value={terminalInput}
                        onChange={(e) => setTerminalInput(e.target.value)}
                        className="flex-1 bg-transparent text-emerald-400 outline-none"
                        placeholder="type adb command..."
                        autoFocus
                      />
                    </form>
                  </div>
                ) : activeApp === 'com.webdroid.calculator' ? (
                  /* Calculator App Screen */
                  <div className="flex-1 bg-slate-950 p-4 flex flex-col justify-end text-right">
                    <div className="text-4xl font-mono text-slate-100 mb-6 px-2">{calculatorState.display}</div>
                    <div className="grid grid-cols-4 gap-2">
                      {['C', '(', ')', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '='].map((btn) => (
                        <button
                          key={btn}
                          onClick={() => handleCalcButton(btn)}
                          className={`h-12 rounded-xl text-sm font-semibold transition-colors ${
                            ['/', '*', '-', '+', '='].includes(btn)
                              ? 'bg-purple-600 text-white hover:bg-purple-500'
                              : 'bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-800'
                          }`}
                        >
                          {btn}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : activeApp === 'com.webdroid.notes' ? (
                  /* Notes App Screen */
                  <div className="flex-1 bg-slate-950 p-4 flex flex-col text-left">
                    <h4 className="text-sm font-bold text-slate-100 mb-3">Quick Notes APK</h4>
                    <form onSubmit={handleAddNote} className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newNoteInput}
                        onChange={(e) => setNewNoteInput(e.target.value)}
                        placeholder="New note..."
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none"
                      />
                      <button type="submit" className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium">
                        Add
                      </button>
                    </form>
                    <div className="flex-1 overflow-y-auto space-y-2">
                      {notesList.map((n, i) => (
                        <div key={i} className="p-2.5 bg-slate-900 border border-slate-800/80 rounded-lg text-xs text-slate-200">
                          {n}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Generic / Uploaded APK App Screen */
                  <div className="flex-1 bg-slate-950 p-6 flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-14 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center mb-3">
                      <Play className="w-7 h-7" />
                    </div>
                    <h4 className="text-base font-semibold text-slate-100">
                      {installedApps.find((a) => a.packageName === activeApp)?.appName || 'Android App'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 font-mono">{activeApp}</p>
                    <div className="mt-4 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Running live activity intent
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Android System Navigation Bar */}
              <div className="h-10 bg-black/90 border-t border-neutral-900 flex items-center justify-around z-30">
                <button
                  onClick={() => sendHardwareKey('back')}
                  title="Back"
                  className="p-2 text-slate-400 hover:text-slate-100 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => sendHardwareKey('home')}
                  title="Home"
                  className="p-2 text-slate-400 hover:text-slate-100 transition-colors"
                >
                  <Circle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => sendHardwareKey('recents')}
                  title="Recent Apps"
                  className="p-2 text-slate-400 hover:text-slate-100 transition-colors"
                >
                  <Square className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Details & Fast Tools Panel */}
      <div className="w-full lg:w-80 flex flex-col gap-4">
        {/* Device Quick Stats Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-100">Device Diagnostics</h4>
            <span
              className={`text-xs px-2 py-0.5 rounded font-mono ${
                device.status === 'running'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {device.status.toUpperCase()}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Uptime</span>
              <span className="font-mono tabular-nums text-slate-200">
                {Math.floor(device.uptimeSeconds / 60)}m {device.uptimeSeconds % 60}s
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">CPU Load</span>
              <span className="font-mono tabular-nums text-slate-200">{device.cpuUsagePercent.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">RAM Allocation</span>
              <span className="font-mono tabular-nums text-slate-200">
                {device.ramMb} MB ({device.ramUsagePercent.toFixed(1)}%)
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">ADB Port</span>
              <span className="font-mono text-purple-300">{device.adbPort}</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-400">Network IP</span>
              <span className="font-mono text-slate-200">{device.ipAddress}</span>
            </div>
          </div>

          {/* Quick Action Links */}
          <div className="grid grid-cols-2 gap-2 mt-5">
            <button
              onClick={onOpenApkInstaller}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Upload className="w-3.5 h-3.5" /> Install APK
            </button>
            <button
              onClick={onOpenFileBrowse}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors border border-slate-700"
            >
              <Folder className="w-3.5 h-3.5" /> Push Files
            </button>
          </div>
        </div>

        {/* Volume & Audio Strip */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-slate-100">Audio Stream</h4>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseInt(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            className="w-full accent-purple-500"
          />
          <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1">
            <span>{isMuted ? 'Muted' : `${volume}%`}</span>
            <span>PCM 48kHz</span>
          </div>
        </div>

        {/* Logcat Modal or Drawer */}
        {showLogs && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-[11px] text-left">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <span className="text-slate-300 font-semibold">ADB Logcat Stream</span>
              <button
                onClick={() => setShowLogs(false)}
                className="text-slate-400 hover:text-slate-100"
              >
                ✕
              </button>
            </div>
            <div className="h-44 overflow-y-auto space-y-1 text-slate-400">
              {logs.map((log, i) => (
                <div key={i} className="hover:text-slate-200">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clipboard Sync Modal */}
        {showClipboardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md text-left">
              <h3 className="text-base font-bold text-slate-100 mb-2">Android Clipboard Sync</h3>
              <p className="text-xs text-slate-400 mb-4">
                Enter text below to push directly into the virtual device clipboard buffer.
              </p>
              <textarea
                value={clipboardText}
                onChange={(e) => setClipboardText(e.target.value)}
                className="w-full h-28 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-purple-500 font-mono mb-4"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowClipboardModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveClipboard}
                  className="px-4 py-2 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold transition-colors"
                >
                  Push to Android
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Power Menu Modal */}
        {showPowerMenu && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-xs text-center">
              <h3 className="text-base font-bold text-slate-100 mb-4">Power Options</h3>
              <div className="space-y-2">
                <button
                  onClick={async () => {
                    setShowPowerMenu(false);
                    await api.restartDevice(device.id);
                    onRefreshDevice();
                  }}
                  className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Restart Device
                </button>
                <button
                  onClick={async () => {
                    setShowPowerMenu(false);
                    await api.stopDevice(device.id);
                    onRefreshDevice();
                  }}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-red-400 rounded-xl text-xs font-semibold transition-colors border border-slate-700"
                >
                  Power Off
                </button>
                <button
                  onClick={() => setShowPowerMenu(false)}
                  className="w-full py-2 px-4 text-slate-400 hover:text-slate-200 text-xs transition-colors mt-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
