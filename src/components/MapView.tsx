"use client";

import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useMemo, useState, Fragment } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { supabase } from "../lib/supabase";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "../lib/mapConfig";
import FloatingReportButton from "./FloatingReportButton";

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

function LegendItem({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 13,
        color: "#10212b",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: color,
          display: "inline-block",
          border: "1px solid rgba(0,0,0,0.12)",
        }}
      />
      <span>{label}</span>
    </div>
  );
}

function sortReportes(items: Reporte[]) {
  return [...items].sort((a, b) => {
    const da = a.created_at ? new Date(a.created_at).getTime() : 0;
    const db = b.created_at ? new Date(b.created_at).getTime() : 0;
    return db - da;
  });
}

function getColorByTipo(tipo: string | null) {
  switch (tipo) {
    case "Robo":
      return "#ff3b30";
    case "Accidente":
      return "#9e9e9e";
    case "Iluminación":
      return "#64b5f6";
    case "Vandalismo":
      return "#ffd54f";
    case "Otro":
    default:
      return "#8d6e63";
  }
}

function FitBounds({ reportes }: { reportes: Reporte[] }) {
  const map = useMap();

  useEffect(() => {
    if (!reportes.length) return;

    const points = reportes
      .map((r) => ({
        lat: Number(r.lat),
        lng: Number(r.lng),
      }))
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
      .map((p) => [p.lat, p.lng] as [number, number]);

    if (!points.length) return;

    if (points.length === 1) {
      map.setView(points[0], 16, { animate: true });
      return;
    }

    const bounds = L.latLngBounds(points);

    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 17,
      animate: true,
    });
  }, [reportes, map]);

  return null;
}

export default function MapView() {
  const [mounted, setMounted] = useState(false);
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [msg, setMsg] = useState("");
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(false);

  const cargarReportes = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    const { data, error } = await supabase
      .from("reportes")
      .select("id, tipo, descripcion, lat, lng, estado, created_at, imagen_url")
      .order("created_at", { ascending: false });

    if (!silent) setLoading(false);

    if (error) {
      setMsg("Error al cargar reportes: " + error.message);
      return;
    }

    setMsg("");
    setReportes((data as Reporte[]) || []);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    cargarReportes();
  }, [cargarReportes]);

  useEffect(() => {
    const channel = supabase
      .channel("reportes-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reportes" },
        (payload) => {
          const nuevo = payload.new as Reporte;

          setReportes((prev) => {
            const existe = prev.some((r) => r.id === nuevo.id);
            if (existe) return prev;
            return sortReportes([nuevo, ...prev]);
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reportes" },
        (payload) => {
          const actualizado = payload.new as Reporte;

          setReportes((prev) =>
            sortReportes(prev.map((r) => (r.id === actualizado.id ? actualizado : r)))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "reportes" },
        (payload) => {
          const eliminado = payload.old as { id: string };
          setReportes((prev) => prev.filter((r) => r.id !== eliminado.id));
        }
      )
      .subscribe((status) => {
        setLive(status === "SUBSCRIBED");

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setMsg("Conexión en vivo intermitente. Reintentando automáticamente.");
        }

        if (status === "SUBSCRIBED") {
          setMsg("");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      cargarReportes(true);
    }, 60000);

    return () => clearInterval(interval);
  }, [cargarReportes]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        cargarReportes(true);
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [cargarReportes]);

  const counts = useMemo(() => {
    return {
      pendientes: reportes.filter((r) => r.estado === "pendiente").length,
      resueltos: reportes.filter((r) => r.estado === "resuelto").length,
    };
  }, [reportes]);

  if (!mounted) {
    return <div style={{ height: "70vh", width: "100%" }}>Cargando mapa...</div>;
  }

  const tileUrl =
    process.env.NEXT_PUBLIC_TILE_URL ||
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        background: "#f4f6f8",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          gap: 12,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            background: live ? "#e8f5e9" : "#fff3e0",
            color: live ? "#1b5e20" : "#a15c00",
            borderRadius: 999,
            padding: "10px 14px",
            fontSize: 13,
            fontWeight: 700,
            boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
          }}
        >
          {live ? "En vivo" : "Reconectando"}
        </span>

        <span
          style={{
            background: "#ffffff",
            color: "#31424d",
            borderRadius: 999,
            padding: "10px 14px",
            fontSize: 13,
            fontWeight: 700,
            boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
          }}
        >
          Pendientes: {counts.pendientes}
        </span>

        <span
          style={{
            background: "#ffffff",
            color: "#31424d",
            borderRadius: 999,
            padding: "10px 14px",
            fontSize: 13,
            fontWeight: 700,
            boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
          }}
        >
          Resueltos: {counts.resueltos}
        </span>

        {loading && (
          <span
            style={{
              background: "#eef3f7",
              color: "#35505f",
              borderRadius: 999,
              padding: "10px 14px",
              fontSize: 13,
              fontWeight: 700,
              boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
            }}
          >
            Cargando...
          </span>
        )}
      </div>

      <div
        style={{
          position: "relative",
          height: "70vh",
          width: "100%",
          borderRadius: 22,
          overflow: "hidden",
          background: "#ffffff",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <MapContainer
          center={DEFAULT_MAP_CENTER}
          zoom={DEFAULT_MAP_ZOOM}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url={tileUrl} />
          <FitBounds reportes={reportes} />

          {reportes.map((r) => {
            const color = getColorByTipo(r.tipo);

            return (
              <Fragment key={r.id}>
                <CircleMarker
                  center={[Number(r.lat), Number(r.lng)]}
                  radius={18}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: 0.08,
                    weight: 3,
                  }}
                />
                <CircleMarker
                  center={[Number(r.lat), Number(r.lng)]}
                  radius={8}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: 0.9,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: 180 }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>
                        {r.tipo || "Incidente"}
                      </div>

                      <div
                        style={{
                          fontSize: 13,
                          color: "#44535d",
                          marginBottom: 6,
                        }}
                      >
                        Estado: {r.estado || "sin estado"}
                      </div>

                      {r.descripcion && (
                        <div style={{ fontSize: 13, marginBottom: 6 }}>
                          {r.descripcion}
                        </div>
                      )}

                      {r.created_at && (
                        <div style={{ fontSize: 12, color: "#6b7a84" }}>
                          {new Date(r.created_at).toLocaleString("es-AR")}
                        </div>
                      )}

                      {r.imagen_url && (
                        <div style={{ marginTop: 8 }}>
                          <img
                            src={r.imagen_url}
                            alt="Incidente"
                            style={{
                              width: "100%",
                              borderRadius: 8,
                              display: "block",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              </Fragment>
            );
          })}
        </MapContainer>

        <FloatingReportButton />
      </div>

      <div
        style={{
          marginTop: 14,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            borderRadius: 16,
            padding: "12px 18px",
            boxShadow: "0 8px 18px rgba(0,0,0,0.08)",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 18,
            maxWidth: "100%",
          }}
        >
          <LegendItem color="#ff3b30" label="Robo" />
          <LegendItem color="#9e9e9e" label="Accidente" />
          <LegendItem color="#64b5f6" label="Iluminación" />
          <LegendItem color="#ffd54f" label="Vandalismo" />
          <LegendItem color="#8d6e63" label="Otro" />
        </div>
      </div>

      {msg && (
        <div
          style={{
            marginTop: 12,
            background: "#fff5f5",
            color: "#8a1f1f",
            padding: "10px 12px",
            borderRadius: 10,
            boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
            fontSize: 14,
          }}
        >
          {msg}
        </div>
      )}
    </div>
  );
}