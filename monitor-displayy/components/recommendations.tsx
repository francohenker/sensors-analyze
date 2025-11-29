"use client"

import type { Recommendation } from "@/contexts/gpu-context"
import { AlertCircle, Wrench, AlertTriangle, DollarSign, TrendingDown, Fan, Thermometer, Package } from "lucide-react"

interface RecommendationsProps {
    recs: Recommendation[]
}

export function Recommendations({ recs }: RecommendationsProps) {
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high":
                return "border-red-500/40 bg-red-900/10"
            case "medium":
                return "border-yellow-500/40 bg-yellow-900/10"
            case "low":
                return "border-blue-500/40 bg-blue-900/10"
            default:
                return "border-gray-500/40 bg-gray-900/10"
        }
    }

    const getPriorityTextColor = (priority: string) => {
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
                return <TrendingDown className="w-4 h-4" />
            case "maintenance":
                return <Wrench className="w-4 h-4" />
            case "replacement":
                return <Package className="w-4 h-4" />
            case "thermal_management":
                return <Thermometer className="w-4 h-4" />
            case "efficiency":
                return <DollarSign className="w-4 h-4" />
            default:
                return <AlertCircle className="w-4 h-4" />
        }
    }

    const formatAction = (action: string) => {
        return action
            .replace(/_/g, " ")
            .split(" ")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
    }

    if (recs.length === 0) {
        return null
    }

    return (
        <div className="space-y-3 pt-3 border-t border-border/30">
            <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                    Recomendaciones ({recs.length})
                </p>
            </div>
            
            <div className="space-y-2">
                {recs.map((rec, idx) => (
                    <div 
                        key={idx} 
                        className={`p-3 rounded-lg border ${getPriorityColor(rec.priority)} transition-all hover:shadow-md`}
                    >
                        <div className="flex items-start gap-2">
                            <span className={`mt-0.5 flex-shrink-0 ${getPriorityTextColor(rec.priority)}`}>
                                {getIcon(rec.type)}
                            </span>
                            <div className="flex-1 space-y-1.5">
                                {/* Título y prioridad */}
                                <div className="flex items-start justify-between gap-2">
                                    <p className="font-semibold text-sm text-foreground leading-tight">
                                        {formatAction(rec.action)}
                                    </p>
                                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${getPriorityTextColor(rec.priority)} border ${rec.priority === 'high' ? 'border-red-500/50' : rec.priority === 'medium' ? 'border-yellow-500/50' : 'border-blue-500/50'}`}>
                                        {rec.priority}
                                    </span>
                                </div>
                                
                                {/* Razón */}
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {rec.reason}
                                </p>

                                {/* Impacto esperado */}
                                {rec.expected_impact && (
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {rec.expected_impact.temp_reduction !== undefined && (
                                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-900/20 rounded border border-blue-500/30">
                                                <Thermometer className="w-3 h-3 text-blue-400" />
                                                <span className="text-[10px] text-blue-300 font-medium">
                                                    {rec.expected_impact.temp_reduction > 0 ? '+' : ''}{rec.expected_impact.temp_reduction}°C
                                                </span>
                                            </div>
                                        )}
                                        {rec.expected_impact.power_savings !== undefined && (
                                            <div className="flex items-center gap-1 px-2 py-1 bg-green-900/20 rounded border border-green-500/30">
                                                <DollarSign className="w-3 h-3 text-green-400" />
                                                <span className="text-[10px] text-green-300 font-medium">
                                                    ${rec.expected_impact.power_savings}/mes
                                                </span>
                                            </div>
                                        )}
                                        {rec.expected_impact.hashrate_loss !== undefined && (
                                            <div className="flex items-center gap-1 px-2 py-1 bg-orange-900/20 rounded border border-orange-500/30">
                                                <Fan className="w-3 h-3 text-orange-400" />
                                                <span className="text-[10px] text-orange-300 font-medium">
                                                    {rec.expected_impact.hashrate_loss}% hashrate
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
