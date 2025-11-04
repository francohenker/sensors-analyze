// query-service/server.js
const WebSocket = require('ws');
const express = require('express');
const axios = require('axios');

const app = express();
const wss = new WebSocket.Server({ port: 8081 });

// WebSocket para datos en tiempo real
wss.on('connection', (ws) => {
    console.log('Client connected');
    
    // Enviar datos cada 5 segundos a clientes conectados
    const interval = setInterval(async () => {
        try {
            const latestData = await getLatestTemperatures();
            ws.send(JSON.stringify({
                type: 'telemetry_update',
                data: latestData
            }));
        } catch (error) {
            console.error('Error sending data:', error);
        }
    }, 5000);
    
    ws.on('close', () => {
        clearInterval(interval);
        console.log('Client disconnected');
    });
});

// HTTP API para consultas históricas
app.get('/api/v1/temperatures/:gpu_uuid', async (req, res) => {
    const { gpu_uuid } = req.params;
    const { hours = 24 } = req.query;
    
    const query = `
        SELECT * FROM temperature_readings 
        WHERE gpu_uuid = ? AND timestamp >= datetime('now', '-? hours')
        ORDER BY timestamp DESC
    `;
    
    try {
        const response = await axios.post(`${process.env.RQLITE_URL}/db/query`, {
            queries: [{ sql: query, params: [gpu_uuid, hours] }]
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});