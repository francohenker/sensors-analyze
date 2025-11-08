"use client"

import { Activity, Bell, Home } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function DashboardHeader() {
    const pathname = usePathname()
    
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
