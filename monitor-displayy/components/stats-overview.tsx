"use client"

import type { GPUData } from "@/contexts/gpu-context"
import { Card, CardContent } from "@/components/ui/card"

export function StatsOverview({ gpus }: { gpus: GPUData[] }) {
    const totalGPUs = gpus.length
    const healthyGPUs = gpus.filter((g) => g.status === "healthy").length
    const warningGPUs = gpus.filter((g) => g.status === "warning").length
    const criticalGPUs = gpus.filter((g) => g.status === "critical").length
    const avgHealth = Math.round(gpus.reduce((sum, g) => sum + g.health_score, 0) / gpus.length)
    const totalPower = gpus.reduce((sum, g) => sum + g.current_metrics.power_draw, 0).toFixed(1)
    const avgTemp = (gpus.reduce((sum, g) => sum + g.current_metrics.gpu_temp, 0) / gpus.length).toFixed(1)

    const StatCard = ({ label, value, className }: { label: string; value: string | number; className?: string }) => (
        <Card className={`${className}`}>
            <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">{label}</p>
                <p className="text-2xl font-bold text-foreground">{value}</p>
            </CardContent>
        </Card>
    )

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <StatCard label="Total GPUs" value={totalGPUs} />
            <StatCard label="Saludables" value={healthyGPUs} className="border-green-500/30" />
            <StatCard label="Advertencia" value={warningGPUs} className="border-yellow-500/30" />
            <StatCard label="Críticas" value={criticalGPUs} className="border-red-500/30" />
            <StatCard label="Salud Promedio" value={`${avgHealth}%`} />
            <StatCard label="Potencia Total" value={`${totalPower}W`} />
            <StatCard label="Temp Promedio" value={`${avgTemp}°C`} />
        </div>
    )
}
