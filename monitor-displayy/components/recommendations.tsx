"use client"

import type { Recommendation } from "@/contexts/gpu-context"
import { AlertCircle, Wrench, AlertTriangle } from "lucide-react"

interface RecommendationsProps {
    recs: Recommendation[]
}

export function Recommendations({ recs }: RecommendationsProps) {
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high":
                return "text-red-400"
            case "medium":
                return "text-yellow-400"
            case "low":
                return "text-blue-400"
            default:
                return "text-gray-400"
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case "performance_optimization":
                return <Wrench className="w-3 h-3" />
            case "maintenance":
                return <AlertTriangle className="w-3 h-3" />
            case "replacement":
                return <AlertCircle className="w-3 h-3" />
            default:
                return <AlertCircle className="w-3 h-3" />
        }
    }

    return (
        <div className="space-y-2 pt-2 border-t border-border/20">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Recomendaciones</p>
            {recs.map((rec, idx) => (
                <div key={idx} className="text-xs space-y-1">
                    <div className="flex items-start gap-2">
                        <span className={`mt-0.5 flex-shrink-0 ${getPriorityColor(rec.priority)}`}>{getIcon(rec.type)}</span>
                        <div className="flex-1">
                            <p className="font-medium text-foreground">{rec.action.replace(/_/g, " ")}</p>
                            <p className="text-muted-foreground text-xs mt-0.5">{rec.reason}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
