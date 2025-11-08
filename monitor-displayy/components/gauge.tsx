"use client"

interface GaugeProps {
    label: string
    value: number
    max: number
    unit: string
    color: string
}

export function Gauge({ label, value, max, unit, color }: GaugeProps) {
    const percentage = (value / max) * 100
    const clampedPercentage = Math.min(100, Math.max(0, percentage))

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className={`text-xs font-bold ${color}`}>
                    {value.toFixed(1)}
                    {unit}
                </p>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-300 ${clampedPercentage > 80 ? "bg-red-500" : clampedPercentage > 60 ? "bg-yellow-500" : "bg-green-500"
                        }`}
                    style={{ width: `${clampedPercentage}%` }}
                />
            </div>
        </div>
    )
}
