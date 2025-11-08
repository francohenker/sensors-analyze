"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { AlertList } from "../../components/alert-list"

export default function AlertsPage() {
    return (
        <div className="min-h-screen bg-background">
            <DashboardHeader />
            <main className="px-4 py-8 md:px-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-foreground">Sistema de Alertas</h1>
                    <p className="text-muted-foreground mt-2">
                        Monitoreo en tiempo real de alertas críticas y advertencias del sistema
                    </p>
                </div>
                <AlertList />
            </main>
        </div>
    )
}
