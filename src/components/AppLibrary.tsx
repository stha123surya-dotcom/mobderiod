import React, { useState, useEffect } from 'react';
import {
  Grid,
  Play,
  Trash2,
  Search,
  Smartphone,
  Shield,
  Layers,
  Sparkles,
  ExternalLink,
  Sliders,
  Folder,
  Camera,
  Terminal,
  CheckCircle2
} from 'lucide-react';
import { VirtualDevice, InstalledApp } from '../types';
import { api } from '../services/api';

interface AppLibraryProps {
  devices: VirtualDevice[];
  selectedDevice: VirtualDevice | null;
  onSelectDevice: (device: VirtualDevice) => void;
  onOpenWorkspace: () => void;
}

export const AppLibrary: React.FC<AppLibraryProps> = ({
  devices,
  selectedDevice,
  onSelectDevice,
  onOpenWorkspace,
}) => {
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'user' | 'system'>('all');
  const [loading, setLoading] = useState(false);
  const [activePackage, setActivePackage] = useState<string | null>(null);

  useEffect(() => {
    if (selectedDevice) {
      loadApps();
    }
  }, [selectedDevice?.id]);

  const loadApps = async () => {
    if (!selectedDevice) return;
    try {
      setLoading(true);
      const list = await api.getApps(selectedDevice.id);
      setApps(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunch = async (pkg: string) => {
    if (!selectedDevice) return;
    try {
      setActivePackage(pkg);
      await api.launchApp(selectedDevice.id, pkg);
      onOpenWorkspace();
    } catch (err) {
      console.error(err);
    } finally {
      setActivePackage(null);
    }
  };

  const handleUninstall = async (pkg: string, name: string) => {
    if (!selectedDevice) return;
    if (!confirm(`Are you sure you want to uninstall "${name}" (${pkg})?`)) return;
    try {
      await api.uninstallApp(selectedDevice.id, pkg);
      loadApps();
    } catch (err: any) {
      alert(err.message || 'Failed to uninstall app');
    }
  };

  const filteredApps = apps.filter((app) => {
    const matchesSearch =
      app.appName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.packageName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      filterType === 'all' ? true : filterType === 'system' ? app.isSystemApp : !app.isSystemApp;
    return matchesSearch && matchesType;
  });

  const getAppIcon = (name: string) => {
    if (name.includes('Chrome')) return <ExternalLink className="w-5 h-5 text-blue-400" />;
    if (name.includes('Settings')) return <Sliders className="w-5 h-5 text-purple-400" />;
    if (name.includes('Files')) return <Folder className="w-5 h-5 text-amber-400" />;
    if (name.includes('Camera')) return <Camera className="w-5 h-5 text-pink-400" />;
    if (name.includes('Terminal')) return <Terminal className="w-5 h-5 text-emerald-400" />;
    return <Sparkles className="w-5 h-5 text-indigo-400" />;
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header and Device Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Android App Library</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            View packages installed via ADB, launch activities, inspect permissions, and remove applications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Smartphone className="w-4 h-4 text-purple-400" />
          <select
            value={selectedDevice?.id || ''}
            onChange={(e) => {
              const dev = devices.find((d) => d.id === e.target.value);
              if (dev) onSelectDevice(dev);
            }}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-medium outline-none focus:border-purple-500"
          >
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.status.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search applications or package names..."
            className="w-full bg-slate-900/90 border border-slate-800 pl-9 pr-4 py-2 rounded-xl text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filterType === 'all' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Packages ({apps.length})
          </button>
          <button
            onClick={() => setFilterType('user')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filterType === 'user' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            User Apps ({apps.filter((a) => !a.isSystemApp).length})
          </button>
          <button
            onClick={() => setFilterType('system')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filterType === 'system' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            System ({apps.filter((a) => a.isSystemApp).length})
          </button>
        </div>
      </div>

      {/* Apps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredApps.map((app) => (
          <div
            key={app.id}
            className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    {getAppIcon(app.appName)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{app.appName}</h4>
                    <div className="text-[10px] text-slate-400 font-mono truncate max-w-[170px]">
                      {app.packageName}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold shrink-0 ${
                    app.isSystemApp
                      ? 'bg-slate-800 text-slate-400'
                      : 'bg-purple-950 text-purple-300 border border-purple-800/50'
                  }`}
                >
                  {app.isSystemApp ? 'SYSTEM' : 'USER APK'}
                </span>
              </div>

              {/* Specs metadata */}
              <div className="text-[11px] text-slate-400 font-mono space-y-1 mb-3 pt-2 border-t border-slate-800/60">
                <div className="flex justify-between">
                  <span>Version</span>
                  <span className="text-slate-200">{app.versionName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Package Size</span>
                  <span className="text-slate-200">{(app.sizeBytes / 1024 / 1024).toFixed(1)} MB</span>
                </div>
                <div className="flex justify-between">
                  <span>Target SDK</span>
                  <span className="text-slate-200">API {app.targetSdk} (Min: {app.minSdk})</span>
                </div>
              </div>

              {/* Permissions Tags */}
              <div className="mb-4">
                <div className="text-[10px] text-slate-500 font-semibold mb-1">Declared Permissions:</div>
                <div className="flex flex-wrap gap-1">
                  {app.permissions.slice(0, 3).map((perm, idx) => (
                    <span
                      key={idx}
                      className="text-[9px] font-mono bg-slate-950 text-slate-300 px-1.5 py-0.5 rounded border border-slate-800 truncate max-w-[180px]"
                    >
                      {perm.replace('android.permission.', '')}
                    </span>
                  ))}
                  {app.permissions.length > 3 && (
                    <span className="text-[9px] font-mono text-slate-500 self-center">
                      +{app.permissions.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => handleLaunch(app.packageName)}
                disabled={activePackage === app.packageName}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
              >
                <Play className="w-3 h-3" /> Launch
              </button>

              {!app.isSystemApp && (
                <button
                  onClick={() => handleUninstall(app.packageName, app.appName)}
                  title="Uninstall App via ADB"
                  className="p-2 bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 rounded-xl transition-colors border border-slate-700 hover:border-red-800"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
