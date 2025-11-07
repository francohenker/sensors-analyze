// query-service/server.js
const WebSocket = require('ws');
const express = require('express');
const axios = require('axios');
const Redis = require('ioredis');
const { DataApiClient } = require('rqlite-js');


const app = express();
// const redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379');
const redis = new Redis({
    host: '127.0.0.1',
    port: 6379
});

// const RQLITE_URL = process.env.RQLITE_URL || 'http://traefik';
const RQLITE_URL = new DataApiClient('http://localhost:4001');

// WebSocket server
const wss = new WebSocket.Server({ port: 8081 });

// Almacenar clientes conectados
const clients = new Set();

// Suscribirse al canal de telemetría de Redis
redis.subscribe('gpu_telemetry', 'gpu_alerts', (err, count) => {
    if (err) {
        console.error('❌ Failed to subscribe to Redis channels:', err);
    } else {
        console.log(`✅ Subscribed to ${count} Redis channel(s)`);
    }
});

// Escuchar mensajes de Redis
redis.on('message', (channel, message) => {
    console.log(`📨 Received message from ${channel}`);
    
    try {
        const data = JSON.parse(message);
        
        // Broadcast a todos los clientes WebSocket conectados
        const payload = {
            type: channel === 'gpu_telemetry' ? 'telemetry_update' : 'alert_notification',
            channel: channel,
            data: data,
            timestamp: new Date().toISOString()
        };
        
        broadcastToClients(JSON.stringify(payload));
    } catch (error) {
        console.error('❌ Error processing Redis message:', error);
    }
});

// WebSocket para datos en tiempo real
wss.on('connection', (ws) => {
    console.log('🔌 Client connected to WebSocket');
    clients.add(ws);
    
    // Enviar mensaje de bienvenida
    ws.send(JSON.stringify({
        type: 'connection_established',
        message: 'Connected to GPU Telemetry Stream',
        timestamp: new Date().toISOString()
    }));
    
    ws.on('close', () => {
        clients.delete(ws);
        console.log('🔌 Client disconnected from WebSocket');
    });
    
    ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        clients.delete(ws);
    });
});

// Función para broadcast a todos los clientes
function broadcastToClients(message) {
    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
    console.log(`📢 Broadcasted to ${clients.size} client(s)`);
}

// HTTP API para consultas históricas
app.get('/api/v1/temperatures/:gpu_uuid', async (req, res) => {
    const { gpu_uuid } = req.params;
    const { hours = 24 } = req.query;
    
    const query = `
        SELECT tr.*, g.gpu_uuid, g.rig_name, g.model
        FROM temperature_readings tr
        JOIN gpus g ON tr.gpu_id = g.id
        WHERE g.gpu_uuid = '${gpu_uuid}'
        ORDER BY tr.timestamp DESC
        LIMIT 100
    `;
    
    try {
        const response = await axios.get(`${RQLITE_URL}/db/query?q=${encodeURIComponent(query)}`);
        res.json(response.data);
    } catch (error) {
        console.error('❌ Error querying temperatures:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para obtener todas las GPUs
app.get('/api/v1/gpus', async (req, res) => {
    const query = 'SELECT * FROM gpus WHERE is_active = 1';
    
    try {
        const response = await axios.get(`${RQLITE_URL}/db/query?q=${encodeURIComponent(query)}`);
        res.json(response.data);
    } catch (error) {
        console.error('❌ Error querying GPUs:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para obtener alertas activas
app.get('/api/v1/alerts', async (req, res) => {
    const query = `
        SELECT a.*, g.gpu_uuid, g.rig_name
        FROM alerts a
        JOIN gpus g ON a.gpu_id = g.id
        WHERE a.status = 'active'
        ORDER BY a.triggered_at DESC
    `;
    
    try {
        const response = await axios.get(`${RQLITE_URL}/db/query?q=${encodeURIComponent(query)}`);
        res.json(response.data);
    } catch (error) {
        console.error('❌ Error querying alerts:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para obtener últimas lecturas
app.get('/api/v1/latest', async (req, res) => {
    const query = `
        SELECT 
            g.gpu_uuid,
            g.rig_name,
            g.model,
            tr.gpu_temp_celsius,
            tr.hotspot_temp_celsius,
            tr.memory_temp_celsius,
            tr.load_percentage,
            tr.power_draw_watt,
            tr.fan_speed_percentage,
            tr.timestamp
        FROM temperature_readings tr
        JOIN gpus g ON tr.gpu_id = g.id
        WHERE tr.id IN (
            SELECT MAX(id) 
            FROM temperature_readings 
            GROUP BY gpu_id
        )
    `;
    
    try {
        const response = await axios.get(`${RQLITE_URL}/db/query?q=${encodeURIComponent(query)}`);
        res.json(response.data);
    } catch (error) {
        console.error('❌ Error querying latest data:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(8082, () => {
    console.log('✅ Query Service HTTP API running on port 8082');
    console.log('✅ WebSocket server running on port 8081');
    console.log('📊 Listening for Redis events...');
});