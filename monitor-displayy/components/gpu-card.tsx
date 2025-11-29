"use client"

import type { GPUData } from "@/contexts/gpu-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GPUMetrics } from "./gpu-metrics"
import { StatusBadge } from "./status-badge"
import { HealthScore } from "./health-score"
import { Recommendations } from "./recommendations"
import { AlertCircle, Zap, Thermometer } from "lucide-react"

export function GPUCard({ gpu }: { gpu: GPUData }) {
    const isOverheating = gpu.current_metrics.gpu_temp > 85
    // const isHighLoad = gpu.current_metrics.load_percentage > 95
    const isHighPower = gpu.current_metrics.power_draw > 300

    return (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow border-border/50">
            <CardHeader className="pb-3 bg-card/50 border-b border-border/30">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                        <CardTitle className="text-xl text-foreground">{gpu.model}</CardTitle>
                        <p className="text-x text-muted-foreground mt-1">
                            {gpu.rig_name} • {gpu.gpu_uuid}
                        </p>
                    </div>
                    <StatusBadge status={gpu.status} />
                </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
                {/* Health Score */}
                <HealthScore score={gpu.health_score} />

                {/* Critical Alerts */}
                <div className="space-y-2">
                    {isOverheating && (
                        <div className="flex gap-2 items-start p-2 bg-red-900/20 border border-red-500/30 rounded-lg">
                            <Thermometer className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-red-200">GPU temp: {gpu.current_metrics.gpu_temp.toFixed(1)}°C</p>
                        </div>
                    )}
                    {isHighPower && (
                        <div className="flex gap-2 items-start p-2 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                            <Zap className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-yellow-200">Potencia alta: {gpu.current_metrics.power_draw.toFixed(0)}W</p>
                        </div>
                    )}
                    {gpu.status === "critical" && (
                        <div className="flex gap-2 items-start p-2 bg-red-900/20 border border-red-500/30 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-red-200">Estado crítico - revisar recomendaciones</p>
                        </div>
                    )}
                </div>

                {/* Metrics */}
                <GPUMetrics metrics={gpu.current_metrics} />

                {/* GPU Info */}
                {/* <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/20">
                    <div>
                        <p className="text-xs text-muted-foreground">Uptime</p>
                        <p className="text-sm font-medium text-foreground">{gpu.uptime_hours}h</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Edad</p>
                        <p className="text-sm font-medium text-foreground">{gpu.age_days}d</p>
                    </div>
                </div> */}

                {/* Recommendations */}
                {gpu.recommendations && gpu.recommendations.length > 0 && <Recommendations recs={gpu.recommendations} />}
            </CardContent>
        </Card>
    )
}
