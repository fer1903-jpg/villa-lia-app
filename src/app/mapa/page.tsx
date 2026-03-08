"use client";

import { useEffect, useState } from "react";
import AppHeader from "../../components/AppHeader";
import dynamic from "next/dynamic";
import { supabase } from "../../lib/supabase";

const MapView = dynamic(() => import("../../components/MapView"), { ssr: false });

type Reporte = {
  id: string;
  tipo: string | null;
  descripcion: string | null;
  lat: number;
  lng: number;
  estado: string | null;
  created_at: string | null;
  imagen_url: string | null;
};

export default function MapaPage() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [live, setLive] = useState(false);

  useEffect(() => {
    cargarReportes();

    const channel = supabase
      .channel("reportes-mapa")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reportes",
        },
        () => {
          cargarReportes();
        }
      )
      .subscribe((status) => {
        setLive(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function cargarReportes() {
    const { data } = await supabase
      .from("reportes")
      .select("*")
      .order("created_at", { ascending: false });

    setReportes(data || []);
  }

  const pendientes = reportes.filter((r) => r.estado === "pendiente").length;
  const resueltos = reportes.filter((r) => r.estado === "resuelto").length;

  return (
    <main>
      <AppHeader />

      <section style={{ padding: 20 }}>
        <h1
          style={{
            marginTop: 0,
            marginBottom: 10,
            fontSize: 48,
            fontWeight: 500,
            color: "#14232d",
          }}
        >
          Mapa de incidentes
        </h1>

        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              background: live ? "#e8f5e9" : "#fff3e0",
              color: live ? "#1b5e20" : "#a15c00",
              borderRadius: 999,
              padding: "8px 14px",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {live ? "En vivo" : "Reconectando"}
          </span>

          <span
            style={{
              background: "#f4f6f8",
              borderRadius: 999,
              padding: "8px 14px",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            Pendientes: {pendientes}
          </span>

          <span
            style={{
              background: "#f4f6f8",
              borderRadius: 999,
              padding: "8px 14px",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            Resueltos: {resueltos}
          </span>
        </div>

        <MapView />
      </section>
    </main>
  );
}