"use client"

import { useWebSocket } from "@/contexts/websocket-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function TelemetryMonitor() {
  const { isConnected, latestTelemetry, alerts, error, reconnect } = useWebSocket()

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            WebSocket Status
            {isConnected ? (
              <Badge variant="default" className="bg-green-500">Connected</Badge>
            ) : (
              <Badge variant="destructive">Disconnected</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-2">
              <p className="text-sm text-red-500">{error}</p>
              <button onClick={reconnect} className="text-sm text-blue-500 hover:underline">
                Reconnect
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Latest Telemetry */}
      {latestTelemetry && (
        <Card>
          <CardHeader>
            <CardTitle>Latest Telemetry - {latestTelemetry.rig_name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">GPU Temp</p>
                <p className="text-2xl font-bold">{latestTelemetry.gpu_temp_celsius}°C</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hotspot</p>
                <p className="text-2xl font-bold">{latestTelemetry.hotspot_temp_celsius}°C</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Memory</p>
                <p className="text-2xl font-bold">{latestTelemetry.memory_temp_celsius}°C</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Power</p>
                <p className="text-2xl font-bold">{latestTelemetry.power_draw_watt}W</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Load</p>
                <p className="text-2xl font-bold">{latestTelemetry.load_percentage}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fan Speed</p>
                <p className="text-2xl font-bold">{latestTelemetry.fan_speed_percentage}%</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-muted-foreground">
                Last update: {new Date(latestTelemetry.timestamp).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                GPU: {latestTelemetry.model} ({latestTelemetry.gpu_uuid})
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts ({alerts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {alerts.slice(0, 10).map((alert, index) => (
                <div key={`${alert.id}-${index}`} className="flex items-start justify-between p-3 border rounded hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        variant={
                          alert.severity === 'CRITICAL' ? 'destructive' : 
                          alert.severity === 'WARNING' ? 'default' : 
                          'secondary'
                        }
                      >
                        {alert.severity}
                      </Badge>
                      <span className="text-sm font-medium">{alert.rig_name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                    {new Date(alert.triggered_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
