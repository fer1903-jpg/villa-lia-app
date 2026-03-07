"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { supabase } from "../../../../lib/supabase";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "../../../../lib/mapConfig";
import HeatmapLayer from "../../../../components/HeatmapLayer";
import AutoFitBounds from "../../../../components/AutoFitBounds";

type Reporte = {
  id: string;
  lat: number | null;
  lng: number | null;
  tipo: string | null;
  estado: string | null;
  created_at: string | null;
};

type PeriodoFiltro = "24h" | "7d" | "30d" | "todo";
type EstadoFiltro = "todos" | "pendiente" | "resuelto";
type TipoFiltro =
  | "todos"
  | "robo"
  | "accidente"
  | "iluminacion"
  | "vandalismo"
  | "otro";

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
      <div style={{ marginTop: 10, fontSize: 28, fontWeight: 800, color: "#10212b" }}>
        {value}
      </div>
    </div>
  );
}

function normalizarTipo(tipo: string | null): TipoFiltro {
  const t = (tipo || "").toLowerCase();

  if (t === "robo") return "robo";
  if (t === "accidente") return "accidente";
  if (t === "iluminación" || t === "iluminacion") return "iluminacion";
  if (t === "vandalismo") return "vandalismo";
  return "otro";
}

function coincidePeriodo(createdAt: string | null, periodo: PeriodoFiltro) {
  if (!createdAt) return false;
  if (periodo === "todo") return true;

  const fecha = new Date(createdAt).getTime();
  const ahora = Date.now();
  const diffMs = ahora - fecha;

  if (periodo === "24h") return diffMs <= 24 * 60 * 60 * 1000;
  if (periodo === "7d") return diffMs <= 7 * 24 * 60 * 60 * 1000;
  if (periodo === "30d") return diffMs <= 30 * 24 * 60 * 60 * 1000;

  return true;
}

export default function ModeracionMapaCalorPage() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [periodo, setPeriodo] = useState<PeriodoFiltro>("todo");
  const [estado, setEstado] = useState<EstadoFiltro>("todos");
  const [tipo, setTipo] = useState<TipoFiltro>("todos");

  useEffect(() => {
    async function cargar() {
      setLoading(true);
      setMsg("");

      const { data, error } = await supabase
        .from("reportes")
        .select("id, lat, lng, tipo, estado, created_at")
        .not("lat", "is", null)
        .not("lng", "is", null)
        .order("created_at", { ascending: false });

      setLoading(false);

      if (error) {
        setMsg("Error al cargar mapa de calor: " + error.message);
        return;
      }

      setReportes((data as Reporte[]) || []);
    }

    cargar();
  }, []);

  const reportesFiltrados = useMemo(() => {
    return reportes.filter((r) => {
      const okPeriodo = coincidePeriodo(r.created_at, periodo);
      const okEstado = estado === "todos" ? true : r.estado === estado;
      const tipoNormalizado = normalizarTipo(r.tipo);
      const okTipo = tipo === "todos" ? true : tipoNormalizado === tipo;

      return okPeriodo && okEstado && okTipo;
    });
  }, [reportes, periodo, estado, tipo]);

  const heatPoints = useMemo(() => {
    return reportesFiltrados
      .filter((r) => r.lat != null && r.lng != null)
      .map((r) => [r.lat as number, r.lng as number, 1] as [number, number, number]);
  }, [reportesFiltrados]);

  const pendientes = useMemo(
    () => reportesFiltrados.filter((r) => r.estado === "pendiente").length,
    [reportesFiltrados]
  );

  const resueltos = useMemo(
    () => reportesFiltrados.filter((r) => r.estado === "resuelto").length,
    [reportesFiltrados]
  );

  const tileUrl =
    process.env.NEXT_PUBLIC_TILE_URL ||
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  return (
    <div style={{ fontFamily: "Arial, sans-serif" }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: 34, color: "#10212b" }}>Mapa de calor</h1>
        <p style={{ marginTop: 8, color: "#4b5b66" }}>
          Concentración de incidentes geolocalizados en Villa Lía.
        </p>
      </div>

      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          padding: 18,
          boxShadow: "0 8px 22px rgba(0,0,0,0.08)",
          marginBottom: 18,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#4b5b66", marginBottom: 6 }}>
              Período
            </div>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as PeriodoFiltro)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #cfd8df",
                fontSize: 14,
              }}
            >
              <option value="24h">Últimas 24 horas</option>
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="todo">Todo el histórico</option>
            </select>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#4b5b66", marginBottom: 6 }}>
              Estado
            </div>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoFiltro)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #cfd8df",
                fontSize: 14,
              }}
            >
              <option value="todos">Todos</option>
              <option value="pendiente">Pendientes</option>
              <option value="resuelto">Resueltos</option>
            </select>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#4b5b66", marginBottom: 6 }}>
              Tipo
            </div>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoFiltro)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #cfd8df",
                fontSize: 14,
              }}
            >
              <option value="todos">Todos</option>
              <option value="robo">Robo</option>
              <option value="accidente">Accidente</option>
              <option value="iluminacion">Iluminación</option>
              <option value="vandalismo">Vandalismo</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "end",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setPeriodo("todo");
                setEstado("todos");
                setTipo("todos");
              }}
              style={{
                width: "100%",
                border: "none",
                background: "#eef3f7",
                color: "#35505f",
                borderRadius: 10,
                padding: "10px 12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
          marginBottom: 22,
        }}
      >
        <StatCard
          label="Puntos geolocalizados"
          value={reportesFiltrados.length}
          color="#0f5c7a"
        />
        <StatCard label="Pendientes" value={pendientes} color="#ef6c00" />
        <StatCard label="Resueltos" value={resueltos} color="#2e7d32" />
      </div>

      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          padding: 20,
          boxShadow: "0 8px 22px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            marginBottom: 14,
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0, color: "#10212b" }}>Concentración territorial</h2>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
              fontSize: 13,
              fontWeight: 700,
              color: "#31424d",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: "#64b5f6",
                  display: "inline-block",
                }}
              />
              Baja
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: "#ffd54f",
                  display: "inline-block",
                }}
              />
              Media
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: "#c62828",
                  display: "inline-block",
                }}
              />
              Alta
            </span>
          </div>
        </div>

        {loading ? (
          <p style={{ color: "#4b5b66" }}>Cargando mapa...</p>
        ) : heatPoints.length === 0 ? (
          <p style={{ color: "#4b5b66" }}>
            No hay datos suficientes para generar el mapa de calor con esos filtros.
          </p>
        ) : (
          <div
            style={{
              height: "72vh",
              width: "100%",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <MapContainer
              center={DEFAULT_MAP_CENTER}
              zoom={DEFAULT_MAP_ZOOM}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer url={tileUrl} />
<AutoFitBounds
  points={reportesFiltrados
    .filter((r) => r.lat != null && r.lng != null)
    .map((r) => ({ lat: r.lat as number, lng: r.lng as number }))}
  mode="always"
/>
              <HeatmapLayer points={heatPoints} />
            </MapContainer>
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