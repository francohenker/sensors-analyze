"use client"

import type { GPUMetrics as GPUMetricsType } from "@/contexts/gpu-context"
import { Gauge } from "./gauge"

export function GPUMetrics({ metrics }: { metrics: GPUMetricsType }) {
    return (
        <div className="grid grid-cols-2 gap-3">
            <Gauge label="GPU Temp" value={metrics.gpu_temp} max={100} unit="°C" color="text-orange-400" />
            <Gauge label="Load" value={metrics.load_percentage} max={100} unit="%" color="text-blue-400" />
            <Gauge label="Power" value={metrics.power_draw} max={400} unit="W" color="text-yellow-400" />
            <Gauge label="Fan" value={metrics.fan_speed} max={100} unit="%" color="text-cyan-400" />
        </div>
    )
}
