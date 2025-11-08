"use client"

import { useGPU } from "@/contexts/gpu-context"
import { GPUCard } from "./gpu-card"
import { DashboardHeader } from "./dashboard-header"
import { StatsOverview } from "./stats-overview"

export function MiningDashboard() {
    const { gpus } = useGPU()

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
                    <h2 className="text-2xl font-bold text-foreground mb-6">Monitoreo de GPUs</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {gpus.map((gpu) => (
                            <GPUCard key={gpu.gpu_uuid} gpu={gpu} />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}
