"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"

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
}

const GPUContext = createContext<GPUContextType | undefined>(undefined)

export function GPUProvider({ children }: { children: React.ReactNode }) {
    const [gpus, setGPUs] = useState<GPUData[]>([])

    // Simular conexión WebSocket
    useEffect(() => {
        // En producción, reemplazar con conexión real a WebSocket
        const mockGPUs: GPUData[] = [
            {
                gpu_uuid: "gpu-001",
                rig_name: "rig-A",
                model: "RTX 3080",
                status: "healthy",
                current_metrics: {
                    gpu_temp: 75.5,
                    hotspot_temp: 85.2,
                    memory_temp: 82.0,
                    load_percentage: 95.0,
                    power_draw: 285.0,
                    fan_speed: 85.0,
                    efficiency: 5.2,
                },
                health_score: 85,
                uptime_hours: 720,
                age_days: 450,
                recommendations: [
                    {
                        type: "performance_optimization",
                        action: "reduce_core_clock",
                        reason: "Temperatura GPU > 80°C sostenida por 2 horas",
                        priority: "high",
                        expected_impact: {
                            temp_reduction: -5,
                            hashrate_loss: -2,
                            power_savings: 15,
                        },
                    },
                ],
            },
            {
                gpu_uuid: "gpu-002",
                rig_name: "rig-B",
                model: "RTX 3080 Ti",
                status: "warning",
                current_metrics: {
                    gpu_temp: 82.1,
                    hotspot_temp: 88.5,
                    memory_temp: 85.3,
                    load_percentage: 98.0,
                    power_draw: 310.0,
                    fan_speed: 95.0,
                    efficiency: 4.8,
                },
                health_score: 72,
                uptime_hours: 1200,
                age_days: 520,
                recommendations: [
                    {
                        type: "maintenance",
                        action: "clean_fans",
                        reason: "Fan speed > 90% pero temp sigue alta",
                        priority: "medium",
                    },
                ],
            },
            {
                gpu_uuid: "gpu-003",
                rig_name: "rig-C",
                model: "RTX 4090",
                status: "healthy",
                current_metrics: {
                    gpu_temp: 68.2,
                    hotspot_temp: 76.8,
                    memory_temp: 74.5,
                    load_percentage: 92.0,
                    power_draw: 380.0,
                    fan_speed: 72.0,
                    efficiency: 6.1,
                },
                health_score: 92,
                uptime_hours: 360,
                age_days: 120,
                recommendations: [],
            },
            {
                gpu_uuid: "gpu-004",
                rig_name: "rig-A",
                model: "RTX 3090",
                status: "critical",
                current_metrics: {
                    gpu_temp: 88.5,
                    hotspot_temp: 95.2,
                    memory_temp: 91.0,
                    load_percentage: 100.0,
                    power_draw: 320.0,
                    fan_speed: 100.0,
                    efficiency: 3.9,
                },
                health_score: 45,
                uptime_hours: 480,
                age_days: 650,
                recommendations: [
                    {
                        type: "replacement",
                        action: "consider_replacement",
                        reason: "GPU edad > 18 meses + degradación térmica > 15%",
                        priority: "high",
                    },
                ],
            },
        ]

        setGPUs(mockGPUs)

        // Simular actualizaciones periódicas
        const interval = setInterval(() => {
            setGPUs((prevGPUs) =>
                prevGPUs.map((gpu) => ({
                    ...gpu,
                    current_metrics: {
                        ...gpu.current_metrics,
                        gpu_temp: gpu.current_metrics.gpu_temp + (Math.random() - 0.5) * 2,
                        load_percentage: Math.min(100, gpu.current_metrics.load_percentage + (Math.random() - 0.5) * 5),
                        power_draw: gpu.current_metrics.power_draw + (Math.random() - 0.5) * 10,
                        fan_speed: Math.max(30, Math.min(100, gpu.current_metrics.fan_speed + (Math.random() - 0.5) * 3)),
                    },
                })),
            )
        }, 3000)

        return () => clearInterval(interval)
    }, [])

    const updateGPU = useCallback((gpuUUID: string, data: Partial<GPUData>) => {
        setGPUs((prev) => prev.map((gpu) => (gpu.gpu_uuid === gpuUUID ? { ...gpu, ...data } : gpu)))
    }, [])

    const getGPUByUUID = useCallback(
        (gpuUUID: string) => {
            return gpus.find((gpu) => gpu.gpu_uuid === gpuUUID)
        },
        [gpus],
    )

    return <GPUContext.Provider value={{ gpus, updateGPU, getGPUByUUID }}>{children}</GPUContext.Provider>
}

export function useGPU() {
    const context = useContext(GPUContext)
    if (context === undefined) {
        throw new Error("useGPU debe ser usado dentro de un GPUProvider")
    }
    return context
}
