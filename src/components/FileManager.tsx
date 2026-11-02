import React, { useState, useEffect } from 'react';
import {
  Folder,
  FileText,
  Upload,
  Download,
  Trash2,
  Plus,
  Smartphone,
  HardDrive,
  RefreshCw,
  FolderPlus,
  CheckCircle2
} from 'lucide-react';
import { VirtualDevice, FileItem } from '../types';
import { api } from '../services/api';

interface FileManagerProps {
  devices: VirtualDevice[];
  selectedDevice: VirtualDevice | null;
  onSelectDevice: (device: VirtualDevice) => void;
}

export const FileManager: React.FC<FileManagerProps> = ({
  devices,
  selectedDevice,
  onSelectDevice,
}) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState('/sdcard');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (selectedDevice) {
      loadFiles();
    }
  }, [selectedDevice?.id]);

  const loadFiles = async () => {
    if (!selectedDevice) return;
    try {
      setLoading(true);
      const list = await api.getFiles(selectedDevice.id);
      setFiles(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedDevice || !e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    try {
      setUploading(true);
      setStatusMsg(`Pushing ${file.name} to ${currentPath} via ADB...`);
      const res = await api.uploadFile(selectedDevice.id, file, currentPath);
      setStatusMsg(`Successfully pushed ${res.file.name}!`);
      setTimeout(() => setStatusMsg(null), 3000);
      loadFiles();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (item: FileItem) => {
    if (!selectedDevice) return;
    if (!confirm(`Delete ${item.name}?`)) return;
    try {
      await api.deleteFile(selectedDevice.id, item.path);
      loadFiles();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice || !newFolderName.trim()) return;
    try {
      await api.createFolder(selectedDevice.id, newFolderName.trim(), currentPath);
      setNewFolderName('');
      setShowFolderModal(false);
      loadFiles();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = (item: FileItem) => {
    // Generate text/binary blob download representing pulled file
    const content = `WebDroid Virtual File: ${item.name}\nPath: ${item.path}\nSize: ${item.sizeBytes} bytes\nSynced via adb pull`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.name;
    a.click();
  };

  const totalBytes = files.reduce((acc, f) => acc + f.sizeBytes, 0);

  return (
    <div className="space-y-6 text-left">
      {/* Title & Device Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Android File Manager</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Transfer assets, documents, and media between your desktop browser and the Android virtual filesystem.
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

      {statusMsg && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Storage & Controls Bar */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-purple-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200 font-mono">Current Path: {currentPath}</div>
            <div className="text-[11px] text-slate-400 font-mono">
              {files.length} items · {(totalBytes / 1024).toFixed(1)} KB stored in /sdcard
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFolderModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors border border-slate-700"
          >
            <FolderPlus className="w-3.5 h-3.5" /> New Folder
          </button>

          <label className="cursor-pointer flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md">
            <Upload className="w-3.5 h-3.5" />
            <span>Push File (adb)</span>
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* File List Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold">
            <tr>
              <th className="px-5 py-3">File Name</th>
              <th className="px-5 py-3">Path</th>
              <th className="px-5 py-3">Size</th>
              <th className="px-5 py-3">Modified</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {files.map((file) => (
              <tr key={file.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-5 py-3 text-slate-200 font-sans font-medium flex items-center gap-2.5">
                  {file.isDirectory ? (
                    <Folder className="w-4 h-4 text-purple-400 shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span className="truncate max-w-xs">{file.name}</span>
                </td>
                <td className="px-5 py-3 text-slate-400 text-[11px] truncate max-w-xs">{file.path}</td>
                <td className="px-5 py-3 text-slate-300 tabular-nums">
                  {file.isDirectory ? '—' : `${(file.sizeBytes / 1024).toFixed(1)} KB`}
                </td>
                <td className="px-5 py-3 text-slate-400 text-[11px]">
                  {file.modifiedAt.replace('T', ' ').substring(0, 16)}
                </td>
                <td className="px-5 py-3 text-right space-x-2">
                  {!file.isDirectory && (
                    <button
                      onClick={() => handleDownload(file)}
                      title="Pull File (adb pull)"
                      className="p-1.5 text-slate-400 hover:text-purple-400 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteFile(file)}
                    title="Delete File"
                    className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-bold text-slate-100 mb-3">Create New Folder</h3>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Folder Name</label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. MediaAssets"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
