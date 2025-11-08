import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GPUProvider } from "@/contexts/gpu-context";
import { WebSocketProvider } from "@/contexts/websocket-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mining Monitor - Dashboard",
  description: "Sistema de monitoreo en tiempo real para rigs de minería GPU",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WebSocketProvider>
          <GPUProvider>
            {children}
          </GPUProvider>
        </WebSocketProvider>
      </body>
    </html>
  );
}
