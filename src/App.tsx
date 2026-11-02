import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { DeviceList } from './components/DeviceList';
import { DeviceWorkspace } from './components/DeviceWorkspace';
import { ApkInstaller } from './components/ApkInstaller';
import { AppLibrary } from './components/AppLibrary';
import { FileManager } from './components/FileManager';
import { SystemMetrics } from './components/SystemMetrics';
import { WorkerSetupModal } from './components/WorkerSetupModal';
import { AdminPanel } from './components/AdminPanel';
import { HelpDocs } from './components/HelpDocs';
import { DeviceWizardModal } from './components/DeviceWizardModal';
import { VirtualDevice, EnvironmentDiagnostics, User, InstalledApp } from './types';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [devices, setDevices] = useState<VirtualDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<VirtualDevice | null>(null);
  const [envInfo, setEnvInfo] = useState<EnvironmentDiagnostics | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initialLoad();
  }, []);

  const initialLoad = async () => {
    try {
      setLoading(true);
      const [env, userRes, deviceList] = await Promise.all([
        api.getEnv().catch(() => null),
        api.getMe().catch(() => null),
        api.getDevices().catch(() => []),
      ]);
      setEnvInfo(env);
      if (userRes) setCurrentUser(userRes.user);
      setDevices(deviceList);
      if (deviceList.length > 0) {
        // Prefer running device
        const running = deviceList.find((d: VirtualDevice) => d.status === 'running');
        setSelectedDevice(running || deviceList[0]);
      }
    } catch (err) {
      console.error('Initial load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshDevices = async () => {
    try {
      const list = await api.getDevices();
      setDevices(list);
      if (selectedDevice) {
        const updated = list.find((d) => d.id === selectedDevice.id);
        if (updated) setSelectedDevice(updated);
      } else if (list.length > 0) {
        setSelectedDevice(list[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const refreshEnv = async () => {
    try {
      const env = await api.getEnv();
      setEnvInfo(env);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeviceCreated = () => {
    refreshDevices();
    setActiveTab('devices');
  };

  const handleAppInstalled = (_app: InstalledApp) => {
    refreshDevices();
  };

  const runningCount = devices.filter((d) => d.status === 'running').length;

  return (
    <div className="flex h-screen bg-[#090d16] text-slate-100 font-sans antialiased overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        runningCount={runningCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <Header
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          currentUser={currentUser}
        />

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-xs font-mono text-slate-400 animate-pulse">
                Initializing WebDroid cloud runtime...
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardOverview
                  devices={devices}
                  currentDevice={selectedDevice}
                  envInfo={envInfo}
                  currentUser={currentUser}
                  onSelectTab={setActiveTab}
                  onOpenCreateModal={() => setIsCreateModalOpen(true)}
                  onSelectDevice={setSelectedDevice}
                />
              )}

              {activeTab === 'devices' && (
                <DeviceList
                  devices={devices}
                  onRefresh={refreshDevices}
                  onOpenWorkspace={(dev) => {
                    setSelectedDevice(dev);
                    setActiveTab('workspace');
                  }}
                  onOpenCreateModal={() => setIsCreateModalOpen(true)}
                />
              )}

              {activeTab === 'workspace' && (
                <DeviceWorkspace
                  device={selectedDevice}
                  onRefreshDevice={refreshDevices}
                  onOpenApkInstaller={() => setActiveTab('apk_installer')}
                  onOpenFileBrowse={() => setActiveTab('files')}
                />
              )}

              {activeTab === 'apk_installer' && (
                <ApkInstaller
                  devices={devices}
                  selectedDevice={selectedDevice}
                  onSelectDevice={setSelectedDevice}
                  onAppInstalled={handleAppInstalled}
                  onOpenWorkspace={() => setActiveTab('workspace')}
                />
              )}

              {activeTab === 'apps' && (
                <AppLibrary
                  devices={devices}
                  selectedDevice={selectedDevice}
                  onSelectDevice={setSelectedDevice}
                  onOpenWorkspace={() => setActiveTab('workspace')}
                />
              )}

              {activeTab === 'files' && (
                <FileManager
                  devices={devices}
                  selectedDevice={selectedDevice}
                  onSelectDevice={setSelectedDevice}
                />
              )}

              {activeTab === 'metrics' && (
                <SystemMetrics
                  envInfo={envInfo}
                  onRefresh={refreshEnv}
                />
              )}

              {activeTab === 'worker' && (
                <WorkerSetupModal
                  envInfo={envInfo}
                  onRefreshEnv={refreshEnv}
                />
              )}

              {activeTab === 'admin' && (
                <AdminPanel />
              )}

              {activeTab === 'docs' && (
                <HelpDocs />
              )}
            </>
          )}
        </main>
      </div>

      {/* Device Provisioning Wizard Modal */}
      <DeviceWizardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onDeviceCreated={handleDeviceCreated}
      />
    </div>
  );
}
