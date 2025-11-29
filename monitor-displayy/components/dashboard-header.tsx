"use client"

import { Activity, Bell, Home, Lightbulb } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useGPU } from "@/contexts/gpu-context"
import { useMemo } from "react"

export function DashboardHeader() {
    const pathname = usePathname()
    const { gpus } = useGPU()
    
    // Contar recomendaciones totales
    const recommendationsCount = useMemo(() => {
        return gpus.reduce((total, gpu) => total + (gpu.recommendations?.length || 0), 0)
    }, [gpus])

    // Contar recomendaciones de alta prioridad
    const highPriorityCount = useMemo(() => {
        return gpus.reduce((total, gpu) => {
            const highPriority = gpu.recommendations?.filter(rec => rec.priority === 'high').length || 0
            return total + highPriority
        }, 0)
    }, [gpus])
    
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
                    
                    <div className="flex items-center gap-4">
                        {/* Navigation */}
                        <nav className="flex items-center gap-2">
                            <Link 
                                href="/"
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                    pathname === "/" 
                                        ? "bg-accent text-accent-foreground" 
                                        : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                                )}
                            >
                                <Home className="w-4 h-4" />
                                Dashboard
                            </Link>
                            <Link 
                                href="/alerts"
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                    pathname === "/alerts" 
                                        ? "bg-accent text-accent-foreground" 
                                        : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                                )}
                            >
                                <Bell className="w-4 h-4" />
                                Alertas
                            </Link>
                            <Link 
                                href="/recommendations"
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors relative",
                                    pathname === "/recommendations" 
                                        ? "bg-accent text-accent-foreground" 
                                        : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                                )}
                            >
                                <Lightbulb className="w-4 h-4" />
                                Recomendaciones
                                {recommendationsCount > 0 && (
                                    <span className={cn(
                                        "ml-1 px-2 py-0.5 text-xs font-bold rounded-full",
                                        highPriorityCount > 0 
                                            ? "bg-red-500/20 text-red-400 border border-red-500/50"
                                            : "bg-blue-500/20 text-blue-400 border border-blue-500/50"
                                    )}>
                                        {recommendationsCount}
                                    </span>
                                )}
                            </Link>
                        </nav>
                        
                        {/* Connection Status */}
                        <div className="flex items-center gap-2 pl-4 border-l border-border">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-muted-foreground">Conectado</span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}
