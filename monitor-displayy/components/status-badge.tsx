"use client"

import { Badge } from "@/components/ui/badge"

interface StatusBadgeProps {
    status: "healthy" | "warning" | "critical"
}

export function StatusBadge({ status }: StatusBadgeProps) {
    const variants = {
        healthy: "bg-green-900/40 text-green-200 border-green-500/30",
        warning: "bg-yellow-900/40 text-yellow-200 border-yellow-500/30",
        critical: "bg-red-900/40 text-red-200 border-red-500/30",
    }

    const labels = {
        healthy: "Saludable",
        warning: "Advertencia",
        critical: "Crítico",
    }

    return (
        <Badge variant="outline" className={`${variants[status]} font-medium text-xs`}>
            {labels[status]}
        </Badge>
    )
}
