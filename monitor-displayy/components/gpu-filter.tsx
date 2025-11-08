"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter } from "lucide-react"

export type SortOption = "default" | "critical-first" | "healthy-first" | "temp-high" | "temp-low"

interface GPUFilterProps {
    sortBy: SortOption
    onSortChange: (value: SortOption) => void
}

export function GPUFilter({ sortBy, onSortChange }: GPUFilterProps) {
    return (
        <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span className="font-medium">Ordenar por:</span>
            </div>
            <Select value={sortBy} onValueChange={onSortChange}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Seleccionar orden" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="default">Orden predeterminado</SelectItem>
                    <SelectItem value="critical-first">🔴 Críticas primero</SelectItem>
                    <SelectItem value="healthy-first">🟢 Saludables primero</SelectItem>
                    <SelectItem value="temp-high">🌡️ Temperatura alta</SelectItem>
                    <SelectItem value="temp-low">❄️ Temperatura baja</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}
