"use client"

import dynamic from 'next/dynamic'
import { GPUProvider } from "@/contexts/gpu-context"
import { WebSocketProvider } from "@/contexts/websocket-context"

const MiningDashboard = dynamic(
  () => import('@/components/mining-dashboard').then((mod) => mod.MiningDashboard),
  { ssr: false }
)

export default function Home() {
  return (
    <WebSocketProvider>
      <GPUProvider>
        <MiningDashboard />
      </GPUProvider>
    </WebSocketProvider>
  )
}