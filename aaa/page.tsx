"use client"

import { useEffect, useState } from "react"
import { MiningDashboard } from "@/components/mining-dashboard"
import { GPUProvider } from "@/contexts/gpu-context"

export default function Home() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Cargando...</div>
      </div>
    )
  }

  return (
    <GPUProvider>
      <MiningDashboard />
    </GPUProvider>
  )
}
