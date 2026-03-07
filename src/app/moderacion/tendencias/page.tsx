"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Reporte = {
  id: string;
  created_at: string | null;
  tipo: string | null;
  estado: string | null;
};

type DayBucket = {
  label: string;
  key: string;
  total: number;
};

function formatDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatShortLabel(date: Date) {
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function buildBuckets(days: number, reportes: Reporte[]) {
  const today = new Date();
  const buckets: DayBucket[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(today.getDate() - i);

    const key = formatDateKey(d);

    buckets.push({
      key,
      label: formatShortLabel(d),
      total: 0,
    });
  }

  reportes.forEach((r) => {
    if (!r.created_at) return;
    const d = new Date(r.created_at);
    const key = formatDateKey(d);
    const bucket = buckets.find((b) => b.key === key);
    if (bucket) {
      bucket.total += 1;
    }
  });

  return buckets;
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

function BarsCard({
  title,
  buckets,
  color,
}: {
  title: string;
  buckets: DayBucket[];
  color: string;
}) {
  const max = Math.max(...buckets.map((b) => b.total), 1);

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 8px 22px rgba(0,0,0,0.08)",
      }}
    >
      <h2 style={{ marginTop: 0, color: "#10212b", fontSize: 22 }}>{title}</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${buckets.length}, minmax(20px, 1fr))`,
          gap: 8,
          alignItems: "end",
          minHeight: 220,
          marginTop: 18,
        }}
      >
        {buckets.map((b) => {
          const h = (b.total / max) * 160;

          return (
            <div
              key={b.key}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "end",
                gap: 8,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#31424d",
                }}
              >
                {b.total}
              </div>

              <div
                style={{
                  width: "100%",
                  maxWidth: 28,
                  height: `${Math.max(h, b.total > 0 ? 10 : 2)}px`,
                  background: color,
                  borderRadius: 8,
                  boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                }}
              />

              <div
                style={{
                  fontSize: 11,
                  color: "#60707a",
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                  minHeight: 48,
                }}
              >
                {b.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ModeracionTendenciasPage() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    async function cargar() {
      setLoading(true);
      setMsg("");

      const { data, error } = await supabase
        .from("reportes")
        .select("id, created_at, tipo, estado")
        .order("created_at", { ascending: false });

      setLoading(false);

      if (error) {
        setMsg("Error al cargar tendencias: " + error.message);
        return;
      }

      setReportes((data as Reporte[]) || []);
    }

    cargar();
  }, []);

  const resumen = useMemo(() => {
    const now = new Date();

    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);

    const start7 = new Date();
    start7.setHours(0, 0, 0, 0);
    start7.setDate(now.getDate() - 6);

    const start30 = new Date();
    start30.setHours(0, 0, 0, 0);
    start30.setDate(now.getDate() - 29);

    const hoy = reportes.filter((r) => r.created_at && new Date(r.created_at) >= startToday).length;
    const ultimos7 = reportes.filter((r) => r.created_at && new Date(r.created_at) >= start7).length;
    const ultimos30 = reportes.filter((r) => r.created_at && new Date(r.created_at) >= start30).length;

    return { hoy, ultimos7, ultimos30 };
  }, [reportes]);

  const buckets7 = useMemo(() => buildBuckets(7, reportes), [reportes]);
  const buckets30 = useMemo(() => buildBuckets(30, reportes), [reportes]);

  const pico7 = useMemo(() => {
    const top = [...buckets7].sort((a, b) => b.total - a.total)[0];
    return top ? `${top.label} (${top.total})` : "-";
  }, [buckets7]);

  const pico30 = useMemo(() => {
    const top = [...buckets30].sort((a, b) => b.total - a.total)[0];
    return top ? `${top.label} (${top.total})` : "-";
  }, [buckets30]);

  return (
    <div style={{ fontFamily: "Arial, sans-serif" }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: 34, color: "#10212b" }}>Tendencias</h1>
        <p style={{ marginTop: 8, color: "#4b5b66" }}>
          Evolución temporal de incidentes reportados.
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
        <StatCard label="Incidentes hoy" value={resumen.hoy} color="#0f5c7a" />
        <StatCard label="Últimos 7 días" value={resumen.ultimos7} color="#ef6c00" />
        <StatCard label="Últimos 30 días" value={resumen.ultimos30} color="#6a1b9a" />
        <StatCard label="Pico últimos 7 días" value={pico7} color="#2e7d32" />
        <StatCard label="Pico últimos 30 días" value={pico30} color="#c62828" />
      </div>

      {loading ? (
        <div
          style={{
            background: "#ffffff",
            borderRadius: 16,
            padding: 20,
            boxShadow: "0 8px 22px rgba(0,0,0,0.08)",
            color: "#4b5b66",
          }}
        >
          Cargando tendencias...
        </div>
      ) : (
        <div style={{ display: "grid", gap: 18 }}>
          <BarsCard title="Últimos 7 días" buckets={buckets7} color="#0f5c7a" />
          <BarsCard title="Últimos 30 días" buckets={buckets30} color="#64b5f6" />
        </div>
      )}

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