import { VirtualDevice, InstalledApp, FileItem, EnvironmentDiagnostics, User, AuditLog } from '../types';

export const api = {
  async getEnv(): Promise<EnvironmentDiagnostics> {
    const res = await fetch('/api/env');
    if (!res.ok) throw new Error('Failed to fetch environment diagnostics');
    return res.json();
  },

  async updateWorkerConfig(url: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/worker/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) throw new Error('Failed to update worker config');
    return res.json();
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch('/api/auth/me');
    if (!res.ok) throw new Error('Failed to get current user');
    return res.json();
  },

  async login(email: string): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error('Failed to login');
    return res.json();
  },

  async getDevices(): Promise<VirtualDevice[]> {
    const res = await fetch('/api/devices');
    if (!res.ok) throw new Error('Failed to fetch devices');
    const data = await res.json();
    return data.devices;
  },

  async getDevice(id: string): Promise<VirtualDevice> {
    const res = await fetch(`/api/devices/${id}`);
    if (!res.ok) throw new Error('Failed to fetch device');
    const data = await res.json();
    return data.device;
  },

  async createDevice(params: Partial<VirtualDevice>): Promise<VirtualDevice> {
    const res = await fetch('/api/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to create device');
    const data = await res.json();
    return data.device;
  },

  async startDevice(id: string): Promise<VirtualDevice> {
    const res = await fetch(`/api/devices/${id}/start`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to start device');
    const data = await res.json();
    return data.device;
  },

  async stopDevice(id: string): Promise<VirtualDevice> {
    const res = await fetch(`/api/devices/${id}/stop`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to stop device');
    const data = await res.json();
    return data.device;
  },

  async restartDevice(id: string): Promise<VirtualDevice> {
    const res = await fetch(`/api/devices/${id}/restart`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to restart device');
    const data = await res.json();
    return data.device;
  },

  async deleteDevice(id: string): Promise<void> {
    const res = await fetch(`/api/devices/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete device');
  },

  async getApps(deviceId: string): Promise<InstalledApp[]> {
    const res = await fetch(`/api/devices/${deviceId}/apps`);
    if (!res.ok) throw new Error('Failed to fetch apps');
    const data = await res.json();
    return data.apps;
  },

  async installApk(deviceId: string, fileOrPreset: File | string): Promise<{ success: boolean; message: string; app: InstalledApp }> {
    let res: Response;
    if (typeof fileOrPreset === 'string') {
      res = await fetch(`/api/devices/${deviceId}/apps/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetApp: fileOrPreset }),
      });
    } else {
      const formData = new FormData();
      formData.append('apk', fileOrPreset);
      res = await fetch(`/api/devices/${deviceId}/apps/install`, {
        method: 'POST',
        body: formData,
      });
    }
    if (!res.ok) throw new Error('Failed to install APK');
    return res.json();
  },

  async launchApp(deviceId: string, packageName: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/devices/${deviceId}/apps/${packageName}/launch`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to launch application');
    return res.json();
  },

  async uninstallApp(deviceId: string, packageName: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/devices/${deviceId}/apps/${packageName}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to uninstall application');
    return res.json();
  },

  async getFiles(deviceId: string): Promise<FileItem[]> {
    const res = await fetch(`/api/devices/${deviceId}/files`);
    if (!res.ok) throw new Error('Failed to fetch files');
    const data = await res.json();
    return data.files;
  },

  async uploadFile(deviceId: string, file: File, targetDir = '/sdcard/Download'): Promise<{ success: boolean; message: string; file: FileItem }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('targetDir', targetDir);
    const res = await fetch(`/api/devices/${deviceId}/files/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload file');
    return res.json();
  },

  async deleteFile(deviceId: string, filePath: string): Promise<void> {
    const res = await fetch(`/api/devices/${deviceId}/files`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath }),
    });
    if (!res.ok) throw new Error('Failed to delete file');
  },

  async createFolder(deviceId: string, dirName: string, parentPath = '/sdcard'): Promise<FileItem> {
    const res = await fetch(`/api/devices/${deviceId}/files/mkdir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dirName, parentPath }),
    });
    if (!res.ok) throw new Error('Failed to create folder');
    const data = await res.json();
    return data.folder;
  },

  async getLogs(deviceId: string): Promise<string[]> {
    const res = await fetch(`/api/devices/${deviceId}/logs`);
    if (!res.ok) throw new Error('Failed to fetch logs');
    const data = await res.json();
    return data.logs;
  },

  async getSystemMetrics(): Promise<any> {
    const res = await fetch('/api/system/metrics');
    if (!res.ok) throw new Error('Failed to fetch system metrics');
    return res.json();
  },

  async getAdminUsers(): Promise<User[]> {
    const res = await fetch('/api/admin/users');
    if (!res.ok) throw new Error('Failed to fetch users');
    const data = await res.json();
    return data.users;
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch('/api/admin/audit-logs');
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    const data = await res.json();
    return data.logs;
  },
};
