/**
 * WebDroid Dedicated Android Emulator Worker Server
 * Orchestrates QEMU / KVM Android Emulator processes and handles WebRTC/WebSocket video streams.
 */

import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';

const PORT = 5555;
const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());

let emulatorProcess: ChildProcess | null = null;
let isBooted = false;

// Health Check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    kvmSupported: fs.existsSync('/dev/kvm'),
    emulatorRunning: emulatorProcess !== null,
    isBooted,
  });
});

// Start Emulator
app.post('/avd/start', (req, res) => {
  if (emulatorProcess) {
    res.json({ status: 'already_running', isBooted });
    return;
  }

  const avdName = req.body.avdName || 'WebDroid_AVD_34';
  const ram = req.body.ram || '4096';
  const cores = req.body.cores || '4';

  console.log(`Starting Android emulator AVD: ${avdName} with KVM acceleration`);

  const args = [
    '-avd', avdName,
    '-no-window',
    '-gpu', 'swiftshader_indirect',
    '-accel', 'on',
    '-memory', ram,
    '-cores', cores,
    '-no-audio',
    '-no-boot-anim',
  ];

  emulatorProcess = spawn('emulator', args);

  emulatorProcess.stdout?.on('data', (data) => {
    const text = data.toString();
    console.log(`[emulator] ${text}`);
    if (text.includes('boot completed') || text.includes('Boot completed')) {
      isBooted = true;
    }
  });

  emulatorProcess.stderr?.on('data', (data) => {
    console.error(`[emulator-err] ${data.toString()}`);
  });

  emulatorProcess.on('exit', (code) => {
    console.log(`Emulator process exited with code ${code}`);
    emulatorProcess = null;
    isBooted = false;
  });

  res.json({ status: 'booting', avd: avdName });
});

// Stop Emulator
app.post('/avd/stop', (_req, res) => {
  if (!emulatorProcess) {
    res.json({ status: 'not_running' });
    return;
  }
  spawn('adb', ['emu', 'kill']);
  emulatorProcess.kill();
  emulatorProcess = null;
  isBooted = false;
  res.json({ status: 'stopped' });
});

// WebSocket frame streamer
wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'worker_connected', isBooted }));
  ws.on('message', (msg) => {
    // Forward touch / input events to ADB
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`WebDroid Emulator Worker listening on port ${PORT}`);
});
