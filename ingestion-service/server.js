// ingestion-service/server.js
const express = require('express');
const axios = require('axios');
const Redis = require('ioredis');

const app = express();
const redis = new Redis(process.env.REDIS_URL);
const RQLITE_URL = process.env.RQLITE_URL;

app.use(express.json());

// Endpoint que consume el script Python
app.post('/api/v1/telemetry', async (req, res) => {
    try {
        const telemetryData = req.body;
        
        // 1. Almacenar en rqlite (event store)
        await storeInRqlite(telemetryData);
        
        // 2. Publicar evento para procesamiento en tiempo real
        await redis.publish('gpu_telemetry', JSON.stringify(telemetryData));
        
        // 3. Verificar reglas de alerta
        await checkAlertRules(telemetryData);
        
        res.status(200).json({ status: 'processed' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

async function storeInRqlite(data) {
    const query = `
        INSERT INTO event_store (
            event_id, event_type, aggregate_type, aggregate_id, 
            payload, metadata, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const event = {
        event_id: generateId(),
        event_type: 'gpu_telemetry_received',
        aggregate_type: 'gpu',
        aggregate_id: data.gpu_uuid,
        payload: JSON.stringify(data),
        metadata: JSON.stringify({ source: 'python_script', version: '1.0' }),
        timestamp: new Date().toISOString()
    };
    
    await axios.post(`${RQLITE_URL}/db/execute`, {
        queries: [
            {
                sql: query,
                params: Object.values(event)
            }
        ]
    });
}

async function checkAlertRules(telemetryData) {
    // Implementación básica - puedes expandir esto
    if (telemetryData.temperature > 80) {
        await redis.publish('gpu_alerts', JSON.stringify({
            type: 'HIGH_TEMPERATURE',
            gpu_uuid: telemetryData.gpu_uuid,
            temperature: telemetryData.temperature,
            timestamp: new Date().toISOString()
        }));
    }
}

function generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}


app.listen(5002, () => {
    console.log('Data Ingestion Service running on port 5002');
});