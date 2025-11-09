"use client"

import { useWebSocket } from "@/contexts/websocket-context"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, AlertTriangle, Info, Clock } from "lucide-react"
import { useState } from "react"
import { Button } from "../components/ui/button"


export interface AlertData {
    id?: number
    gpu_id?: number
    gpu_uuid: string
    rig_name?: string
    severity: 'CRITICAL' | 'WARNING' | 'INFO'
    message: string
    triggered_at?: string
    alert_type?: string
    alerts?: Array<{
        type: string
        value: number
        triggered_value: number
        threshold_value: number
        severity: 'CRITICAL' | 'WARNING' | 'INFO'
        alert_type: string
    }>
    // Campos para estructura plana (legacy)
    threshold_value?: number
    triggered_value?: number
}

export function AlertList() {
    let { alerts, isConnected } = useWebSocket()
    const [filter, setFilter] = useState<'all' | 'CRITICAL' | 'WARNING' | 'INFO'>('all')

    // alerts = alert.alerts;

    const filteredAlerts = filter === 'all'
        ? alerts
        : alerts.filter(alert =>
            alert.alerts && alert.alerts[0]?.severity === filter
        );
    console.log("filteredAlerts: ", filteredAlerts);
    // const filteredAlerts = alerts
    const ale = filteredAlerts
        .flatMap(alert => alert.alerts || [])  // Aplana y maneja undefined
        .flat();  // Por si hay arrays anidados
    const criticalCount = alerts.filter(alert =>
        alert.alerts && alert.alerts[0]?.severity === 'CRITICAL'
    ).length;

    const warningCount = alerts.filter(alert =>
        alert.alerts && alert.alerts[0]?.severity === 'WARNING'
    ).length;

    const infoCount = alerts.filter(alert =>
        alert.alerts && alert.alerts[0]?.severity === 'INFO'
    ).length;

    console.log("ale: ", ale);

    // console.log("dAlerts: ", alerts.flat())
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

    const formatDate = (timestamp?: string) => {
        if (!timestamp) return 'Sin fecha'

        try {
            const date = new Date(timestamp)
            if (isNaN(date.getTime())) return 'Fecha inválida'

            return date.toLocaleString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            })
        } catch {
            return timestamp
        }
    }

    const getAlertDescription = (alert: AlertData) => {
        // console.log('🔍 getAlertDescription called with:', alert)

        // Verificar si tiene la estructura nueva con array de alerts
        if (alert.alerts && alert.alerts.length > 0) {
            // console.log('✅ Has sub-alerts array, generating descriptions...');
            // console.log("alerts:_ ", alert)
            const descriptions = alert.alerts.flat().map((subAlert) => {
                const typeMap: Record<string, string> = {
                    'HIGH_GPU_TEMPERATURE': 'Temperatura GPU alta',
                    'HIGH_HOTSPOT_TEMPERATURE': 'Temperatura hotspot alta',
                    'HIGH_MEMORY_TEMPERATURE': 'Temperatura de memoria alta',
                    'HIGH_TEMPERATURE': 'Temperatura alta',
                    'HIGH_POWER_CONSUMPTION': 'Alto consumo de energía',
                    'HIGH_POWER': 'Alto consumo de energía',
                    'FAN_MAX_SPEED': 'Ventilador al máximo',
                    'SUSTAINED_HIGH_LOAD': 'Carga sostenida alta'
                }
                // console.log("subaler: ", subAlert)
                const description = typeMap[subAlert.alert_type] || subAlert.alert_type
                return `${description}: ${subAlert.triggered_value.toFixed(2)} `
            })

            return descriptions.join(' • ')
        }

        // Verificar si tiene la estructura plana (legacy) - ESTE ES TU CASO
        if (alert.alert_type && alert.triggered_value !== undefined && alert.threshold_value !== undefined) {
            console.log('✅ Has legacy flat structure, generating description...');

            const typeMap: Record<string, string> = {
                'HIGH_GPU_TEMP': 'Temperatura GPU alta',
                'HIGH_MEMORY_TEMP': 'Temperatura de memoria alta',
                'HIGH_HOTSPOT_TEMPERATURE': 'Temperatura hotspot alta',
                'HIGH_MEMORY_TEMPERATURE': 'Temperatura de memoria alta',
                'HIGH_TEMPERATURE': 'Temperatura alta',
                'HIGH_POWER_CONSUMPTION': 'Alto consumo de energía',
                'HIGH_POWER': 'Alto consumo de energía',
                'FAN_MAX_SPEED': 'Ventilador al máximo',
                'SUSTAINED_HIGH_LOAD': 'Carga sostenida alta'
            }

            const description = typeMap[alert.alert_type] || alert.alert_type
            return `${description}: ${alert.triggered_value} (umbral: ${alert.threshold_value})`
        }

        // Fallback si no tiene ninguna estructura reconocida
        console.log('⚠️ Using fallback message')
        return alert.message || alert.alert_type || 'Alerta del sistema'
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
                    Críticas ({criticalCount})
                </Button>
                <Button
                    variant={filter === 'WARNING' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('WARNING')}
                    className={filter === 'WARNING' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                >
                    Advertencias ({warningCount})
                </Button>
                <Button
                    variant={filter === 'INFO' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('INFO')}
                    className={filter === 'INFO' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                >
                    Info ({infoCount})
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
                    filteredAlerts.flat().map((alert, index) => (
                        <Card
                            key={`${alert.id}-${index}`}
                            className={`p-4 border-l-4 ${getSeverityColor(alert.alerts[0].severity)} transition-all hover:shadow-md`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 flex-1">
                                    <div className="mt-0.5">
                                        {getAlertIcon(alert.alerts[0].severity)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline" className={getSeverityColor(alert.alerts[0].severity)}>
                                                {alert.alerts[0].severity}
                                            </Badge>
                                            <span className="text-sm font-mono text-muted-foreground">
                                                {alert.gpu_uuid}
                                            </span>
                                            {/* {alert.rig_name && (
                                                <span className="text-sm text-muted-foreground">
                                                    • {alert.rig_name}
                                                </span>
                                            )} */}
                                        </div>
                                        <p className="text-sm text-foreground font-medium mb-2">
                                            {getAlertDescription(alert)}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            {formatDate(alert.triggered_at)}
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
