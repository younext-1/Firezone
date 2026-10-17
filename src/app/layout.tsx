import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import 'maplibre-gl/dist/maplibre-gl.css';

export const metadata: Metadata = {
  title: "IGNIS-MA | NASA Multi-Sensor Wildfire Intelligence",
  description: "Real-time NASA Earth Observation Ingestion & Geospatial Telemetry Dashboard for Moroccan Wildfire Vulnerability",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-slate-950 text-slate-100 flex flex-col">{children}</body>
    </html>
  );
}
