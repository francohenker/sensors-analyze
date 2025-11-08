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

interface AlertData {
    id: number
    gpu_id: number
    gpu_uuid: string
    rig_name: string
    severity: 'CRITICAL' | 'WARNING' | 'INFO'
    message: string
    triggered_at: string
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

export function WebSocketProvider({ children }: { children: ReactNode }) {
    const [ws, setWs] = useState<WebSocket | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [latestTelemetry, setLatestTelemetry] = useState<TelemetryData | null>(null)
    const [alerts, setAlerts] = useState<AlertData[]>([])
    const [error, setError] = useState<string | null>(null)

    const connect = useCallback(() => {
        try {
            // Ajusta la URL según tu configuración
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
                                const alert = message.data as AlertData
                                setAlerts(prev => [alert, ...prev].slice(0, 50)) // Keep last 50 alerts
                            }
                            break
                    }
                } catch (err) {
                    console.error('❌ Error parsing WebSocket message:', err)
                }
            }

            websocket.onerror = (event) => {
                console.error('❌ WebSocket error:', event)
                setError('WebSocket connection error')
            }

            websocket.onclose = () => {
                console.log('🔌 WebSocket disconnected')
                setIsConnected(false)

                // Reconnect after 5 seconds
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
