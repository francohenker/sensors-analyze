"use client"

import dynamic from 'next/dynamic'

const MiningDashboard = dynamic(
  () => import('@/components/mining-dashboard').then((mod) => mod.MiningDashboard),
  { ssr: false }
)

export default function Home() {
  return <MiningDashboard />
}