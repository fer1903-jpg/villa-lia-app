"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("../../components/MapView"), { ssr: false });

export default function MapaPage() {
  return (
    <main style={{ padding: 16 }}>
      <h1>Mapa</h1>
      <MapView />
    </main>
  );
}