-- WebDroid Cloud Android Emulator - PostgreSQL Production Schema
-- Designed for High-Throughput Device Orchestration and User Quota Enforcement

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(128) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'user', -- 'admin', 'developer', 'user'
    device_quota INT NOT NULL DEFAULT 3,
    storage_quota_mb INT NOT NULL DEFAULT 10240,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. User Settings
CREATE TABLE IF NOT EXISTS user_settings (
    user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(16) DEFAULT 'dark',
    default_resolution VARCHAR(32) DEFAULT '1080x2400',
    preferred_android_version VARCHAR(32) DEFAULT 'Android 14',
    webrtc_stun_server VARCHAR(255) DEFAULT 'stun:stun.l.google.com:19302',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Virtual Devices Table
CREATE TABLE IF NOT EXISTS devices (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    model VARCHAR(128) NOT NULL,
    android_version VARCHAR(64) NOT NULL,
    api_level INT NOT NULL,
    cpu_cores INT NOT NULL DEFAULT 4,
    ram_mb INT NOT NULL DEFAULT 4096,
    storage_mb INT NOT NULL DEFAULT 32768,
    screen_width INT NOT NULL DEFAULT 1080,
    screen_height INT NOT NULL DEFAULT 2400,
    screen_density INT NOT NULL DEFAULT 420,
    has_play_store BOOLEAN NOT NULL DEFAULT true,
    network_mode VARCHAR(32) NOT NULL DEFAULT 'nat',
    status VARCHAR(32) NOT NULL DEFAULT 'stopped', -- 'running', 'stopped', 'booting', 'restarting', 'error'
    ip_address VARCHAR(45) DEFAULT '10.0.2.15',
    adb_port INT NOT NULL,
    ws_port INT NOT NULL DEFAULT 3000,
    uptime_seconds INT NOT NULL DEFAULT 0,
    last_booted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);

-- 4. Device Sessions
CREATE TABLE IF NOT EXISTS device_sessions (
    id VARCHAR(64) PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip_address VARCHAR(45) NOT NULL,
    client_user_agent TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_device_sessions_device ON device_sessions(device_id);

-- 5. Installed Applications
CREATE TABLE IF NOT EXISTS installed_apps (
    id VARCHAR(64) PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    package_name VARCHAR(255) NOT NULL,
    app_name VARCHAR(128) NOT NULL,
    version_name VARCHAR(64) NOT NULL,
    version_code INT NOT NULL,
    min_sdk INT NOT NULL,
    target_sdk INT NOT NULL,
    is_system_app BOOLEAN NOT NULL DEFAULT false,
    size_bytes BIGINT NOT NULL DEFAULT 0,
    permissions JSONB DEFAULT '[]'::jsonb,
    main_activity VARCHAR(255),
    installed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_device_package UNIQUE(device_id, package_name)
);

CREATE INDEX IF NOT EXISTS idx_installed_apps_pkg ON installed_apps(package_name);

-- 6. Uploaded Files
CREATE TABLE IF NOT EXISTS uploaded_files (
    id VARCHAR(64) PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    target_path VARCHAR(512) NOT NULL,
    size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(128),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_uploaded_files_device ON uploaded_files(device_id);

-- 7. Device Events & Telemetry
CREATE TABLE IF NOT EXISTS device_events (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    event_type VARCHAR(64) NOT NULL, -- 'boot', 'shutdown', 'crash', 'apk_install', 'touch'
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_device_events_time ON device_events(created_at DESC);

-- 8. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255) NOT NULL,
    action VARCHAR(64) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
