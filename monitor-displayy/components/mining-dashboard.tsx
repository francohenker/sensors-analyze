"use client"

import { useState, useMemo } from "react"
import { useGPU } from "@/contexts/gpu-context"
import { GPUCard } from "./gpu-card"
import { DashboardHeader } from "./dashboard-header"
import { StatsOverview } from "./stats-overview"
import { GPUFilter, type SortOption } from "./gpu-filter"

export function MiningDashboard() {
    const { gpus } = useGPU()
    const [sortBy, setSortBy] = useState<SortOption>("default")

    // Ordenar GPUs según el filtro seleccionado
    const sortedGPUs = useMemo(() => {
        const gpusCopy = [...gpus]
        
        switch (sortBy) {
            case "critical-first":
                return gpusCopy.sort((a, b) => {
                    const statusOrder = { critical: 0, warning: 1, healthy: 2 }
                    return statusOrder[a.status] - statusOrder[b.status]
                })
            
            case "healthy-first":
                return gpusCopy.sort((a, b) => {
                    const statusOrder = { healthy: 0, warning: 1, critical: 2 }
                    return statusOrder[a.status] - statusOrder[b.status]
                })
            
            case "temp-high":
                return gpusCopy.sort((a, b) => 
                    b.current_metrics.gpu_temp - a.current_metrics.gpu_temp
                )
            
            case "temp-low":
                return gpusCopy.sort((a, b) => 
                    a.current_metrics.gpu_temp - b.current_metrics.gpu_temp
                )
            
            default:
                return gpusCopy
        }
    }, [gpus, sortBy])

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <DashboardHeader />

            {/* Main Content */}
            <main className="px-4 py-8 md:px-8">
                {/* Stats Overview */}
                <StatsOverview gpus={gpus} />

                {/* GPU Grid */}
                <div className="mt-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-foreground">
                            Monitoreo de GPUs ({gpus.length})
                        </h2>
                        <GPUFilter sortBy={sortBy} onSortChange={setSortBy} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {sortedGPUs.map((gpu) => (
                            <GPUCard key={gpu.gpu_uuid} gpu={gpu} />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}
