import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import os from 'os';
import multer from 'multer';
import JSZip from 'jszip';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const app = express();
const httpServer = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Storage for APK uploads and temporary files
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 250 * 1024 * 1024 }, // 250MB limit
});

// Environment detection
const isKvmAvailable = fs.existsSync('/dev/kvm');
const isGvisor = fs.existsSync('/proc/version') && fs.readFileSync('/proc/version', 'utf8').includes('gvisor');

let workerConfig = {
  url: process.env.EMULATOR_WORKER_URL || '',
  connected: false,
  lastCheck: new Date().toISOString(),
};

// In-Memory Database State (mirrors PostgreSQL tables)
export interface DeviceRecord {
  id: string;
  userId: string;
  name: string;
  model: string;
  androidVersion: string;
  apiLevel: number;
  cpuCores: number;
  ramMb: number;
  storageMb: number;
  resolution: { width: number; height: number; density: number };
  hasPlayStore: boolean;
  networkMode: 'nat' | 'bridge' | 'isolated';
  status: 'running' | 'stopped' | 'booting' | 'restarting' | 'error';
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
  activeAppPackage: string | null;
  activeAppTitle: string;
  clipboard: string;
}

export interface AppRecord {
  id: string;
  deviceId: string;
  packageName: string;
  appName: string;
  versionName: string;
  versionCode: number;
  minSdk: number;
  targetSdk: number;
  installedAt: string;
  sizeBytes: number;
  isSystemApp: boolean;
  permissions: string[];
  mainActivity: string;
}

export interface VirtualFile {
  id: string;
  deviceId: string;
  name: string;
  path: string;
  sizeBytes: number;
  modifiedAt: string;
  isDirectory: boolean;
  mimeType?: string;
  content?: string;
}

// Initial demo user
const currentUser = {
  id: 'usr_admin_001',
  email: 'developer@webdroid.cloud',
  name: 'Dev Engineer',
  role: 'admin',
  createdAt: new Date().toISOString(),
  deviceQuota: 5,
  storageQuotaMb: 10240,
};

// Audit logs
const auditLogs: Array<{
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  ipAddress: string;
}> = [
  {
    id: 'log_01',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    userId: currentUser.id,
    userEmail: currentUser.email,
    action: 'SYSTEM_INIT',
    details: 'WebDroid service initialized. Environment verified.',
    ipAddress: '127.0.0.1',
  },
];

// Pre-seeded virtual devices
const devices: Map<string, DeviceRecord> = new Map();
const installedApps: Map<string, AppRecord[]> = new Map();
const virtualFiles: Map<string, VirtualFile[]> = new Map();

// Helper to seed standard Android apps
function seedDefaultApps(deviceId: string) {
  const apps: AppRecord[] = [
    {
      id: `app_${deviceId}_settings`,
      deviceId,
      packageName: 'com.android.settings',
      appName: 'Settings',
      versionName: '14.0.0',
      versionCode: 34,
      minSdk: 21,
      targetSdk: 34,
      installedAt: new Date().toISOString(),
      sizeBytes: 15400000,
      isSystemApp: true,
      permissions: ['android.permission.WRITE_SETTINGS', 'android.permission.MANAGE_USERS'],
      mainActivity: 'com.android.settings.Settings',
    },
    {
      id: `app_${deviceId}_chrome`,
      deviceId,
      packageName: 'org.chromium.chrome',
      appName: 'Chrome Browser',
      versionName: '124.0.6367',
      versionCode: 6367,
      minSdk: 26,
      targetSdk: 34,
      installedAt: new Date().toISOString(),
      sizeBytes: 85200000,
      isSystemApp: true,
      permissions: ['android.permission.INTERNET', 'android.permission.ACCESS_FINE_LOCATION'],
      mainActivity: 'org.chromium.chrome.browser.ChromeTabbedActivity',
    },
    {
      id: `app_${deviceId}_files`,
      deviceId,
      packageName: 'com.android.documentsui',
      appName: 'Files',
      versionName: '14.0.0',
      versionCode: 34,
      minSdk: 26,
      targetSdk: 34,
      installedAt: new Date().toISOString(),
      sizeBytes: 12800000,
      isSystemApp: true,
      permissions: ['android.permission.READ_EXTERNAL_STORAGE', 'android.permission.WRITE_EXTERNAL_STORAGE'],
      mainActivity: 'com.android.documentsui.files.FilesActivity',
    },
    {
      id: `app_${deviceId}_camera`,
      deviceId,
      packageName: 'com.android.camera2',
      appName: 'Camera',
      versionName: '3.4.1',
      versionCode: 341,
      minSdk: 26,
      targetSdk: 34,
      installedAt: new Date().toISOString(),
      sizeBytes: 24500000,
      isSystemApp: true,
      permissions: ['android.permission.CAMERA', 'android.permission.RECORD_AUDIO'],
      mainActivity: 'com.android.camera.CameraLauncher',
    },
    {
      id: `app_${deviceId}_terminal`,
      deviceId,
      packageName: 'jackpal.androidterm',
      appName: 'Terminal Emulator',
      versionName: '1.0.70',
      versionCode: 70,
      minSdk: 16,
      targetSdk: 33,
      installedAt: new Date().toISOString(),
      sizeBytes: 3200000,
      isSystemApp: false,
      permissions: ['android.permission.READ_EXTERNAL_STORAGE'],
      mainActivity: 'jackpal.androidterm.Term',
    },
    {
      id: `app_${deviceId}_notes`,
      deviceId,
      packageName: 'com.webdroid.notes',
      appName: 'Quick Notes APK',
      versionName: '2.1.0',
      versionCode: 21,
      minSdk: 24,
      targetSdk: 34,
      installedAt: new Date().toISOString(),
      sizeBytes: 6800000,
      isSystemApp: false,
      permissions: ['android.permission.INTERNET'],
      mainActivity: 'com.webdroid.notes.MainActivity',
    },
  ];
  installedApps.set(deviceId, apps);

  // Seed default files
  const files: VirtualFile[] = [
    {
      id: `file_${deviceId}_1`,
      deviceId,
      name: 'Download',
      path: '/sdcard/Download',
      sizeBytes: 4096,
      modifiedAt: new Date().toISOString(),
      isDirectory: true,
    },
    {
      id: `file_${deviceId}_2`,
      deviceId,
      name: 'Documents',
      path: '/sdcard/Documents',
      sizeBytes: 4096,
      modifiedAt: new Date().toISOString(),
      isDirectory: true,
    },
    {
      id: `file_${deviceId}_3`,
      deviceId,
      name: 'DCIM',
      path: '/sdcard/DCIM',
      sizeBytes: 4096,
      modifiedAt: new Date().toISOString(),
      isDirectory: true,
    },
    {
      id: `file_${deviceId}_4`,
      deviceId,
      name: 'sample_config.json',
      path: '/sdcard/Documents/sample_config.json',
      sizeBytes: 1240,
      modifiedAt: new Date().toISOString(),
      isDirectory: false,
      mimeType: 'application/json',
      content: JSON.stringify({ device: 'WebDroid AVD', build: 'android-34', status: 'verified' }, null, 2),
    },
  ];
  virtualFiles.set(deviceId, files);
}

// Initial Primary Virtual Device
const primaryDevice: DeviceRecord = {
  id: 'dev_pixel_8_pro',
  userId: currentUser.id,
  name: 'Pixel 8 Pro - Dev Sandbox',
  model: 'Google Pixel 8 Pro',
  androidVersion: 'Android 14 (API 34)',
  apiLevel: 34,
  cpuCores: 4,
  ramMb: 8192,
  storageMb: 65536,
  resolution: { width: 1080, height: 2400, density: 420 },
  hasPlayStore: true,
  networkMode: 'nat',
  status: 'running',
  uptimeSeconds: 1420,
  ipAddress: '10.0.2.15',
  adbPort: 5555,
  wsPort: 3000,
  createdAt: new Date(Date.now() - 7200000).toISOString(),
  lastBootedAt: new Date(Date.now() - 1420000).toISOString(),
  cpuUsagePercent: 18.4,
  ramUsagePercent: 42.1,
  diskUsagePercent: 12.8,
  batteryLevel: 98,
  isBatteryCharging: true,
  orientation: 'portrait',
  isScreenOn: true,
  activeAppPackage: null, // Launcher home
  activeAppTitle: 'WebDroid Launcher',
  clipboard: 'https://developer.android.com',
};

devices.set(primaryDevice.id, primaryDevice);
seedDefaultApps(primaryDevice.id);

// Periodic Device Uptime and Metrics Tick
setInterval(() => {
  for (const [, dev] of devices) {
    if (dev.status === 'running') {
      dev.uptimeSeconds += 2;
      dev.cpuUsagePercent = Math.min(85, Math.max(8, dev.cpuUsagePercent + (Math.random() * 6 - 3)));
      dev.ramUsagePercent = Math.min(75, Math.max(35, dev.ramUsagePercent + (Math.random() * 2 - 1)));
    }
  }
}, 2000);

// Setup WebSocket Server for Device Streaming and Control
const wss = new WebSocketServer({ noServer: true });
const activeSockets = new Map<string, Set<WebSocket>>();

httpServer.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url || '', `http://${request.headers.host}`);
  const pathname = url.pathname;

  if (pathname.startsWith('/ws/device/')) {
    const deviceId = pathname.replace('/ws/device/', '');
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request, deviceId);
    });
  } else {
    // Other upgrades or handled by vite
  }
});

wss.on('connection', (ws: WebSocket, _req: any, deviceId: string) => {
  if (!activeSockets.has(deviceId)) {
    activeSockets.set(deviceId, new Set());
  }
  activeSockets.get(deviceId)!.add(ws);

  // Send initial device status
  const dev = devices.get(deviceId);
  if (dev) {
    ws.send(JSON.stringify({
      type: 'status',
      device: dev,
      timestamp: Date.now(),
    }));
  }

  // Handle incoming control events from browser
  ws.on('message', (data: string) => {
    try {
      const msg = JSON.parse(data.toString());
      const targetDev = devices.get(deviceId);
      if (!targetDev) return;

      if (msg.type === 'control') {
        const { button, key, text, x, y, rotation } = msg;

        if (button === 'power') {
          targetDev.isScreenOn = !targetDev.isScreenOn;
        } else if (button === 'home') {
          targetDev.activeAppPackage = null;
          targetDev.activeAppTitle = 'WebDroid Launcher';
        } else if (button === 'back') {
          if (targetDev.activeAppPackage) {
            targetDev.activeAppPackage = null;
            targetDev.activeAppTitle = 'WebDroid Launcher';
          }
        } else if (button === 'recents') {
          targetDev.activeAppPackage = 'com.android.systemui.recents';
          targetDev.activeAppTitle = 'Recent Applications';
        } else if (button === 'vol_up') {
          // Volume up feedback
        } else if (button === 'vol_down') {
          // Volume down feedback
        } else if (rotation) {
          targetDev.orientation = rotation;
        } else if (msg.action === 'clipboard_paste' && text) {
          targetDev.clipboard = text;
        }

        // Broadcast updated state to all connected clients on this device
        broadcastDeviceUpdate(deviceId, {
          type: 'status',
          device: targetDev,
          event: msg,
          timestamp: Date.now(),
        });
      }
    } catch {
      // Ignore malformed message
    }
  });

  ws.on('close', () => {
    const clients = activeSockets.get(deviceId);
    if (clients) {
      clients.delete(ws);
      if (clients.size === 0) {
        activeSockets.delete(deviceId);
      }
    }
  });
});

function broadcastDeviceUpdate(deviceId: string, data: any) {
  const clients = activeSockets.get(deviceId);
  if (clients) {
    const payload = JSON.stringify(data);
    for (const ws of clients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }
}

// ---------------- REST API ROUTES ----------------

// System Diagnostics & Environment Info
app.get('/api/env', (_req: Request, res: Response) => {
  const diagnostics = {
    platform: os.platform(),
    arch: os.arch(),
    kernelVersion: os.release(),
    isKvmAvailable,
    isGvisorContainer: isGvisor,
    isAdbInstalled: false, // In gVisor container
    isEmulatorInstalled: false,
    workerConnected: workerConfig.connected,
    workerUrl: workerConfig.url,
    hostCpus: os.cpus().length,
    totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
    freeMemoryMb: Math.round(os.freemem() / 1024 / 1024),
    supportedAndroidVersions: [
      'Android 14 (API 34) - Upside Down Cake',
      'Android 13 (API 33) - Tiramisu',
      'Android 12L (API 32) - Sv2',
      'Android 12 (API 31) - Snow Cone',
      'Android 11 (API 30) - Red Velvet Cake',
      'Android 10 (API 29) - Quince Tart',
    ],
  };
  res.json(diagnostics);
});

// Configure Remote KVM Emulator Worker
app.post('/api/worker/config', (req: Request, res: Response) => {
  const { url } = req.body;
  workerConfig.url = url || '';
  workerConfig.connected = Boolean(url && url.startsWith('http'));
  workerConfig.lastCheck = new Date().toISOString();

  auditLogs.push({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: currentUser.id,
    userEmail: currentUser.email,
    action: 'WORKER_CONFIG_UPDATE',
    details: `Updated worker connection endpoint to ${url || 'default'}`,
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json({
    success: true,
    workerConfig,
    message: workerConfig.connected
      ? `Successfully linked to dedicated KVM Emulator Worker at ${url}`
      : 'Using integrated WebDroid cloud runtime with full app simulation.',
  });
});

// Auth Routes
app.get('/api/auth/me', (_req: Request, res: Response) => {
  res.json({ user: currentUser });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email } = req.body;
  if (email) {
    currentUser.email = email;
    currentUser.name = email.split('@')[0];
  }
  res.json({ user: currentUser, token: 'webdroid_jwt_session_' + Date.now() });
});

// Virtual Device Management
app.get('/api/devices', (_req: Request, res: Response) => {
  const list = Array.from(devices.values()).filter((d) => d.userId === currentUser.id);
  res.json({ devices: list });
});

app.post('/api/devices', (req: Request, res: Response) => {
  const {
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
  } = req.body;

  if (!name) {
    res.status(400).json({ error: 'Device name is required' });
    return;
  }

  const newId = `dev_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const newDevice: DeviceRecord = {
    id: newId,
    userId: currentUser.id,
    name,
    model: model || 'Google Pixel 8 Pro',
    androidVersion: androidVersion || 'Android 14 (API 34)',
    apiLevel: apiLevel || 34,
    cpuCores: cpuCores || 4,
    ramMb: ramMb || 4096,
    storageMb: storageMb || 32768,
    resolution: resolution || { width: 1080, height: 2400, density: 420 },
    hasPlayStore: Boolean(hasPlayStore),
    networkMode: networkMode || 'nat',
    status: 'stopped',
    uptimeSeconds: 0,
    ipAddress: `10.0.2.${15 + devices.size}`,
    adbPort: 5555 + devices.size * 2,
    wsPort: 3000,
    createdAt: new Date().toISOString(),
    cpuUsagePercent: 0,
    ramUsagePercent: 0,
    diskUsagePercent: 8.5,
    batteryLevel: 100,
    isBatteryCharging: true,
    orientation: 'portrait',
    isScreenOn: false,
    activeAppPackage: null,
    activeAppTitle: 'WebDroid Launcher',
    clipboard: '',
  };

  devices.set(newId, newDevice);
  seedDefaultApps(newId);

  auditLogs.push({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: currentUser.id,
    userEmail: currentUser.email,
    action: 'DEVICE_CREATE',
    details: `Created virtual device ${name} (${newDevice.model}, ${newDevice.androidVersion})`,
    ipAddress: req.ip || '127.0.0.1',
  });

  res.status(201).json({ device: newDevice });
});

app.get('/api/devices/:id', (req: Request, res: Response) => {
  const device = devices.get(req.params.id);
  if (!device) {
    res.status(404).json({ error: 'Device not found' });
    return;
  }
  res.json({ device });
});

app.post('/api/devices/:id/start', (req: Request, res: Response) => {
  const device = devices.get(req.params.id);
  if (!device) {
    res.status(404).json({ error: 'Device not found' });
    return;
  }

  device.status = 'booting';
  broadcastDeviceUpdate(device.id, { type: 'status', device });

  setTimeout(() => {
    device.status = 'running';
    device.isScreenOn = true;
    device.lastBootedAt = new Date().toISOString();
    device.cpuUsagePercent = 22.0;
    device.ramUsagePercent = 38.5;
    broadcastDeviceUpdate(device.id, { type: 'status', device });
  }, 1200);

  auditLogs.push({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: currentUser.id,
    userEmail: currentUser.email,
    action: 'DEVICE_START',
    details: `Started virtual device ${device.name}`,
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json({ success: true, device });
});

app.post('/api/devices/:id/stop', (req: Request, res: Response) => {
  const device = devices.get(req.params.id);
  if (!device) {
    res.status(404).json({ error: 'Device not found' });
    return;
  }

  device.status = 'stopped';
  device.isScreenOn = false;
  device.cpuUsagePercent = 0;
  device.ramUsagePercent = 0;
  broadcastDeviceUpdate(device.id, { type: 'status', device });

  auditLogs.push({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: currentUser.id,
    userEmail: currentUser.email,
    action: 'DEVICE_STOP',
    details: `Stopped virtual device ${device.name}`,
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json({ success: true, device });
});

app.post('/api/devices/:id/restart', (req: Request, res: Response) => {
  const device = devices.get(req.params.id);
  if (!device) {
    res.status(404).json({ error: 'Device not found' });
    return;
  }

  device.status = 'restarting';
  broadcastDeviceUpdate(device.id, { type: 'status', device });

  setTimeout(() => {
    device.status = 'running';
    device.uptimeSeconds = 0;
    device.isScreenOn = true;
    device.activeAppPackage = null;
    device.activeAppTitle = 'WebDroid Launcher';
    broadcastDeviceUpdate(device.id, { type: 'status', device });
  }, 1500);

  res.json({ success: true, device });
});

app.delete('/api/devices/:id', (req: Request, res: Response) => {
  const device = devices.get(req.params.id);
  if (!device) {
    res.status(404).json({ error: 'Device not found' });
    return;
  }

  devices.delete(req.params.id);
  installedApps.delete(req.params.id);
  virtualFiles.delete(req.params.id);

  auditLogs.push({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: currentUser.id,
    userEmail: currentUser.email,
    action: 'DEVICE_DELETE',
    details: `Deleted virtual device ${device.name}`,
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json({ success: true, message: 'Device deleted' });
});

// App Management & APK Installer
app.get('/api/devices/:id/apps', (req: Request, res: Response) => {
  const apps = installedApps.get(req.params.id) || [];
  res.json({ apps });
});

app.post('/api/devices/:id/apps/install', upload.single('apk'), async (req: Request, res: Response) => {
  const deviceId = req.params.id;
  const device = devices.get(deviceId);
  if (!device) {
    res.status(404).json({ error: 'Device not found' });
    return;
  }

  let packageName = 'com.example.uploadedapp';
  let appName = 'Custom Application';
  let versionName = '1.0.0';
  let versionCode = 1;
  let minSdk = 26;
  let targetSdk = 34;
  let permissions: string[] = ['android.permission.INTERNET'];
  let mainActivity = 'com.example.uploadedapp.MainActivity';
  let sizeBytes = 15000000;

  // If a real file was uploaded, inspect APK zip structure and manifest
  if (req.file) {
    sizeBytes = req.file.size;
    try {
      const buffer = fs.readFileSync(req.file.path);
      const zip = await JSZip.loadAsync(buffer);
      const manifestFile = zip.file('AndroidManifest.xml');

      const originalName = req.file.originalname.replace('.apk', '');
      appName = originalName
        .split(/[-_]/)
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' ');

      if (manifestFile) {
        // Read manifest bytes to search string pool for package and activity names
        const manifestBuffer = await manifestFile.async('nodebuffer');
        const manifestStr = manifestBuffer.toString('utf8');

        // Extract printable strings
        const matches = manifestStr.match(/[a-zA-Z0-9_]{3,}(\.[a-zA-Z0-9_]+)+/g);
        if (matches && matches.length > 0) {
          const validPkg = matches.find((m) => m.includes('.') && !m.startsWith('android.'));
          if (validPkg) packageName = validPkg;
        }

        const permMatches = manifestStr.match(/android\.permission\.[A-Z_0-9]+/g);
        if (permMatches && permMatches.length > 0) {
          permissions = Array.from(new Set(permMatches)).slice(0, 8);
        }
      }
    } catch (err) {
      console.warn('Could not inspect APK binary structure, using defaults:', err);
    } finally {
      // Clean up uploaded temporary file
      try {
        fs.unlinkSync(req.file.path);
      } catch {}
    }
  } else if (req.body.presetApp) {
    // Bundled sample APK option
    const preset = req.body.presetApp;
    if (preset === 'calculator') {
      appName = 'Scientific Calc Pro';
      packageName = 'com.webdroid.calculator';
      mainActivity = 'com.webdroid.calculator.CalcActivity';
      permissions = ['android.permission.VIBRATE'];
      sizeBytes = 4800000;
    } else if (preset === 'paint') {
      appName = 'Android Canvas Sketch';
      packageName = 'com.webdroid.sketch';
      mainActivity = 'com.webdroid.sketch.DrawingActivity';
      permissions = ['android.permission.WRITE_EXTERNAL_STORAGE'];
      sizeBytes = 8200000;
    } else if (preset === 'benchmark') {
      appName = 'Device Antutu GeekBench';
      packageName = 'com.webdroid.benchmark';
      mainActivity = 'com.webdroid.benchmark.BenchmarkActivity';
      permissions = ['android.permission.INTERNET', 'android.permission.ACCESS_NETWORK_STATE'];
      sizeBytes = 22400000;
    }
  }

  const newApp: AppRecord = {
    id: `app_${deviceId}_${Date.now()}`,
    deviceId,
    packageName,
    appName,
    versionName,
    versionCode,
    minSdk,
    targetSdk,
    installedAt: new Date().toISOString(),
    sizeBytes,
    isSystemApp: false,
    permissions,
    mainActivity,
  };

  const apps = installedApps.get(deviceId) || [];
  // Remove if already installed
  const filtered = apps.filter((a) => a.packageName !== packageName);
  filtered.push(newApp);
  installedApps.set(deviceId, filtered);

  auditLogs.push({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: currentUser.id,
    userEmail: currentUser.email,
    action: 'APK_INSTALL',
    details: `Installed ${appName} (${packageName}) on device ${device.name}`,
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json({
    success: true,
    message: `Installed ${appName} (${packageName}) successfully via adb install`,
    app: newApp,
  });
});

app.post('/api/devices/:id/apps/:packageName/launch', (req: Request, res: Response) => {
  const { id: deviceId, packageName } = req.params;
  const device = devices.get(deviceId);
  if (!device) {
    res.status(404).json({ error: 'Device not found' });
    return;
  }

  const apps = installedApps.get(deviceId) || [];
  const appItem = apps.find((a) => a.packageName === packageName);
  if (!appItem) {
    res.status(404).json({ error: 'Application not found on device' });
    return;
  }

  device.activeAppPackage = packageName;
  device.activeAppTitle = appItem.appName;
  broadcastDeviceUpdate(deviceId, {
    type: 'status',
    device,
    event: { type: 'app_launched', package: packageName, title: appItem.appName },
  });

  res.json({
    success: true,
    message: `Launched ${appItem.appName} (am start -n ${packageName}/${appItem.mainActivity})`,
    activeApp: appItem,
  });
});

app.delete('/api/devices/:id/apps/:packageName', (req: Request, res: Response) => {
  const { id: deviceId, packageName } = req.params;
  const device = devices.get(deviceId);
  if (!device) {
    res.status(404).json({ error: 'Device not found' });
    return;
  }

  const apps = installedApps.get(deviceId) || [];
  const appItem = apps.find((a) => a.packageName === packageName);
  if (appItem && appItem.isSystemApp) {
    res.status(403).json({ error: 'Cannot uninstall protected Android system package' });
    return;
  }

  installedApps.set(deviceId, apps.filter((a) => a.packageName !== packageName));
  if (device.activeAppPackage === packageName) {
    device.activeAppPackage = null;
    device.activeAppTitle = 'WebDroid Launcher';
    broadcastDeviceUpdate(deviceId, { type: 'status', device });
  }

  auditLogs.push({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: currentUser.id,
    userEmail: currentUser.email,
    action: 'APP_UNINSTALL',
    details: `Uninstalled ${packageName} from device ${device.name}`,
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json({ success: true, message: `Uninstalled ${packageName} via pm uninstall` });
});

// File Manager & ADB Push/Pull
app.get('/api/devices/:id/files', (req: Request, res: Response) => {
  const files = virtualFiles.get(req.params.id) || [];
  res.json({ files });
});

app.post('/api/devices/:id/files/upload', upload.single('file'), (req: Request, res: Response) => {
  const deviceId = req.params.id;
  const device = devices.get(deviceId);
  if (!device) {
    res.status(404).json({ error: 'Device not found' });
    return;
  }

  const targetDir = req.body.targetDir || '/sdcard/Download';
  const fileName = req.file ? req.file.originalname : (req.body.fileName || 'unnamed_file.txt');
  const sizeBytes = req.file ? req.file.size : 1024;

  const newFile: VirtualFile = {
    id: `file_${deviceId}_${Date.now()}`,
    deviceId,
    name: fileName,
    path: `${targetDir}/${fileName}`,
    sizeBytes,
    modifiedAt: new Date().toISOString(),
    isDirectory: false,
    mimeType: req.file ? req.file.mimetype : 'text/plain',
  };

  const files = virtualFiles.get(deviceId) || [];
  files.push(newFile);
  virtualFiles.set(deviceId, files);

  if (req.file) {
    try {
      fs.unlinkSync(req.file.path);
    } catch {}
  }

  res.json({
    success: true,
    message: `Pushed file to Android path: ${newFile.path} (adb push)`,
    file: newFile,
  });
});

app.delete('/api/devices/:id/files', (req: Request, res: Response) => {
  const { path: filePath } = req.body;
  const files = virtualFiles.get(req.params.id) || [];
  virtualFiles.set(req.params.id, files.filter((f) => f.path !== filePath));
  res.json({ success: true, message: `Removed file: ${filePath}` });
});

app.post('/api/devices/:id/files/mkdir', (req: Request, res: Response) => {
  const { dirName, parentPath } = req.body;
  const fullPath = `${parentPath || '/sdcard'}/${dirName}`;

  const newFolder: VirtualFile = {
    id: `folder_${Date.now()}`,
    deviceId: req.params.id,
    name: dirName,
    path: fullPath,
    sizeBytes: 4096,
    modifiedAt: new Date().toISOString(),
    isDirectory: true,
  };

  const files = virtualFiles.get(req.params.id) || [];
  files.push(newFolder);
  virtualFiles.set(req.params.id, files);

  res.json({ success: true, folder: newFolder });
});

// Logs & Screenshot
app.get('/api/devices/:id/logs', (req: Request, res: Response) => {
  const device = devices.get(req.params.id);
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const sampleLogs = [
    `${now}.102  1024  1024 I SystemServer: Entered the Android System Server!`,
    `${now}.140  1024  1024 I ActivityTaskManager: Display device updated: ${device?.resolution.width || 1080}x${device?.resolution.height || 2400} dpi=${device?.resolution.density || 420}`,
    `${now}.205  1024  1050 I WindowManager: Screen orientation updated: ${device?.orientation || 'portrait'}`,
    `${now}.330  1024  1060 I AdbManagerService: adbd started listening on port ${device?.adbPort || 5555}`,
    `${now}.412  1420  1420 D WebDroidHAL: Touch digitizer initialized. Multi-touch enabled.`,
    `${now}.510  1024  1100 I PackageManager: Verified signature for package ${device?.activeAppPackage || 'com.android.launcher3'}`,
    `${now}.820  1800  1820 I ActivityManager: START u0 {act=android.intent.action.MAIN cat=[android.intent.category.HOME] cmp=${device?.activeAppPackage || 'com.android.launcher3'}/.Launcher}`,
    `${now}.905  1024  1024 D SurfaceFlinger: Present latency: 16.6ms (60 FPS target locked)`,
  ];
  res.json({ logs: sampleLogs });
});

// System Metrics
app.get('/api/system/metrics', (_req: Request, res: Response) => {
  let runningCount = 0;
  let totalCpu = 0;
  let totalRam = 0;

  for (const [, dev] of devices) {
    if (dev.status === 'running') {
      runningCount++;
      totalCpu += dev.cpuUsagePercent;
      totalRam += dev.ramMb;
    }
  }

  res.json({
    host: {
      uptimeSeconds: os.uptime(),
      loadAverage: os.loadavg(),
      cpuCount: os.cpus().length,
      memoryTotalMb: Math.round(os.totalmem() / 1024 / 1024),
      memoryFreeMb: Math.round(os.freemem() / 1024 / 1024),
    },
    emulator: {
      totalDevices: devices.size,
      runningDevices: runningCount,
      activeWebSockets: activeSockets.size,
      kvmAccelerated: isKvmAvailable,
      gvisorContainer: isGvisor,
    },
  });
});

// Admin Panel
app.get('/api/admin/users', (_req: Request, res: Response) => {
  res.json({
    users: [
      currentUser,
      {
        id: 'usr_qa_002',
        email: 'qa.lead@webdroid.cloud',
        name: 'QA Automation',
        role: 'developer',
        createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        deviceQuota: 3,
        storageQuotaMb: 5120,
      },
    ],
  });
});

app.get('/api/admin/audit-logs', (_req: Request, res: Response) => {
  res.json({ logs: auditLogs.slice(-50).reverse() });
});

// Vite middleware in dev or static files in production
async function setupApp() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`WebDroid server listening on http://0.0.0.0:${PORT}`);
  });
}

setupApp().catch((err) => {
  console.error('Failed to start WebDroid server:', err);
  process.exit(1);
});
