"use client"

import { useWebSocket } from "@/contexts/websocket-context"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, AlertTriangle, Info, Clock } from "lucide-react"
import { useState } from "react"
import { Button } from "../components/ui/button"

export function AlertList() {
    const { alerts, isConnected } = useWebSocket()
    const [filter, setFilter] = useState<'all' | 'CRITICAL' | 'WARNING' | 'INFO'>('all')

    const filteredAlerts = filter === 'all' 
        ? alerts 
        : alerts.filter(alert => alert.severity === filter)

    const getAlertIcon = (severity: string) => {
        switch (severity) {
            case 'CRITICAL':
                return <AlertCircle className="h-5 w-5 text-red-500" />
            case 'WARNING':
                return <AlertTriangle className="h-5 w-5 text-yellow-500" />
            case 'INFO':
                return <Info className="h-5 w-5 text-blue-500" />
            default:
                return <AlertCircle className="h-5 w-5" />
        }
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'CRITICAL':
                return 'bg-red-500/10 text-red-500 border-red-500/20'
            case 'WARNING':
                return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
            case 'INFO':
                return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
            default:
                return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
        }
    }

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const seconds = Math.floor(diff / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)

        if (seconds < 60) return `Hace ${seconds}s`
        if (minutes < 60) return `Hace ${minutes}m`
        if (hours < 24) return `Hace ${hours}h`
        console.log("date: ", timestamp);
        return `Hace ${days}d`
    }

    return (
        <div className="space-y-6">
            {/* Connection Status */}
            <Card className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-sm font-medium">
                            {isConnected ? 'Conectado al sistema de alertas' : 'Desconectado'}
                        </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {filteredAlerts.length} alertas {filter !== 'all' && `(${filter})`}
                    </div>
                </div>
            </Card>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                >
                    Todas ({alerts.length})
                </Button>
                <Button
                    variant={filter === 'CRITICAL' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('CRITICAL')}
                    className={filter === 'CRITICAL' ? 'bg-red-500 hover:bg-red-600' : ''}
                >
                    Críticas ({alerts.filter(a => a.severity === 'CRITICAL').length})
                </Button>
                <Button
                    variant={filter === 'WARNING' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('WARNING')}
                    className={filter === 'WARNING' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                >
                    Advertencias ({alerts.filter(a => a.severity === 'WARNING').length})
                </Button>
                <Button
                    variant={filter === 'INFO' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('INFO')}
                    className={filter === 'INFO' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                >
                    Info ({alerts.filter(a => a.severity === 'INFO').length})
                </Button>
            </div>

            {/* Alerts List */}
            <div className="space-y-3">
                {filteredAlerts.length === 0 ? (
                    <Card className="p-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                            <Info className="h-12 w-12 text-muted-foreground" />
                            <div>
                                <h3 className="text-lg font-semibold">No hay alertas</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {filter === 'all' 
                                        ? 'No se han recibido alertas del sistema' 
                                        : `No hay alertas de tipo ${filter}`
                                    }
                                </p>
                            </div>
                        </div>
                    </Card>
                ) : (
                    filteredAlerts.map((alert, index) => (
                        <Card 
                            key={`${alert.id}-${index}`}
                            className={`p-4 border-l-4 ${getSeverityColor(alert.severity)} transition-all hover:shadow-md`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 flex-1">
                                    <div className="mt-0.5">
                                        {getAlertIcon(alert.severity)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                                                {alert.severity}
                                            </Badge>
                                            <span className="text-sm font-mono text-muted-foreground">
                                                {alert.gpu_uuid}
                                            </span>
                                            {alert.rig_name && (
                                                <span className="text-sm text-muted-foreground">
                                                    • {alert.rig_name}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-foreground font-medium">
                                            {alert.message}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            {formatDate(alert.triggered_at)}
                                            <span className="text-xs">
                                                ({new Date(alert.triggered_at).toLocaleString()})
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Info Footer */}
            {filteredAlerts.length > 0 && (
                <Card className="p-4 bg-muted/50">
                    <p className="text-sm text-muted-foreground text-center">
                        Mostrando las últimas 50 alertas • Las alertas se actualizan en tiempo real
                    </p>
                </Card>
            )}
        </div>
    )
}
