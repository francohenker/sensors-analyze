"use client"

import { useGPU } from "@/contexts/gpu-context"
import { Card } from "@/components/ui/card"
import { AlertCircle, TrendingDown, Wrench, Package, Thermometer, DollarSign, Fan, ArrowLeft, Filter } from "lucide-react"
import Link from "next/link"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard-header"

type RecommendationType = "all" | "performance_optimization" | "thermal_management" | "maintenance" | "efficiency" | "replacement"
type PriorityFilter = "all" | "high" | "medium" | "low"

export default function RecommendationsPage() {
    const { gpus, isLoading } = useGPU()
    const [typeFilter, setTypeFilter] = useState<RecommendationType>("all")
    const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all")

    // Agrupar todas las recomendaciones de todas las GPUs
    const allRecommendations = useMemo(() => {
        const recs = gpus.flatMap(gpu => 
            (gpu.recommendations || []).map(rec => ({
                ...rec,
                gpu_uuid: gpu.gpu_uuid,
                rig_name: gpu.rig_name,
                model: gpu.model,
                status: gpu.status
            }))
        )

        // Aplicar filtros
        let filtered = recs

        if (typeFilter !== "all") {
            filtered = filtered.filter(rec => rec.type === typeFilter)
        }

        if (priorityFilter !== "all") {
            filtered = filtered.filter(rec => rec.priority === priorityFilter)
        }

        // Ordenar por prioridad
        return filtered.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 }
            return priorityOrder[a.priority] - priorityOrder[b.priority]
        })
    }, [gpus, typeFilter, priorityFilter])

    const stats = useMemo(() => {
        const all = gpus.flatMap(gpu => gpu.recommendations || [])
        return {
            total: all.length,
            high: all.filter(r => r.priority === "high").length,
            medium: all.filter(r => r.priority === "medium").length,
            low: all.filter(r => r.priority === "low").length,
            byType: {
                performance: all.filter(r => r.type === "performance_optimization").length,
                thermal: all.filter(r => r.type === "thermal_management").length,
                maintenance: all.filter(r => r.type === "maintenance").length,
                efficiency: all.filter(r => r.type === "efficiency").length,
                replacement: all.filter(r => r.type === "replacement").length,
            }
        }
    }, [gpus])

    const getIcon = (type: string, className = "w-5 h-5") => {
        switch (type) {
            case "performance_optimization":
                return <TrendingDown className={className} />
            case "thermal_management":
                return <Thermometer className={className} />
            case "maintenance":
                return <Wrench className={className} />
            case "efficiency":
                return <DollarSign className={className} />
            case "replacement":
                return <Package className={className} />
            default:
                return <AlertCircle className={className} />
        }
    }

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

    const getPriorityBadgeColor = (priority: string) => {
        switch (priority) {
            case "high":
                return "bg-red-500/20 text-red-400 border-red-500/50"
            case "medium":
                return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
            case "low":
                return "bg-blue-500/20 text-blue-400 border-blue-500/50"
            default:
                return "bg-gray-500/20 text-gray-400 border-gray-500/50"
        }
    }

    const formatAction = (action: string) => {
        return action
            .replace(/_/g, " ")
            .split(" ")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
    }

    const formatType = (type: string) => {
        const typeMap: Record<string, string> = {
            performance_optimization: "Optimización de Rendimiento",
            thermal_management: "Gestión Térmica",
            maintenance: "Mantenimiento",
            efficiency: "Eficiencia Energética",
            replacement: "Reemplazo de Hardware"
        }
        return typeMap[type] || type
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background p-8">
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Cargando recomendaciones...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <DashboardHeader />
            <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
                <div className="px-4 py-4 md:px-8">
                    <div className="flex items-center gap-4 mb-4">
                        <Link href="/">
                            <Button variant="ghost" size="sm" className="gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Volver al Dashboard
                            </Button>
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold text-foreground">Recomendaciones del Sistema</h1>
                    <p className="text-muted-foreground mt-2">
                        {stats.total} recomendaciones activas para {gpus.length} GPUs
                    </p>
                </div>
            </div>

            <main className="px-4 py-8 md:px-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Prioridad Alta</p>
                                <p className="text-2xl font-bold text-red-400">{stats.high}</p>
                            </div>
                            <AlertCircle className="w-8 h-8 text-red-400" />
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Prioridad Media</p>
                                <p className="text-2xl font-bold text-yellow-400">{stats.medium}</p>
                            </div>
                            <AlertCircle className="w-8 h-8 text-yellow-400" />
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Prioridad Baja</p>
                                <p className="text-2xl font-bold text-blue-400">{stats.low}</p>
                            </div>
                            <AlertCircle className="w-8 h-8 text-blue-400" />
                        </div>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="p-4 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <h3 className="font-semibold text-foreground">Filtros</h3>
                    </div>
                    
                    <div className="space-y-4">
                        {/* Priority Filter */}
                        <div>
                            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Prioridad</p>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant={priorityFilter === "all" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setPriorityFilter("all")}
                                >
                                    Todas ({stats.total})
                                </Button>
                                <Button
                                    variant={priorityFilter === "high" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setPriorityFilter("high")}
                                    className={priorityFilter === "high" ? "bg-red-500 hover:bg-red-600" : ""}
                                >
                                    Alta ({stats.high})
                                </Button>
                                <Button
                                    variant={priorityFilter === "medium" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setPriorityFilter("medium")}
                                    className={priorityFilter === "medium" ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                                >
                                    Media ({stats.medium})
                                </Button>
                                <Button
                                    variant={priorityFilter === "low" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setPriorityFilter("low")}
                                    className={priorityFilter === "low" ? "bg-blue-500 hover:bg-blue-600" : ""}
                                >
                                    Baja ({stats.low})
                                </Button>
                            </div>
                        </div>

                        {/* Type Filter */}
                        <div>
                            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Tipo</p>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant={typeFilter === "all" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setTypeFilter("all")}
                                >
                                    Todas
                                </Button>
                                <Button
                                    variant={typeFilter === "performance_optimization" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setTypeFilter("performance_optimization")}
                                    className="gap-2"
                                >
                                    <TrendingDown className="w-3 h-3" />
                                    Rendimiento ({stats.byType.performance})
                                </Button>
                                <Button
                                    variant={typeFilter === "thermal_management" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setTypeFilter("thermal_management")}
                                    className="gap-2"
                                >
                                    <Thermometer className="w-3 h-3" />
                                    Térmica ({stats.byType.thermal})
                                </Button>
                                <Button
                                    variant={typeFilter === "maintenance" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setTypeFilter("maintenance")}
                                    className="gap-2"
                                >
                                    <Wrench className="w-3 h-3" />
                                    Mantenimiento ({stats.byType.maintenance})
                                </Button>
                                <Button
                                    variant={typeFilter === "efficiency" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setTypeFilter("efficiency")}
                                    className="gap-2"
                                >
                                    <DollarSign className="w-3 h-3" />
                                    Eficiencia ({stats.byType.efficiency})
                                </Button>
                                <Button
                                    variant={typeFilter === "replacement" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setTypeFilter("replacement")}
                                    className="gap-2"
                                >
                                    <Package className="w-3 h-3" />
                                    Reemplazo ({stats.byType.replacement})
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Recommendations List */}
                <div className="space-y-4">
                    {allRecommendations.length === 0 ? (
                        <Card className="p-12 text-center">
                            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-foreground">No hay recomendaciones</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                                {typeFilter !== "all" || priorityFilter !== "all"
                                    ? "No se encontraron recomendaciones con los filtros aplicados"
                                    : "Todas las GPUs están operando correctamente"
                                }
                            </p>
                        </Card>
                    ) : (
                        allRecommendations.map((rec, idx) => (
                            <Card 
                                key={`${rec.gpu_uuid}-${idx}`}
                                className={`p-6 border ${getPriorityColor(rec.priority)} hover:shadow-lg transition-all`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Icon */}
                                    <div className={`p-3 rounded-lg ${getPriorityColor(rec.priority)}`}>
                                        {getIcon(rec.type)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 space-y-3">
                                        {/* Header */}
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-foreground mb-1">
                                                    {formatAction(rec.action)}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {rec.model} • {rec.rig_name} • <span className="font-mono text-xs">{rec.gpu_uuid.slice(0, 8)}</span>
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-bold uppercase px-2 py-1 rounded border ${getPriorityBadgeColor(rec.priority)}`}>
                                                    {rec.priority}
                                                </span>
                                                <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground border border-border">
                                                    {formatType(rec.type)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Reason */}
                                        <p className="text-sm text-foreground leading-relaxed">
                                            {rec.reason}
                                        </p>

                                        {/* Expected Impact */}
                                        {rec.expected_impact && (
                                            <div className="flex flex-wrap gap-3 pt-2">
                                                {rec.expected_impact.temp_reduction !== undefined && (
                                                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-900/20 rounded-lg border border-blue-500/30">
                                                        <Thermometer className="w-4 h-4 text-blue-400" />
                                                        <div>
                                                            <p className="text-[10px] text-blue-300 font-semibold uppercase">Temperatura</p>
                                                            <p className="text-sm text-blue-200 font-bold">
                                                                {rec.expected_impact.temp_reduction > 0 ? '+' : ''}{rec.expected_impact.temp_reduction}°C
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                                {rec.expected_impact.power_savings !== undefined && (
                                                    <div className="flex items-center gap-2 px-3 py-2 bg-green-900/20 rounded-lg border border-green-500/30">
                                                        <DollarSign className="w-4 h-4 text-green-400" />
                                                        <div>
                                                            <p className="text-[10px] text-green-300 font-semibold uppercase">Ahorro Mensual</p>
                                                            <p className="text-sm text-green-200 font-bold">
                                                                ${rec.expected_impact.power_savings}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                                {rec.expected_impact.hashrate_loss !== undefined && (
                                                    <div className="flex items-center gap-2 px-3 py-2 bg-orange-900/20 rounded-lg border border-orange-500/30">
                                                        <Fan className="w-4 h-4 text-orange-400" />
                                                        <div>
                                                            <p className="text-[10px] text-orange-300 font-semibold uppercase">Impacto Hashrate</p>
                                                            <p className="text-sm text-orange-200 font-bold">
                                                                {rec.expected_impact.hashrate_loss}%
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </main>
        </div>
    )
}
