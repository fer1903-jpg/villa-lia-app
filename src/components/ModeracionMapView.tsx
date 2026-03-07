"use client";

import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { supabase } from "../lib/supabase";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "../lib/mapConfig";
import AutoFitBounds from "./AutoFitBounds";


type Reporte = {
  id: string;
  tipo: string | null;
  descripcion: string | null;
  lat: number;
  lng: number;
  estado: string | null;
  created_at: string | null;
  imagen_url: string | null;
  accion_resolucion: string | null;
};

type Profile = {
  username: string | null;
  role: string | null;
};

type EstadoFiltro = "todos" | "pendiente" | "resuelto";

type AccionResolucion =
  | "Se envió móvil"
  | "Se contactó al vecino"
  | "Se avisó a la Cooperativa";

function getMarkerColors(tipo?: string | null) {
  const t = (tipo || "").toLowerCase();

  if (t === "robo") {
    return { outer: "#ff3b30", inner: "#b00020" };
  }

  if (t === "accidente") {
    return { outer: "#9e9e9e", inner: "#424242" };
  }

  if (t === "iluminación" || t === "iluminacion") {
    return { outer: "#64b5f6", inner: "#1565c0" };
  }

  if (t === "vandalismo") {
    return { outer: "#ffd54f", inner: "#f9a825" };
  }

  return { outer: "#8d6e63", inner: "#5d4037" };
}

function FiltroButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "none",
        background: active ? "#0f5c7a" : "#ffffff",
        color: active ? "#ffffff" : "#0f5c7a",
        padding: "10px 14px",
        borderRadius: 10,
        fontWeight: 700,
        cursor: "pointer",
        boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
      }}
    >
      {label}
    </button>
  );
}

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

export default function ModeracionMapView() {
  const [mounted, setMounted] = useState(false);
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [live, setLive] = useState(false);
  const [filtro, setFiltro] = useState<EstadoFiltro>("todos");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [blink, setBlink] = useState(false);
  const [highlightLive, setHighlightLive] = useState(false);
  const [accionesSeleccionadas, setAccionesSeleccionadas] = useState<Record<string, string>>({});

  const puedeResolver =
    profile?.role === "admin" || profile?.role === "superadmin";

  const cargarProfile = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("username, role")
      .eq("id", user.id)
      .single();

    if (data) setProfile(data);
  }, []);

  const cargarReportes = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    const { data, error } = await supabase
      .from("reportes")
      .select("id, tipo, descripcion, lat, lng, estado, created_at, imagen_url, accion_resolucion")
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
    cargarProfile();
    cargarReportes();
  }, [cargarProfile, cargarReportes]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlink((prev) => !prev);
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  function pulseLiveIndicator() {
    setHighlightLive(true);
    setTimeout(() => setHighlightLive(false), 1800);
  }

  useEffect(() => {
    const channel = supabase
      .channel("moderacion-mapa-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reportes" },
        (payload) => {
          const nuevo = payload.new as Reporte;
          pulseLiveIndicator();

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
          pulseLiveIndicator();

          setReportes((prev) =>
            sortReportes(
              prev.map((r) => (r.id === actualizado.id ? actualizado : r))
            )
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "reportes" },
        (payload) => {
          const eliminado = payload.old as { id: string };
          pulseLiveIndicator();

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

  async function marcarResuelto(id: string) {
    const accion = accionesSeleccionadas[id];

    if (!accion) {
      setMsg("Antes de resolver, elegí una acción.");
      return;
    }

    const confirmar = window.confirm(`¿Confirmar resolución con la acción: "${accion}"?`);
    if (!confirmar) return;

    const { error } = await supabase
      .from("reportes")
      .update({
        estado: "resuelto",
        accion_resolucion: accion,
      })
      .eq("id", id);

    if (error) {
      setMsg("No se pudo actualizar el incidente: " + error.message);
      return;
    }

    setMsg("Incidente marcado como resuelto.");
  }

  const reportesFiltrados = useMemo(() => {
    if (filtro === "todos") return reportes;
    return reportes.filter((r) => r.estado === filtro);
  }, [reportes, filtro]);

  const counts = useMemo(() => {
    return {
      todos: reportes.length,
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

  const opcionesAccion: AccionResolucion[] = [
    "Se envió móvil",
    "Se contactó al vecino",
    "Se avisó a la Cooperativa",
  ];

  return (
    <div style={{ fontFamily: "Arial, sans-serif" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <span
            style={{
              background: live ? "#e8f5e9" : "#fff3e0",
              color: live ? "#1b5e20" : "#a15c00",
              borderRadius: 999,
              padding: "6px 10px",
              fontSize: 13,
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              boxShadow: highlightLive ? "0 0 0 4px rgba(46,125,50,0.18)" : "none",
              transition: "box-shadow 0.25s ease",
            }}
          >
            <span
              style={{
                color: live
                  ? blink
                    ? "#2e7d32"
                    : "#9ccc65"
                  : blink
                  ? "#a15c00"
                  : "#f6c26b",
                fontWeight: 900,
                fontSize: 16,
                lineHeight: 1,
              }}
            >
              ●
            </span>
            <span>{live ? "En vivo" : "Reconectando"}</span>
          </span>

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
            {profile ? `${profile.username} · ${profile.role}` : "Cargando perfil..."}
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

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <FiltroButton
            active={filtro === "todos"}
            label={`Todos (${counts.todos})`}
            onClick={() => setFiltro("todos")}
          />
          <FiltroButton
            active={filtro === "pendiente"}
            label={`Pendientes (${counts.pendientes})`}
            onClick={() => setFiltro("pendiente")}
          />
          <FiltroButton
            active={filtro === "resuelto"}
            label={`Resueltos (${counts.resueltos})`}
            onClick={() => setFiltro("resuelto")}
          />
        </div>
      </div>

      <div
        style={{
          position: "relative",
          height: "72vh",
          width: "100%",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
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
    .map((r) => ({ lat: r.lat, lng: r.lng }))}
  mode="if-outside"
/>

          {reportesFiltrados.map((reporte) => {
            const colors = getMarkerColors(reporte.tipo);
            const esResuelto = reporte.estado === "resuelto";

            return (
              <div key={reporte.id}>
                <CircleMarker
                  center={[reporte.lat, reporte.lng]}
                  radius={esResuelto ? 18 : 24}
                  pathOptions={{
                    color: colors.outer,
                    weight: 2,
                    fillColor: colors.outer,
                    fillOpacity: esResuelto ? 0.10 : 0.22,
                  }}
                />

                <CircleMarker
                  center={[reporte.lat, reporte.lng]}
                  radius={esResuelto ? 7 : 9}
                  pathOptions={{
                    color: colors.inner,
                    weight: 2,
                    fillColor: colors.inner,
                    fillOpacity: esResuelto ? 0.45 : 0.95,
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: 240, fontFamily: "Arial, sans-serif" }}>
                      <div style={{ fontWeight: 800, color: "#10212b", marginBottom: 8 }}>
                        {reporte.tipo || "Incidente"}
                      </div>

                      <div style={{ color: "#4b5b66", marginBottom: 8 }}>
                        {reporte.descripcion || "Sin descripción"}
                      </div>

                      <div style={{ fontSize: 13, color: "#31424d", marginBottom: 4 }}>
                        <b>Estado:</b> {reporte.estado || "pendiente"}
                      </div>

                      <div style={{ fontSize: 13, color: "#31424d", marginBottom: 4 }}>
                        <b>Fecha:</b>{" "}
                        {reporte.created_at
                          ? new Date(reporte.created_at).toLocaleString()
                          : "-"}
                      </div>

                      {reporte.accion_resolucion && (
                        <div style={{ fontSize: 13, color: "#31424d", marginBottom: 10 }}>
                          <b>Acción de resolución:</b> {reporte.accion_resolucion}
                        </div>
                      )}

                      {reporte.imagen_url && (
                        <img
                          src={reporte.imagen_url}
                          alt="Incidente"
                          style={{
                            width: "100%",
                            borderRadius: 10,
                            marginBottom: 10,
                            border: "1px solid #d9e0e5",
                          }}
                        />
                      )}

                      {puedeResolver && reporte.estado !== "resuelto" && (
                        <div style={{ display: "grid", gap: 10 }}>
                          <select
                            value={accionesSeleccionadas[reporte.id] || ""}
                            onChange={(e) =>
                              setAccionesSeleccionadas((prev) => ({
                                ...prev,
                                [reporte.id]: e.target.value,
                              }))
                            }
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              borderRadius: 10,
                              border: "1px solid #cfd8df",
                              fontSize: 14,
                              boxSizing: "border-box",
                            }}
                          >
                            <option value="">Elegir acción previa</option>
                            {opcionesAccion.map((op) => (
                              <option key={op} value={op}>
                                {op}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => marcarResuelto(reporte.id)}
                            style={{
                              border: "none",
                              background: "#2e7d32",
                              color: "white",
                              padding: "10px 12px",
                              borderRadius: 10,
                              fontWeight: 700,
                              cursor: "pointer",
                              width: "100%",
                            }}
                          >
                            Marcar como resuelto
                          </button>
                        </div>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              </div>
            );
          })}
        </MapContainer>
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