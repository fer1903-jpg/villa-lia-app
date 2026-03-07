"use client";

import dynamic from "next/dynamic";
import AppHeader from "../../components/AppHeader";

const MapView = dynamic(() => import("../../components/MapView"), { ssr: false });

export default function MapaPage() {
  return (
    <main
      style={{
        background: "#f4f6f8",
        minHeight: "100vh",
      }}
    >
      <AppHeader />

      <section
        style={{
          padding: 20,
          background: "#f4f6f8",
        }}
      >
        <h1
          style={{
            marginTop: 0,
            marginBottom: 18,
            fontSize: 56,
            lineHeight: 1.05,
            fontWeight: 500,
            color: "#14232d",
          }}
        >
          Mapa de incidentes
        </h1>

        <MapView />
      </section>
    </main>
  );
}