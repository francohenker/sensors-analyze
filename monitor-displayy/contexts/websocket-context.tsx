"use client"

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'

interface TelemetryData {
    gpu_uuid: string
    rig_name: string
    model: string
    gpu_temp_celsius: number
    hotspot_temp_celsius: number
    memory_temp_celsius: number
    load_percentage: number
    power_draw_watt: number
    fan_speed_percentage: number
    timestamp: string
}

export interface AlertData {
    id?: number
    gpu_id?: number
    gpu_uuid: string
    rig_name?: string
    severity: 'CRITICAL' | 'WARNING' | 'INFO'
    message: string
    triggered_at?: string
    alert_type?: string
    triggered_value?: number
    threshold_value?: number
    alerts?: Array<{
        type: string
        value: number
        threshold: number
    }>
}

interface WebSocketMessage {
    type: 'connection_established' | 'telemetry_update' | 'alert_notification'
    channel?: string
    data?: TelemetryData | AlertData
    message?: string
    timestamp: string
}

interface WebSocketContextType {
    isConnected: boolean
    latestTelemetry: TelemetryData | null
    alerts: AlertData[]
    error: string | null
    reconnect: () => void
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

// Función para mapear alert_type a severidad
const mapAlertTypeToSeverity = (alertType: string): 'CRITICAL' | 'WARNING' | 'INFO' => {
    const criticalTypes = [
        'HIGH_GPU_TEMP',
        'HIGH_MEMORY_TEMP', 
        'HIGH_HOTSPOT_TEMPERATURE',
        'HIGH_MEMORY_TEMPERATURE',
        'HIGH_TEMPERATURE'
    ]
    
    const warningTypes = [
        'HIGH_POWER_CONSUMPTION',
        'HIGH_POWER',
        'FAN_MAX_SPEED',
        'SUSTAINED_HIGH_LOAD'
    ]
    
    if (criticalTypes.includes(alertType)) {
        return 'CRITICAL'
    } else if (warningTypes.includes(alertType)) {
        return 'WARNING'
    } else {
        return 'INFO'
    }
}

export function WebSocketProvider({ children }: { children: ReactNode }) {
    const [ws, setWs] = useState<WebSocket | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [latestTelemetry, setLatestTelemetry] = useState<TelemetryData | null>(null)
    const [alerts, setAlerts] = useState<AlertData[]>([])
    const [error, setError] = useState<string | null>(null)

    const connect = useCallback(() => {
        try {
            const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8081'
            const websocket = new WebSocket(wsUrl)

            websocket.onopen = () => {
                console.log('✅ WebSocket connected')
                setIsConnected(true)
                setError(null)
            }

            websocket.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data)
                    console.log('📨 WebSocket message received:', message.type)

                    switch (message.type) {
                        case 'connection_established':
                            console.log('🔌', message.message)
                            break

                        case 'telemetry_update':
                            if (message.data) {
                                setLatestTelemetry(message.data as TelemetryData)
                            }
                            break

                        case 'alert_notification':
                            if (message.data) {
                                const rawAlert = message.data as unknown as Record<string, unknown>
                                console.log('📥 Raw alert received:', rawAlert)

                                // Procesar alerta con severidad corregida
                                const processedAlert: AlertData = {
                                    id: (rawAlert.id as number) || Date.now(),
                                    gpu_uuid: (rawAlert.gpu_uuid as string) || 'unknown',
                                    rig_name: (rawAlert.rig_name as string) || 'Unknown',
                                    message: (rawAlert.message as string) || 'Alert triggered',
                                    triggered_at: (rawAlert.triggered_at as string) || message.timestamp,
                                    alert_type: rawAlert.alert_type as string,
                                    triggered_value: rawAlert.triggered_value as number,
                                    threshold_value: rawAlert.threshold_value as number,
                                    severity: rawAlert.alert_type 
                                        ? mapAlertTypeToSeverity(rawAlert.alert_type as string)
                                        : ((rawAlert.severity as 'CRITICAL' | 'WARNING' | 'INFO') || 'INFO'),
                                    alerts: (rawAlert.alerts as Array<{type: string; value: number; threshold: number}>) || []
                                }

                                console.log('🔄 Processed alert with corrected severity:', processedAlert)
                                
                                setAlerts(prev => {
                                    const newAlerts = [processedAlert, ...prev].slice(0, 50)
                                    return newAlerts
                                })
                            }
                            break
                    }
                } catch (err) {
                    console.error('❌ Error parsing WebSocket message:', err)
                    setError('Error parsing message')
                }
            }

            websocket.onerror = (event) => {
                console.error('❌ WebSocket error:', event)
                setError('WebSocket connection error')
            }

            websocket.onclose = () => {
                console.log('🔌 WebSocket disconnected')
                setIsConnected(false)

                setTimeout(() => {
                    console.log('🔄 Attempting to reconnect...')
                    connect()
                }, 5000)
            }

            setWs(websocket)
            return websocket
        } catch (err) {
            console.error('❌ Failed to create WebSocket:', err)
            setError('Failed to establish WebSocket connection')
            return null
        }
    }, [])

    useEffect(() => {
        const websocket = connect()
        return () => {
            if (websocket) {
                websocket.close()
            }
        }
    }, [connect])

    const reconnect = useCallback(() => {
        if (ws) {
            ws.close()
        }
        connect()
    }, [ws, connect])

    return (
        <WebSocketContext.Provider
            value={{
                isConnected,
                latestTelemetry,
                alerts,
                error,
                reconnect
            }}
        >
            {children}
        </WebSocketContext.Provider>
    )
}

export function useWebSocket() {
    const context = useContext(WebSocketContext)
    if (context === undefined) {
        throw new Error('useWebSocket must be used within a WebSocketProvider')
    }
    return context
}