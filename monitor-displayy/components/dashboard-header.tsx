"use client"

import { Activity } from "lucide-react"

export function DashboardHeader() {
    return (
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="px-4 py-6 md:px-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent rounded-lg">
                            <Activity className="w-6 h-6 text-accent-foreground" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Mining Monitor</h1>
                            <p className="text-sm text-muted-foreground">Monitoreo en tiempo real de rigs de minería</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-muted-foreground">Conectado</span>
                    </div>
                </div>
            </div>
        </header>
    )
}
