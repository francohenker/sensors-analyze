// query-service/server.js
const WebSocket = require('ws');
const express = require('express');
const axios = require('axios');
const Redis = require('ioredis');
const { DataApiClient } = require('rqlite-js');
const cors = require('cors');


const app = express();

// Configurar CORS para permitir peticiones desde el frontend
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));

app.use(express.json());

const redis = new Redis({
    host: process.env.REDIS_URL || 'redis://redis',
    port: 6379
});

const RQLITE_URL = process.env.RQLITE_URL || 'http://traefik';
// const RQLITE_URL = new DataApiClient('http://localhost:4001');

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


// Endpoint para calcular métricas de salud
app.get('/api/v1/health-metrics/:gpu_uuid', async (req, res) => {
    const { gpu_uuid } = req.params;
    
    try {
        // 1. Obtener datos históricos (últimas 24h)
        const historyQuery = `
            SELECT 
                AVG(gpu_temp_celsius) as avg_temp,
                MAX(gpu_temp_celsius) as max_temp,
                AVG(power_draw_watt) as avg_power,
                AVG(load_percentage) as avg_load,
                COUNT(*) as reading_count
            FROM temperature_readings tr
            JOIN gpus g ON tr.gpu_id = g.id
            WHERE g.gpu_uuid = '${gpu_uuid}'
            AND tr.timestamp > datetime('now', '-24 hours')
        `;
        
        const historyResponse = await axios.get(`${RQLITE_URL}/db/query?q=${encodeURIComponent(historyQuery)}`);
        const metrics = historyResponse.data.results[0].values[0];
        
        // 2. Obtener alertas recientes
        const alertsQuery = `
            SELECT COUNT(*) as alert_count, severity
            FROM alerts a
            JOIN gpus g ON a.gpu_id = g.id
            WHERE g.gpu_uuid = '${gpu_uuid}'
            AND a.triggered_at > datetime('now', '-24 hours')
            GROUP BY severity
        `;
        
        const alertsResponse = await axios.get(`${RQLITE_URL}/db/query?q=${encodeURIComponent(alertsQuery)}`);
        
        // 3. Calcular health score (0-100)
        const healthScore = calculateHealthScore(metrics, alertsResponse.data);
        
        res.json({
            gpu_uuid,
            metrics: {
                avg_temp: metrics[0],
                max_temp: metrics[1],
                avg_power: metrics[2],
                avg_load: metrics[3],
                readings: metrics[4]
            },
            health_score: healthScore,
            status: healthScore > 80 ? 'healthy' : healthScore > 60 ? 'warning' : 'critical'
        });
    } catch (error) {
        console.error('❌ Error calculating health metrics:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para obtener recomendaciones
app.get('/api/v1/recommendations/:gpu_uuid', async (req, res) => {
    const { gpu_uuid } = req.params;
    
    try {
        const recommendations = [];
        
        // 1. Obtener GPU info y métricas
        const gpuQuery = `
            SELECT 
                g.*,
                tr.gpu_temp_celsius,
                tr.hotspot_temp_celsius,
                tr.memory_temp_celsius,
                tr.power_draw_watt,
                tr.fan_speed_percentage,
                julianday('now') - julianday(g.created_at) as age_days
            FROM gpus g
            LEFT JOIN temperature_readings tr ON g.id = tr.gpu_id
            WHERE g.gpu_uuid = '${gpu_uuid}'
            ORDER BY tr.timestamp DESC
            LIMIT 1
        `;
        
        const gpuResponse = await axios.get(`${RQLITE_URL}/db/query?q=${encodeURIComponent(gpuQuery)}`);
        
        // Verificar si hay datos
        if (!gpuResponse.data.results || !gpuResponse.data.results[0] || !gpuResponse.data.results[0].values || gpuResponse.data.results[0].values.length === 0) {
            return res.json({
                gpu_uuid,
                recommendations_count: 0,
                recommendations: [],
                message: 'No data available for this GPU'
            });
        }
        
        const gpuData = gpuResponse.data.results[0].values[0];
        
        // Debug: Log para ver qué datos tenemos
        // Índices: g.* (0-8: id, gpu_uuid, rig_name, gpu_index, model, vendor, memory_size_mb, created_at, is_active)
        // Luego: gpu_temp_celsius(9), hotspot_temp_celsius(10), memory_temp_celsius(11), power_draw_watt(12), fan_speed_percentage(13), age_days(14)
        console.log('🔍 GPU Data for recommendations:', {
            gpu_uuid,
            data_length: gpuData.length,
            model: gpuData[4],
            rig: gpuData[2],
            gpu_temp: gpuData[9],
            hotspot_temp: gpuData[10],
            memory_temp: gpuData[11],
            power_draw: gpuData[12],
            fan_speed: gpuData[13],
            age_days: gpuData[14]
        });
        
        // Verificar que tenemos datos de temperatura
        if (!gpuData || gpuData.length < 15) {
            return res.json({
                gpu_uuid,
                recommendations_count: 0,
                recommendations: [],
                message: 'Insufficient data for recommendations'
            });
        }
        
        // 2. Regla: Temperatura alta sostenida
        if (gpuData[9] && gpuData[9] > 80) { // gpu_temp_celsius (índice 9)
            recommendations.push({
                type: 'performance_optimization',
                action: 'reduce_core_clock',
                severity: gpuData[9] > 85 ? 'critical' : 'high',
                reason: `Temperatura GPU ${gpuData[9].toFixed(1)}°C supera umbral de 80°C`,
                details: {
                    current_temp: gpuData[9],
                    threshold: 80,
                    suggested_reduction: '10-15%'
                },
                expected_impact: {
                    temp_reduction: -5,
                    hashrate_loss: -10,
                    power_savings: 20
                }
            });
        }
        
        // 3. Regla: Hotspot crítico
        if (gpuData[10] && gpuData[10] > 95) { // hotspot_temp_celsius (índice 10)
            recommendations.push({
                type: 'thermal_management',
                action: 'improve_cooling',
                severity: 'critical',
                reason: `Hotspot ${gpuData[10].toFixed(1)}°C indica problema de refrigeración`,
                details: {
                    current_hotspot: gpuData[10],
                    threshold: 95
                },
                actions: [
                    'Verificar pasta térmica',
                    'Limpiar disipador',
                    'Mejorar flujo de aire del case'
                ]
            });
        }
        
        // 4. Regla: Ventilador al máximo
        if (gpuData[13] && gpuData[9] && gpuData[13] > 90 && gpuData[9] > 75) { // fan_speed_percentage (índice 13) y temp
            recommendations.push({
                type: 'maintenance',
                action: 'clean_fans',
                severity: 'medium',
                reason: 'Ventiladores al máximo pero temperatura sigue alta',
                details: {
                    fan_speed: gpuData[13],
                    gpu_temp: gpuData[9]
                }
            });
        }
        
        // 5. Regla: GPU antigua con degradación
        const ageDays = gpuData[14] || 0; // age_days (índice 14)
        if (ageDays && ageDays > 540) { // > 18 meses
            const thermalDegradation = await calculateThermalDegradation(gpu_uuid);
            
            if (thermalDegradation > 15) {
                recommendations.push({
                    type: 'replacement',
                    action: 'consider_replacement',
                    severity: 'low',
                    reason: `GPU con ${(ageDays/30).toFixed(0)} meses y degradación térmica ${thermalDegradation.toFixed(1)}%`,
                    details: {
                        age_months: (ageDays/30).toFixed(0),
                        thermal_degradation: thermalDegradation,
                        estimated_roi: '6-8 meses con modelo más eficiente'
                    },
                    financial_analysis: {
                        current_power_cost_monthly: 120,
                        new_card_power_cost_monthly: 90,
                        savings_monthly: 30,
                        new_card_price: 800,
                        payback_months: 8
                    }
                });
            }
        }
        
        // 6. Regla: Consumo alto vs rendimiento
        if (gpuData[12] && gpuData[12] > 300) { // power_draw_watt (índice 12)
            recommendations.push({
                type: 'efficiency',
                action: 'optimize_power_limit',
                severity: 'medium',
                reason: 'Alto consumo eléctrico - posible optimización',
                details: {
                    current_power: gpuData[12],
                    suggested_power_limit: 250,
                    estimated_hashrate_loss: '5%',
                    monthly_savings: 25
                }
            });
        }
        
        res.json({
            gpu_uuid,
            gpu_info: {
                model: gpuData[4] || 'Unknown',
                rig: gpuData[2] || 'Unknown',
                age_days: ageDays
            },
            recommendations_count: recommendations.length,
            recommendations: recommendations.sort((a, b) => {
                const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                return severityOrder[a.severity] - severityOrder[b.severity];
            })
        });
    } catch (error) {
        console.error('❌ Error generating recommendations:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

// Función auxiliar: Calcular degradación térmica
async function calculateThermalDegradation(gpu_uuid) {
    try {
        // Comparar temperatura promedio actual vs primeros 30 días
        const query = `
            WITH first_month AS (
                SELECT AVG(gpu_temp_celsius) as baseline_temp
                FROM temperature_readings tr
                JOIN gpus g ON tr.gpu_id = g.id
                WHERE g.gpu_uuid = '${gpu_uuid}'
                AND tr.timestamp < datetime(g.created_at, '+30 days')
            ),
            recent_month AS (
                SELECT AVG(gpu_temp_celsius) as current_temp
                FROM temperature_readings tr
                JOIN gpus g ON tr.gpu_id = g.id
                WHERE g.gpu_uuid = '${gpu_uuid}'
                AND tr.timestamp > datetime('now', '-30 days')
            )
            SELECT 
                ((recent_month.current_temp - first_month.baseline_temp) / first_month.baseline_temp) * 100 as degradation
            FROM first_month, recent_month
        `;
        
        const response = await axios.get(`${RQLITE_URL}/db/query?q=${encodeURIComponent(query)}`);
        return response.data.results[0].values[0][0] || 0;
    } catch (error) {
        console.error('Error calculating thermal degradation:', error);
        return 0;
    }
}

// Función auxiliar: Calcular health score
function calculateHealthScore(metrics, alertsData) {
    let score = 100;
    
    // Penalizar por temperatura promedio alta
    if (metrics[0] > 80) score -= 20;
    else if (metrics[0] > 75) score -= 10;
    else if (metrics[0] > 70) score -= 5;
    
    // Penalizar por temperatura máxima
    if (metrics[1] > 90) score -= 15;
    else if (metrics[1] > 85) score -= 10;
    
    // Penalizar por alertas
    if (alertsData.results && alertsData.results[0]) {
        const alerts = alertsData.results[0].values;
        alerts.forEach(alert => {
            if (alert[1] === 'CRITICAL') score -= 10;
            else if (alert[1] === 'WARNING') score -= 5;
        });
    }
    
    return Math.max(0, Math.min(100, score));
}

// Endpoint para análisis de flota completa
app.get('/api/v1/fleet-analysis', async (req, res) => {
    try {
        const query = `
            SELECT 
                COUNT(DISTINCT g.id) as total_gpus,
                AVG(tr.gpu_temp_celsius) as avg_fleet_temp,
                SUM(tr.power_draw_watt) as total_power_draw,
                COUNT(CASE WHEN a.severity = 'CRITICAL' THEN 1 END) as critical_alerts,
                COUNT(CASE WHEN a.severity = 'WARNING' THEN 1 END) as warning_alerts
            FROM gpus g
            LEFT JOIN temperature_readings tr ON g.id = tr.gpu_id
            LEFT JOIN alerts a ON g.id = a.gpu_id AND a.status = 'active'
            WHERE g.is_active = 1
            AND tr.id IN (SELECT MAX(id) FROM temperature_readings GROUP BY gpu_id)
        `;
        
        const response = await axios.get(`${RQLITE_URL}/db/query?q=${encodeURIComponent(query)}`);
        const data = response.data.results[0].values[0];
        
        res.json({
            fleet_metrics: {
                total_gpus: data[0],
                avg_temp: data[1],
                total_power_kw: (data[2] / 1000).toFixed(2),
                critical_alerts: data[3],
                warning_alerts: data[4]
            },
            status: data[3] > 0 ? 'critical' : data[4] > 3 ? 'warning' : 'healthy'
        });
    } catch (error) {
        console.error('❌ Error in fleet analysis:', error.message);
        res.status(500).json({ error: error.message });
    }
});



app.listen(8082, () => {
    console.log('✅ Query Service HTTP API running on port 8082');
    console.log('✅ WebSocket server running on port 8081');
    console.log('📊 Listening for Redis events...');
});