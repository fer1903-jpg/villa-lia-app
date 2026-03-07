"use client";

import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { supabase } from "../lib/supabase";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "../lib/mapConfig";
import IncidentMarker from "./IncidentMarker";
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
        gap: 6,
        fontSize: 13,
        color: "#10212b",
        fontWeight: 600,
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
          border: "1px solid rgba(0,0,0,0.15)",
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

export default function MapView() {
  const [mounted, setMounted] = useState(false);
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [msg, setMsg] = useState("");
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(false);

  const cargarReportes = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    const { data, error } = await supabase
      .from("reportes")
      .select("id, tipo, descripcion, lat, lng, estado, created_at, imagen_url")
      .order("created_at", { ascending: false });

    if (!silent) {
      setLoading(false);
    }

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
        {
          event: "INSERT",
          schema: "public",
          table: "reportes",
        },
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
        {
          event: "UPDATE",
          schema: "public",
          table: "reportes",
        },
        (payload) => {
          const actualizado = payload.new as Reporte;

          setReportes((prev) =>
            sortReportes(
              prev.map((r) => (r.id === actualizado.id ? actualizado : r))
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "reportes",
        },
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

  // Fallback: refresco silencioso cada 60 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      cargarReportes(true);
    }, 60000);

    return () => clearInterval(interval);
  }, [cargarReportes]);

  // Refresco al volver a la pestaña
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
    <div style={{ fontFamily: "Arial, sans-serif" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              background: live ? "#e8f5e9" : "#fff3e0",
              color: live ? "#1b5e20" : "#a15c00",
              borderRadius: 999,
              padding: "6px 10px",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {live ? "En vivo" : "Reconectando"}
          </span>

          <span
            style={{
              background: "#f4f6f8",
              color: "#31424d",
              borderRadius: 999,
              padding: "6px 10px",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Pendientes: {counts.pendientes}
          </span>

          <span
            style={{
              background: "#f4f6f8",
              color: "#31424d",
              borderRadius: 999,
              padding: "6px 10px",
              fontSize: 13,
              fontWeight: 700,
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
                padding: "6px 10px",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Cargando...
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          position: "relative",
          height: "70vh",
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

          {reportes.map((reporte) => (
            <IncidentMarker
              key={reporte.id}
              lat={reporte.lat}
              lng={reporte.lng}
              tipo={reporte.tipo}
              descripcion={reporte.descripcion}
              estado={reporte.estado}
              showPopup={true}
            />
          ))}
        </MapContainer>

        <FloatingReportButton />
      </div>

      <div
        style={{
          marginTop: 12,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            borderRadius: 12,
            padding: "10px 16px",
            boxShadow: "0 8px 18px rgba(0,0,0,0.10)",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 16,
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