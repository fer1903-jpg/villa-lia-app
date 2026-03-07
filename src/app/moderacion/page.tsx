"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Reporte = {
  id: string;
  tipo: string | null;
  descripcion: string | null;
  estado: string | null;
  created_at: string | null;
};

function Card({
  title,
  value,
  color,
}: {
  title: string;
  value: string | number;
  color: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 8px 22px rgba(0,0,0,0.08)",
        borderTop: `5px solid ${color}`,
      }}
    >
      <div style={{ color: "#4b5b66", fontSize: 14, fontWeight: 700 }}>{title}</div>
      <div style={{ marginTop: 10, fontSize: 32, fontWeight: 800, color: "#10212b" }}>
        {value}
      </div>
    </div>
  );
}

export default function ModeracionInicioPage() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    async function cargar() {
      const { data, error } = await supabase
        .from("reportes")
        .select("id, tipo, descripcion, estado, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        setMsg("Error al cargar reportes: " + error.message);
        return;
      }

      setReportes((data as Reporte[]) || []);
    }

    cargar();
  }, []);

  const resumen = useMemo(() => {
    const ahora = new Date();
    const hace7 = new Date();
    hace7.setDate(ahora.getDate() - 7);

    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

    return {
      total: reportes.length,
      pendientes: reportes.filter((r) => r.estado === "pendiente").length,
      resueltos: reportes.filter((r) => r.estado === "resuelto").length,
      ultimos7: reportes.filter((r) => {
        if (!r.created_at) return false;
        return new Date(r.created_at) >= hace7;
      }).length,
      mesActual: reportes.filter((r) => {
        if (!r.created_at) return false;
        return new Date(r.created_at) >= inicioMes;
      }).length,
    };
  }, [reportes]);

  const ultimos = reportes.slice(0, 8);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 34, color: "#10212b" }}>Inicio</h1>
        <p style={{ marginTop: 8, color: "#4b5b66" }}>
          Resumen operativo general de incidentes.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <Card title="Total de incidentes" value={resumen.total} color="#0f5c7a" />
        <Card title="Pendientes" value={resumen.pendientes} color="#c62828" />
        <Card title="Resueltos" value={resumen.resueltos} color="#2e7d32" />
        <Card title="Últimos 7 días" value={resumen.ultimos7} color="#ef6c00" />
        <Card title="Mes actual" value={resumen.mesActual} color="#6a1b9a" />
      </div>

      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          padding: 20,
          boxShadow: "0 8px 22px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ marginTop: 0, color: "#10212b" }}>Últimos incidentes</h2>

        {ultimos.length === 0 ? (
          <p style={{ color: "#4b5b66" }}>No hay incidentes cargados todavía.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {ultimos.map((r) => (
              <div
                key={r.id}
                style={{
                  border: "1px solid #e5eaee",
                  borderRadius: 12,
                  padding: 14,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: "#10212b" }}>
                    {r.tipo || "Sin tipo"}
                  </div>
                  <div style={{ color: "#4b5b66", marginTop: 4 }}>
                    {r.descripcion || "Sin descripción"}
                  </div>
                </div>

                <div style={{ textAlign: "right", minWidth: 140 }}>
                  <div
                    style={{
                      display: "inline-block",
                      background: r.estado === "resuelto" ? "#e8f5e9" : "#fff3e0",
                      color: r.estado === "resuelto" ? "#1b5e20" : "#a15c00",
                      borderRadius: 999,
                      padding: "6px 10px",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {r.estado || "pendiente"}
                  </div>

                  <div style={{ marginTop: 8, color: "#60707a", fontSize: 12 }}>
                    {r.created_at ? new Date(r.created_at).toLocaleString() : "-"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {msg && (
        <div
          style={{
            marginTop: 16,
            background: "#fff5f5",
            color: "#8a1f1f",
            padding: 12,
            borderRadius: 10,
          }}
        >
          {msg}
        </div>
      )}
    </div>
  );
}