"use client";

import dynamic from "next/dynamic";
import AppHeader from "../../components/AppHeader";

const MapView = dynamic(() => import("../../components/MapView"), { ssr: false });

export default function MapaPage() {
  return (
    <main>
      <AppHeader />

      <section style={{ padding: 16 }}>
        <h1 style={{ marginTop: 0 }}>Mapa de incidentes</h1>
        <MapView />
      </section>
    </main>
  );
}