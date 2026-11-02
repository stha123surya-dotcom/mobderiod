export type DeviceStatus = 'running' | 'stopped' | 'booting' | 'restarting' | 'error';

export interface DeviceSpec {
  id: string;
  name: string;
  model: string;
  androidVersion: string;
  apiLevel: number;
  cpuCores: number;
  ramMb: number;
  storageMb: number;
  resolution: {
    width: number;
    height: number;
    density: number; // dpi
  };
  hasPlayStore: boolean;
  networkMode: 'nat' | 'bridge' | 'isolated';
}

export interface VirtualDevice extends DeviceSpec {
  status: DeviceStatus;
  uptimeSeconds: number;
  ipAddress: string;
  adbPort: number;
  wsPort: number;
  createdAt: string;
  lastBootedAt?: string;
  cpuUsagePercent: number;
  ramUsagePercent: number;
  diskUsagePercent: number;
  batteryLevel: number;
  isBatteryCharging: boolean;
  orientation: 'portrait' | 'landscape';
  isScreenOn: boolean;
  activeAppPackage?: string | null;
  activeAppTitle?: string;
  clipboard?: string;
}

export interface InstalledApp {
  id: string;
  deviceId: string;
  packageName: string;
  appName: string;
  versionName: string;
  versionCode: number;
  minSdk: number;
  targetSdk: number;
  iconUrl?: string;
  installedAt: string;
  sizeBytes: number;
  isSystemApp: boolean;
  permissions: string[];
  mainActivity: string;
}

export interface FileItem {
  id: string;
  name: string;
  path: string;
  sizeBytes: number;
  modifiedAt: string;
  isDirectory: boolean;
  mimeType?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'developer';
  createdAt: string;
  deviceQuota: number;
  storageQuotaMb: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  ipAddress: string;
}

export interface EnvironmentDiagnostics {
  platform: string;
  arch: string;
  kernelVersion: string;
  isKvmAvailable: boolean;
  isGvisorContainer: boolean;
  isAdbInstalled: boolean;
  isEmulatorInstalled: boolean;
  workerConnected: boolean;
  workerUrl: string;
  hostCpus: number;
  totalMemoryMb: number;
  freeMemoryMb: number;
  supportedAndroidVersions: string[];
}

export interface DeviceControlEvent {
  type: 'tap' | 'down' | 'move' | 'up' | 'key' | 'button' | 'text' | 'rotate' | 'reboot' | 'clipboard_paste';
  x?: number; // Normalized 0..1 or pixel coordinates
  y?: number;
  key?: string;
  keyCode?: number;
  button?: 'power' | 'vol_up' | 'vol_down' | 'back' | 'home' | 'recents';
  text?: string;
  rotation?: 'portrait' | 'landscape';
}

export interface StreamFrameMessage {
  type: 'frame' | 'status' | 'clipboard' | 'audio';
  data?: string; // base64 jpeg or png
  status?: DeviceStatus;
  clipboardText?: string;
  timestamp: number;
}
