-- TABLA VERDADERA HASTA AHORA

CREATE TABLE gpus (id INTEGER PRIMARY KEY AUTOINCREMENT,gpu_uuid TEXT UNIQUE NOT NULL,rig_name TEXT NOT NULL,gpu_index INTEGER NOT NULL,model TEXT NOT NULL,vendor TEXT NOT NULL,memory_size_mb INTEGER,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,is_active BOOLEAN DEFAULT TRUE);

CREATE INDEX idx_gpus_rig_active ON gpus(rig_name, is_active);

CREATE TABLE temperature_readings (id INTEGER PRIMARY KEY AUTOINCREMENT,gpu_id INTEGER NOT NULL,timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,gpu_temp_celsius REAL NOT NULL,hotspot_temp_celsius REAL,memory_temp_celsius REAL,load_percentage REAL,power_draw_watt REAL,fan_speed_percentage REAL,fan_speed_rpm INTEGER,ambient_temp_celsius REAL,FOREIGN KEY (gpu_id) REFERENCES gpus(id));

CREATE INDEX idx_temp_readings_gpu_time ON temperature_readings(gpu_id, timestamp);
CREATE INDEX idx_temp_readings_time ON temperature_readings(timestamp);

CREATE TABLE mining_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT,start_time DATETIME DEFAULT CURRENT_TIMESTAMP,end_time DATETIME,cryptocurrency TEXT NOT NULL,miner_software TEXT,algorithm TEXT,overclock_preset TEXT,average_hashrate REAL,total_energy_kwh REAL,session_status TEXT DEFAULT 'active');

CREATE INDEX idx_mining_sessions_time ON mining_sessions(start_time, end_time);

CREATE TABLE alerts (alert_id TEXT PRIMARY KEY,gpu_id INTEGER NOT NULL,alert_type TEXT NOT NULL,severity TEXT NOT NULL,status TEXT NOT NULL,triggered_value REAL,threshold_value REAL,trigger_event_id TEXT NOT NULL,resolve_event_id TEXT,triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,acknowledged_at DATETIME,resolved_at DATETIME,acknowledged_by TEXT,resolution_notes TEXT,FOREIGN KEY (gpu_id) REFERENCES gpus(id));



CREATE TABLE event_store (event_id TEXT PRIMARY KEY,event_type TEXT NOT NULL,event_version INTEGER DEFAULT 1,aggregate_type TEXT NOT NULL,aggregate_id TEXT NOT NULL,timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,processed INTEGER DEFAULT 0,correlation_id TEXT,causation_id TEXT);
CREATE INDEX idx_event_store_aggregate ON event_store(aggregate_type, aggregate_id);
CREATE INDEX idx_event_store_type_time ON event_store(event_type, timestamp);
CREATE INDEX idx_event_store_processed ON event_store(processed, timestamp);
