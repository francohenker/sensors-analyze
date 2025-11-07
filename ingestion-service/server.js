// ingestion-service/server.js
const { DataApiClient } = require('rqlite-js');
const express = require('express');
const Redis = require('ioredis');
// const Redis = require('redis');

const app = express();
const redis = new Redis({
    host: '127.0.0.1',
    port: 6379
});

// Inicializar cliente de rqlite
const rqliteClient = new DataApiClient('http://localhost:4001');

app.use(express.json());

// Manejo de errores de Redis
redis.on('error', (err) => console.error('❌ Redis error:', err.message));
redis.on('connect', () => console.log('✅ Connected to Redis'));

// Endpoint que consume el script Python
app.post('/api/v1/telemetry', async (req, res) => {
    try {
        console.log('📥 Received telemetry data:', req.body);
        const telemetryData = req.body;

        // 1. Verificar/crear GPU en la tabla gpus
        const gpuId = await ensureGpuExists(telemetryData);
        console.log('✅ GPU ID:', gpuId);

        // 2. Insertar lectura de temperatura
        await insertTemperatureReading(gpuId, telemetryData);
        console.log('✅ Temperature reading inserted');

        // 3. Guardar evento en event_store
        const eventId = await storeEventInRqlite(telemetryData);
        console.log('✅ Event stored:', eventId);

        // 4. Verificar reglas de alerta
        await checkAlertRules(gpuId, telemetryData, eventId);

        // 5. Publicar evento para procesamiento en tiempo real
        await redis.publish('gpu_telemetry', JSON.stringify({
            ...telemetryData,
            gpu_id: gpuId,
            event_id: eventId
        }));
        console.log('✅ Published to Redis');

        res.status(200).json({ 
            status: 'processed',
            gpu_id: gpuId,
            event_id: eventId
        });
    } catch (error) {
        console.error('❌ Error processing telemetry:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para crear/actualizar sesión de minería
app.post('/api/v1/mining-session', async (req, res) => {
    try {
        const sessionData = req.body;
        
        const query = `
            INSERT INTO mining_sessions (
                cryptocurrency, miner_software, algorithm, 
                overclock_preset, session_status
            ) VALUES (?, ?, ?, ?, ?)
        `;

        const params = [
            sessionData.cryptocurrency || 'ETH',
            sessionData.miner_software || 'unknown',
            sessionData.algorithm || 'ethash',
            sessionData.overclock_preset || null,
            'active'
        ];

        const statement = interpolateQuery(query, params);
        await rqliteClient.execute(statement);

        res.status(200).json({ status: 'session_created' });
    } catch (error) {
        console.error('❌ Error creating mining session:', error.message);
        res.status(500).json({ error: error.message });
    }
});

//funciones para transformar query y params en statement literal
function formatSqlValue(value) {
    if (value === null || value === undefined) {
        return 'NULL';
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
        // Los números y booleanos (0/1) se insertan directamente.
        return String(value);
    }
    // Para strings y otros, escapamos comillas simples y las envolvemos
    // en comillas simples para SQLite.
    const escapedValue = String(value).replace(/'/g, "''");
    return `'${escapedValue}'`;
}

function interpolateQuery(query, params) {
    let i = 0;
    const literalQuery = query.replace(/\?/g, () => {
        if (i < params.length) {
            const value = formatSqlValue(params[i]);
            i++;
            return value;
        }
        // Este caso indica que hay más '?' que parámetros, lo que es un error
        return '?';
    });

    if (i !== params.length) {
        console.warn('⚠️ ADVERTENCIA: La cantidad de placeholders no coincide con la cantidad de parámetros.');
    }

    return literalQuery;
}

//guardar evento en rqlite
async function storeEventInRqlite(data) {
    const eventId = generateIdText();
    
    const query = `INSERT INTO event_store (event_id, event_type, aggregate_type, aggregate_id, correlation_id) VALUES (?, ?, ?, ?, ?)`;

    const params = [
        eventId,                         // event_id
        'gpu_telemetry_received',        // event_type
        'gpu',                           // aggregate_type
        data.gpu_uuid,                   // aggregate_id (usar gpu_uuid en lugar de aggregate_id)
        generateIdText()                 // correlation_id
    ];

    try {
        console.log('🎯 Storing event in rqlite');
        const statement = interpolateQuery(query, params);
        await rqliteClient.execute(statement);
        return eventId;
    } catch (error) {
        console.error('❌ Error storing event:', error.message);
        throw error;
    }
}

// Asegurar que la GPU existe en la tabla gpus
async function ensureGpuExists(data) {
    try {
        // Verificar si la GPU ya existe
        const checkQuery = `SELECT id FROM gpus WHERE gpu_uuid = ?`;
        const checkParams = [data.gpu_uuid];
        const checkStatement = interpolateQuery(checkQuery, checkParams);
        
        const existingGpu = await rqliteClient.query(checkStatement);
        
        if (existingGpu && existingGpu.length > 0) {
            return existingGpu[0].id;
        }

        // Si no existe, insertarla
        const insertQuery = `
            INSERT INTO gpus (
                gpu_uuid, rig_name, gpu_index, model, vendor, 
                memory_size_mb, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        const insertParams = [
            data.gpu_uuid,
            data.rig_name || 'unknown',
            data.gpu_index || 0,
            data.model || 'unknown',
            data.vendor || 'unknown',
            data.memory_size_mb || null,
            true
        ];

        const insertStatement = interpolateQuery(insertQuery, insertParams);
        await rqliteClient.execute(insertStatement);

        // Obtener el ID recién insertado
        const getIdStatement = interpolateQuery(checkQuery, checkParams);
        const newGpu = await rqliteClient.query(getIdStatement);
        
        return newGpu.results[0].data.id
    } catch (error) {
        console.error('❌ Error ensuring GPU exists:', error.message);
        throw error;
    }
}

// Insertar lectura de temperatura
async function insertTemperatureReading(gpuId, data) {
    const query = `
        INSERT INTO temperature_readings (
            gpu_id, gpu_temp_celsius, hotspot_temp_celsius, memory_temp_celsius,
            load_percentage, power_draw_watt, fan_speed_percentage, fan_speed_rpm,
            ambient_temp_celsius
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
        gpuId,
        data.gpu_temp_celsius || null,
        data.hotspot_temp_celsius || null,
        data.memory_temp_celsius || null,
        data.load_percentage || null,
        data.power_draw_watt || null,
        data.fan_speed_percentage || null,
        data.fan_speed_rpm || null,
        data.ambient_temp_celsius || null
    ];

    try {
        const statement = interpolateQuery(query, params);
        const result = await rqliteClient.execute(statement);
        console.log('📊 Temperature reading stored');
        return result;
    } catch (error) {
        console.error('❌ Error storing temperature reading:', error.message);
        throw error;
    }
}

// Verificar reglas de alerta y crear alertas si es necesario
async function checkAlertRules(gpuId, data, eventId) {
    const alerts = [];

    // Regla 1: Temperatura GPU alta
    if (data.gpu_temp_celsius && data.gpu_temp_celsius > 80) {
        alerts.push({
            alert_type: 'HIGH_GPU_TEMPERATURE',
            severity: data.gpu_temp_celsius > 85 ? 'CRITICAL' : 'WARNING',
            triggered_value: data.gpu_temp_celsius,
            threshold_value: 80
        });
    }

    // Regla 2: Temperatura hotspot alta
    if (data.hotspot_temp_celsius && data.hotspot_temp_celsius > 90) {
        alerts.push({
            alert_type: 'HIGH_HOTSPOT_TEMPERATURE',
            severity: data.hotspot_temp_celsius > 95 ? 'CRITICAL' : 'WARNING',
            triggered_value: data.hotspot_temp_celsius,
            threshold_value: 90
        });
    }

    // Regla 3: Temperatura memoria alta
    if (data.memory_temp_celsius && data.memory_temp_celsius > 85) {
        alerts.push({
            alert_type: 'HIGH_MEMORY_TEMPERATURE',
            severity: data.memory_temp_celsius > 90 ? 'CRITICAL' : 'WARNING',
            triggered_value: data.memory_temp_celsius,
            threshold_value: 85
        });
    }

    // Regla 4: Consumo de energía alto
    if (data.power_draw_watt && data.power_draw_watt > 300) {
        alerts.push({
            alert_type: 'HIGH_POWER_CONSUMPTION',
            severity: 'WARNING',
            triggered_value: data.power_draw_watt,
            threshold_value: 300
        });
    }
    
    // Regla 5: Carga de GPU sostenida muy alta
    if (data.load_percentage && data.load_percentage > 95) {
        alerts.push({
            alert_type: 'SUSTAINED_HIGH_LOAD',
            severity: 'INFO',
            triggered_value: data.load_percentage,
            threshold_value: 95
        });
    }

    // Regla 6: Ventilador al máximo
    if (data.fan_speed_percentage && data.fan_speed_percentage > 95) {
        alerts.push({
            alert_type: 'FAN_MAX_SPEED',
            severity: 'WARNING',
            triggered_value: data.fan_speed_percentage,
            threshold_value: 95
        });
    }

    // Insertar alertas en la base de datos
    for (const alert of alerts) {
        await insertAlert(gpuId, alert, eventId);
    }

    // Publicar alertas a Redis para procesamiento en tiempo real
    if (alerts.length > 0) {
        await redis.publish('gpu_alerts', JSON.stringify({
            gpu_uuid: data.gpu_uuid,
            gpu_id: gpuId,
            alerts: alerts,
            timestamp: new Date().toISOString()
        }));
        console.log(`🚨 ${alerts.length} alert(s) triggered`);
    }
}

// Insertar alerta en la base de datos
async function insertAlert(gpuId, alert, triggerEventId) {
    const query = `
        INSERT INTO alerts (
            alert_id, gpu_id, alert_type, severity, status,
            triggered_value, threshold_value, trigger_event_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
        generateIdText(),
        gpuId,
        alert.alert_type,
        alert.severity,
        'active',
        alert.triggered_value,
        alert.threshold_value,
        triggerEventId
    ];

    try {
        const statement = interpolateQuery(query, params);
        await rqliteClient.execute(statement);
        console.log(`🚨 Alert created: ${alert.alert_type}`);
    } catch (error) {
        console.error('❌ Error creating alert:', error.message);
        throw error;
    }
}



function generateIdText() {
    return Date.now().toString() + Math.random().toString(36).substring(2, 9);
}


app.listen(5002, () => {
    console.log('✅ Data Ingestion Service running on port 5002');
    console.log('📊 Ready to receive GPU telemetry data');
});