import React, { useState } from 'react';
import {
  Smartphone,
  Play,
  Square,
  RefreshCw,
  Trash2,
  ExternalLink,
  Cpu,
  HardDrive,
  Layers,
  Search,
  Plus
} from 'lucide-react';
import { VirtualDevice } from '../types';
import { api } from '../services/api';

interface DeviceListProps {
  devices: VirtualDevice[];
  onRefresh: () => void;
  onOpenWorkspace: (device: VirtualDevice) => void;
  onOpenCreateModal: () => void;
}

export const DeviceList: React.FC<DeviceListProps> = ({
  devices,
  onRefresh,
  onOpenWorkspace,
  onOpenCreateModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'stopped'>('all');
  const [loadingDeviceId, setLoadingDeviceId] = useState<string | null>(null);

  const filteredDevices = devices.filter((dev) => {
    const matchesSearch =
      dev.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.androidVersion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'running'
        ? dev.status === 'running'
        : dev.status === 'stopped';
    return matchesSearch && matchesStatus;
  });

  const handleStart = async (dev: VirtualDevice) => {
    try {
      setLoadingDeviceId(dev.id);
      await api.startDevice(dev.id);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDeviceId(null);
    }
  };

  const handleStop = async (dev: VirtualDevice) => {
    try {
      setLoadingDeviceId(dev.id);
      await api.stopDevice(dev.id);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDeviceId(null);
    }
  };

  const handleRestart = async (dev: VirtualDevice) => {
    try {
      setLoadingDeviceId(dev.id);
      await api.restartDevice(dev.id);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDeviceId(null);
    }
  };

  const handleDelete = async (dev: VirtualDevice) => {
    if (!confirm(`Are you sure you want to delete "${dev.name}"? This action cannot be undone.`)) return;
    try {
      setLoadingDeviceId(dev.id);
      await api.deleteDevice(dev.id);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDeviceId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Virtual Android Devices</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your provisioned Android virtual machines, inspect hardware specs, and launch instances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status filter tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === 'all' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({devices.length})
            </button>
            <button
              onClick={() => setStatusFilter('running')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === 'running' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Running ({devices.filter((d) => d.status === 'running').length})
            </button>
            <button
              onClick={() => setStatusFilter('stopped')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === 'stopped' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Stopped ({devices.filter((d) => d.status === 'stopped').length})
            </button>
          </div>

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Create
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, model, or Android version..."
          className="w-full bg-slate-900/90 border border-slate-800 pl-9 pr-4 py-2 rounded-xl text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-purple-500 transition-colors"
        />
      </div>

      {/* Devices Grid */}
      {filteredDevices.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl">
          <Smartphone className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-200">No virtual devices found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            No devices matched your query. Create a new device to spin up an Android virtual machine.
          </p>
          <button
            onClick={onOpenCreateModal}
            className="px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-xl hover:bg-purple-500 transition-colors"
          >
            Create New Device
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDevices.map((dev) => {
            const isBusy = loadingDeviceId === dev.id || dev.status === 'booting' || dev.status === 'restarting';
            return (
              <div
                key={dev.id}
                className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-md group"
              >
                <div>
                  {/* Top info row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-100 truncate max-w-[180px]">{dev.name}</h4>
                        <div className="text-[11px] text-slate-400">{dev.model}</div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        dev.status === 'running'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                          : dev.status === 'booting'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800/60 animate-pulse'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {dev.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Hardware specs row */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] py-3 border-y border-slate-800/80 my-3 font-mono">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="truncate">{dev.androidVersion}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Cpu className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>{dev.cpuCores} vCPU · {dev.ramMb / 1024}GB</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <HardDrive className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{dev.storageMb / 1024} GB Disk</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <span className="text-slate-400">Res:</span>
                      <span>{dev.resolution.width}x{dev.resolution.height}</span>
                    </div>
                  </div>

                  {/* Telemetry info when running */}
                  {dev.status === 'running' && (
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-4 font-mono">
                      <span>Uptime: {Math.floor(dev.uptimeSeconds / 60)}m</span>
                      <span>CPU: {dev.cpuUsagePercent.toFixed(0)}%</span>
                      <span>ADB: :{dev.adbPort}</span>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  {dev.status === 'running' ? (
                    <>
                      <button
                        onClick={() => onOpenWorkspace(dev)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Workspace
                      </button>
                      <button
                        onClick={() => handleRestart(dev)}
                        disabled={isBusy}
                        title="Restart Device"
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors border border-slate-700"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isBusy ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleStop(dev)}
                        disabled={isBusy}
                        title="Stop Device"
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-red-400 rounded-xl transition-colors border border-slate-700"
                      >
                        <Square className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleStart(dev)}
                        disabled={isBusy}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-purple-600 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-colors border border-slate-700 hover:border-purple-600"
                      >
                        <Play className="w-3.5 h-3.5" /> {isBusy ? 'Starting...' : 'Boot Device'}
                      </button>
                      <button
                        onClick={() => handleDelete(dev)}
                        disabled={isBusy}
                        title="Delete Device"
                        className="p-2 bg-slate-800 hover:bg-red-950/80 text-slate-400 hover:text-red-400 rounded-xl transition-colors border border-slate-700 hover:border-red-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
