"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Reporte = {
  id: string;
  tipo: string | null;
  estado: string | null;
  created_at: string | null;
};

type TipoKey = "Robo" | "Accidente" | "Iluminación" | "Vandalismo" | "Otro";

type TipoStats = {
  total: number;
  pendientes: number;
  resueltos: number;
};

function getNormalizedTipo(tipo: string | null): TipoKey {
  const t = (tipo || "").toLowerCase();

  if (t === "robo") return "Robo";
  if (t === "accidente") return "Accidente";
  if (t === "iluminación" || t === "iluminacion") return "Iluminación";
  if (t === "vandalismo") return "Vandalismo";
  return "Otro";
}

function getTipoColor(tipo: TipoKey) {
  if (tipo === "Robo") return "#ff3b30";
  if (tipo === "Accidente") return "#9e9e9e";
  if (tipo === "Iluminación") return "#64b5f6";
  if (tipo === "Vandalismo") return "#ffd54f";
  return "#8d6e63";
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 16,
        padding: 18,
        boxShadow: "0 8px 22px rgba(0,0,0,0.08)",
        borderTop: `5px solid ${color}`,
      }}
    >
      <div style={{ color: "#4b5b66", fontSize: 13, fontWeight: 700 }}>{label}</div>
      <div style={{ marginTop: 10, fontSize: 30, fontWeight: 800, color: "#10212b" }}>
        {value}
      </div>
    </div>
  );
}

export default function ModeracionTiposPage() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    async function cargar() {
      setLoading(true);
      setMsg("");

      const { data, error } = await supabase
        .from("reportes")
        .select("id, tipo, estado, created_at")
        .order("created_at", { ascending: false });

      setLoading(false);

      if (error) {
        setMsg("Error al cargar tipos: " + error.message);
        return;
      }

      setReportes((data as Reporte[]) || []);
    }

    cargar();
  }, []);

  const stats = useMemo(() => {
    const base: Record<TipoKey, TipoStats> = {
      Robo: { total: 0, pendientes: 0, resueltos: 0 },
      Accidente: { total: 0, pendientes: 0, resueltos: 0 },
      Iluminación: { total: 0, pendientes: 0, resueltos: 0 },
      Vandalismo: { total: 0, pendientes: 0, resueltos: 0 },
      Otro: { total: 0, pendientes: 0, resueltos: 0 },
    };

    reportes.forEach((r) => {
      const key = getNormalizedTipo(r.tipo);
      base[key].total += 1;

      if (r.estado === "resuelto") {
        base[key].resueltos += 1;
      } else {
        base[key].pendientes += 1;
      }
    });

    return base;
  }, [reportes]);

  const totalGeneral = reportes.length;

  const orderedTipos = useMemo(() => {
    return (Object.entries(stats) as [TipoKey, TipoStats][])
      .sort((a, b) => b[1].total - a[1].total);
  }, [stats]);

  const tipoMasReportado = orderedTipos[0]?.[0] || "-";
  const cantidadMasReportada = orderedTipos[0]?.[1].total || 0;

  return (
    <div style={{ fontFamily: "Arial, sans-serif" }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: 34, color: "#10212b" }}>Tipos</h1>
        <p style={{ marginTop: 8, color: "#4b5b66" }}>
          Distribución de incidentes por categoría y estado.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
          marginBottom: 22,
        }}
      >
        <StatCard label="Total general" value={totalGeneral} color="#0f5c7a" />
        <StatCard label="Tipo más reportado" value={tipoMasReportado} color="#6a1b9a" />
        <StatCard label="Cantidad del tipo líder" value={cantidadMasReportada} color="#ef6c00" />
      </div>

      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          padding: 20,
          boxShadow: "0 8px 22px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ marginTop: 0, color: "#10212b" }}>Resumen por tipo</h2>

        {loading ? (
          <p style={{ color: "#4b5b66" }}>Cargando...</p>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {orderedTipos.map(([tipo, data]) => {
              const porcentaje =
                totalGeneral > 0 ? ((data.total / totalGeneral) * 100).toFixed(1) : "0.0";

              return (
                <div
                  key={tipo}
                  style={{
                    border: "1px solid #e5eaee",
                    borderRadius: 14,
                    padding: 16,
                    display: "grid",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          background: getTipoColor(tipo),
                          display: "inline-block",
                        }}
                      />
                      <span style={{ fontSize: 18, fontWeight: 800, color: "#10212b" }}>
                        {tipo}
                      </span>
                    </div>

                    <div
                      style={{
                        background: "#f4f6f8",
                        color: "#31424d",
                        borderRadius: 999,
                        padding: "6px 10px",
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {porcentaje}% del total
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        background: "#f9fbfc",
                        borderRadius: 12,
                        padding: 12,
                      }}
                    >
                      <div style={{ color: "#60707a", fontSize: 12, fontWeight: 700 }}>Total</div>
                      <div style={{ marginTop: 6, fontSize: 24, fontWeight: 800, color: "#10212b" }}>
                        {data.total}
                      </div>
                    </div>

                    <div
                      style={{
                        background: "#fff8ef",
                        borderRadius: 12,
                        padding: 12,
                      }}
                    >
                      <div style={{ color: "#a15c00", fontSize: 12, fontWeight: 700 }}>
                        Pendientes
                      </div>
                      <div style={{ marginTop: 6, fontSize: 24, fontWeight: 800, color: "#10212b" }}>
                        {data.pendientes}
                      </div>
                    </div>

                    <div
                      style={{
                        background: "#eef8ef",
                        borderRadius: 12,
                        padding: 12,
                      }}
                    >
                      <div style={{ color: "#1b5e20", fontSize: 12, fontWeight: 700 }}>
                        Resueltos
                      </div>
                      <div style={{ marginTop: 6, fontSize: 24, fontWeight: 800, color: "#10212b" }}>
                        {data.resueltos}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
            boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
          }}
        >
          {msg}
        </div>
      )}
    </div>
  );
}