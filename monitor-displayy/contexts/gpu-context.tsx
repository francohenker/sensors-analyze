"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useWebSocket } from "./websocket-context"

export interface GPUMetrics {
    gpu_temp: number
    hotspot_temp: number
    memory_temp: number
    load_percentage: number
    power_draw: number
    fan_speed: number
    efficiency: number
}

export interface Recommendation {
    type: string
    action: string
    reason: string
    priority: "high" | "medium" | "low"
    expected_impact?: {
        temp_reduction?: number
        hashrate_loss?: number
        power_savings?: number
    }
}

export interface GPUData {
    gpu_uuid: string
    rig_name: string
    model: string
    status: "healthy" | "warning" | "critical"
    current_metrics: GPUMetrics
    health_score: number
    uptime_hours: number
    age_days: number
    recommendations?: Recommendation[]
}

interface GPUContextType {
    gpus: GPUData[]
    updateGPU: (gpuUUID: string, data: Partial<GPUData>) => void
    getGPUByUUID: (gpuUUID: string) => GPUData | undefined
    isLoading: boolean
}

const GPUContext = createContext<GPUContextType | undefined>(undefined)

export function GPUProvider({ children }: { children: React.ReactNode }) {
    const [gpus, setGPUs] = useState<GPUData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { latestTelemetry, isConnected } = useWebSocket()

    // Calcular el status basado en métricas
    const calculateStatus = useCallback((metrics: GPUMetrics): "healthy" | "warning" | "critical" => {
        if (metrics.gpu_temp > 85 || metrics.hotspot_temp > 95 || metrics.fan_speed > 95) {
            return "critical"
        }
        if (metrics.gpu_temp > 80 || metrics.hotspot_temp > 88 || metrics.fan_speed > 90) {
            return "warning"
        }
        return "healthy"
    }, [])

    // Calcular health score basado en métricas
    const calculateHealthScore = useCallback((metrics: GPUMetrics): number => {
        let score = 100

        // Penalizar por temperatura
        if (metrics.gpu_temp > 85) score -= 20
        else if (metrics.gpu_temp > 80) score -= 10
        else if (metrics.gpu_temp > 75) score -= 5

        // Penalizar por hotspot
        if (metrics.hotspot_temp > 95) score -= 15
        else if (metrics.hotspot_temp > 88) score -= 10

        // Penalizar por ventilador al máximo
        if (metrics.fan_speed > 95) score -= 10
        else if (metrics.fan_speed > 90) score -= 5

        return Math.max(0, Math.min(100, score))
    }, [])

    // Calcular eficiencia (hashrate simulado / potencia)
    const calculateEfficiency = useCallback((power: number, load: number): number => {
        // Simulación de hashrate basada en carga
        const simulatedHashrate = load * 1.5
        return power > 0 ? (simulatedHashrate / power) * 100 : 0
    }, [])

    // Cargar datos iniciales de las GPUs
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082'
                const response = await fetch(`${API_URL}/api/v1/latest`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    cache: 'no-store'
                })
                
                if (!response.ok) {
                    // throw new Error(`Failed to fetch GPU data: ${response.status} ${response.statusText}`)
                    console.log("error fetching initial GPU data, status:", response.status)
                }

                const data = await response.json()
                
                // Transformar datos de la API al formato GPUData
                if (data.results && data.results[0] && data.results[0].values) {
                    const gpuDataList: GPUData[] = data.results[0].values.map((row: unknown[]) => {
                        const metrics: GPUMetrics = {
                            gpu_temp: (row[3] as number) || 0,
                            hotspot_temp: (row[4] as number) || 0,
                            memory_temp: (row[5] as number) || 0,
                            load_percentage: (row[6] as number) || 0,
                            power_draw: (row[7] as number) || 0,
                            fan_speed: (row[8] as number) || 0,
                            efficiency: calculateEfficiency((row[7] as number) || 0, (row[6] as number) || 0)
                        }

                        return {
                            gpu_uuid: (row[0] as string) || '',
                            rig_name: (row[1] as string) || '',
                            model: (row[2] as string) || '',
                            status: calculateStatus(metrics),
                            current_metrics: metrics,
                            health_score: calculateHealthScore(metrics),
                            uptime_hours: 0, // Se puede calcular desde timestamp
                            age_days: 0, // Se puede obtener de otro endpoint
                            recommendations: []
                        }
                    })

                    setGPUs(gpuDataList)
                }
            } catch (error) {
                console.error('❌ Error loading initial GPU data:', error)
                // Mantener datos vacíos en caso de error
            } finally {
                setIsLoading(false)
            }
        }

        fetchInitialData()
    }, [calculateStatus, calculateHealthScore, calculateEfficiency])

    // Actualizar GPU cuando llegan datos por WebSocket
    useEffect(() => {
        if (!latestTelemetry || !isConnected) return

        const metrics: GPUMetrics = {
            gpu_temp: latestTelemetry.gpu_temp_celsius || 0,
            hotspot_temp: latestTelemetry.hotspot_temp_celsius || 0,
            memory_temp: latestTelemetry.memory_temp_celsius || 0,
            load_percentage: latestTelemetry.load_percentage || 0,
            power_draw: latestTelemetry.power_draw_watt || 0,
            fan_speed: latestTelemetry.fan_speed_percentage || 0,
            efficiency: calculateEfficiency(
                latestTelemetry.power_draw_watt || 0,
                latestTelemetry.load_percentage || 0
            )
        }

        const updatedGPU: Partial<GPUData> = {
            gpu_uuid: latestTelemetry.gpu_uuid,
            rig_name: latestTelemetry.rig_name,
            model: latestTelemetry.model,
            current_metrics: metrics,
            status: calculateStatus(metrics),
            health_score: calculateHealthScore(metrics)
        }

        setGPUs(prev => {
            const existingIndex = prev.findIndex(gpu => gpu.gpu_uuid === latestTelemetry.gpu_uuid)
            
            if (existingIndex >= 0) {
                // Actualizar GPU existente
                const updated = [...prev]
                updated[existingIndex] = { ...updated[existingIndex], ...updatedGPU }
                return updated
            } else {
                // Agregar nueva GPU
                const newGPU: GPUData = {
                    gpu_uuid: latestTelemetry.gpu_uuid,
                    rig_name: latestTelemetry.rig_name,
                    model: latestTelemetry.model,
                    status: calculateStatus(metrics),
                    current_metrics: metrics,
                    health_score: calculateHealthScore(metrics),
                    uptime_hours: 0,
                    age_days: 0,
                    recommendations: []
                }
                return [...prev, newGPU]
            }
        })
    }, [latestTelemetry, isConnected, calculateStatus, calculateHealthScore, calculateEfficiency])

    // Cargar recomendaciones para cada GPU periódicamente
    useEffect(() => {
        if (gpus.length === 0) return

        const loadRecommendations = async () => {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082'
            
            for (const gpu of gpus) {
                try {
                    const response = await fetch(`${API_URL}/api/v1/recommendations/${gpu.gpu_uuid}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        cache: 'no-store'
                    })
                    if (response.ok) {
                        const data = await response.json()
                        
                        if (data.recommendations && data.recommendations.length > 0) {
                            const recommendations: Recommendation[] = data.recommendations.map((rec: {
                                type: string;
                                action: string;
                                reason: string;
                                severity: string;
                                expected_impact?: {
                                    temp_reduction?: number;
                                    hashrate_loss?: number;
                                    power_savings?: number;
                                };
                            }) => ({
                                type: rec.type || '',
                                action: rec.action || '',
                                reason: rec.reason || '',
                                priority: rec.severity === 'critical' || rec.severity === 'high' ? 'high' : 
                                        rec.severity === 'medium' ? 'medium' : 'low',
                                expected_impact: rec.expected_impact
                            }))

                            setGPUs(prev => prev.map(g => 
                                g.gpu_uuid === gpu.gpu_uuid 
                                    ? { ...g, recommendations } 
                                    : g
                            ))
                        }
                    }
                } catch (error) {
                    console.error(`❌ Error loading recommendations for ${gpu.gpu_uuid}:`, error)
                }
            }
        }

        // Cargar inmediatamente y luego cada 5 minutos
        loadRecommendations()
        const interval = setInterval(loadRecommendations, 5 * 60 * 1000)

        return () => clearInterval(interval)
    }, [gpus])


    const updateGPU = useCallback((gpuUUID: string, data: Partial<GPUData>) => {
        setGPUs((prev) => prev.map((gpu) => (gpu.gpu_uuid === gpuUUID ? { ...gpu, ...data } : gpu)))
    }, [])

    const getGPUByUUID = useCallback(
        (gpuUUID: string) => {
            return gpus.find((gpu) => gpu.gpu_uuid === gpuUUID)
        },
        [gpus],
    )

    return <GPUContext.Provider value={{ gpus, updateGPU, getGPUByUUID, isLoading }}>{children}</GPUContext.Provider>
}

export function useGPU() {
    const context = useContext(GPUContext)
    if (context === undefined) {
        throw new Error("useGPU debe ser usado dentro de un GPUProvider")
    }
    return context
}
