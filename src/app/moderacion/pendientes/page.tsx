"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Reporte = {
  id: string;
  tipo: string | null;
  descripcion: string | null;
  estado: string | null;
  created_at: string | null;
  imagen_url: string | null;
  accion_resolucion: string | null;
  lat: number | null;
  lng: number | null;
};

type Profile = {
  username: string | null;
  role: string | null;
};

type AccionResolucion =
  | "Se envió móvil"
  | "Se contactó al vecino"
  | "Se avisó a la Cooperativa";

const opcionesAccion: AccionResolucion[] = [
  "Se envió móvil",
  "Se contactó al vecino",
  "Se avisó a la Cooperativa",
];

function TipoBadge({ tipo }: { tipo: string | null }) {
  const t = (tipo || "Otro").toLowerCase();

  let bg = "#8d6e63";
  let color = "#ffffff";

  if (t === "robo") {
    bg = "#ff3b30";
  } else if (t === "accidente") {
    bg = "#9e9e9e";
  } else if (t === "iluminación" || t === "iluminacion") {
    bg = "#64b5f6";
  } else if (t === "vandalismo") {
    bg = "#ffd54f";
    color = "#3a2b00";
  }

  return (
    <span
      style={{
        display: "inline-block",
        padding: "6px 10px",
        borderRadius: 999,
        background: bg,
        color,
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      {tipo || "Otro"}
    </span>
  );
}

export default function ModeracionPendientesPage() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [accionesSeleccionadas, setAccionesSeleccionadas] = useState<Record<string, string>>(
    {}
  );

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

    if (data) {
      setProfile(data);
    }
  }, []);

  const cargarPendientes = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    const { data, error } = await supabase
      .from("reportes")
      .select(
        "id, tipo, descripcion, estado, created_at, imagen_url, accion_resolucion, lat, lng"
      )
      .eq("estado", "pendiente")
      .order("created_at", { ascending: false });

    if (!silent) setLoading(false);

    if (error) {
      setMsg("Error al cargar pendientes: " + error.message);
      return;
    }

    setMsg("");
    setReportes((data as Reporte[]) || []);
  }, []);

  useEffect(() => {
    cargarProfile();
    cargarPendientes();
  }, [cargarProfile, cargarPendientes]);

  useEffect(() => {
    const channel = supabase
      .channel("pendientes-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reportes" },
        (payload) => {
          const nuevo = payload.new as Reporte;
          if (nuevo.estado === "pendiente") {
            setReportes((prev) => [nuevo, ...prev]);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reportes" },
        (payload) => {
          const actualizado = payload.new as Reporte;

          setReportes((prev) => {
            const sinActual = prev.filter((r) => r.id !== actualizado.id);

            if (actualizado.estado === "pendiente") {
              return [actualizado, ...sinActual].sort((a, b) => {
                const da = a.created_at ? new Date(a.created_at).getTime() : 0;
                const db = b.created_at ? new Date(b.created_at).getTime() : 0;
                return db - da;
              });
            }

            return sinActual;
          });
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function resolverIncidente(id: string) {
    const accion = accionesSeleccionadas[id];

    if (!accion) {
      setMsg("Elegí una acción antes de resolver.");
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    const confirmar = window.confirm(`¿Confirmar resolución con la acción: "${accion}"?`);
    if (!confirmar) return;

    const { error } = await supabase
      .from("reportes")
      .update({
        estado: "resuelto",
        accion_resolucion: accion,
        resuelto_at: new Date().toISOString(),
        resuelto_by: user?.id || null,
      })
      .eq("id", id);

    if (error) {
      setMsg("No se pudo resolver el incidente: " + error.message);
      return;
    }

    setMsg("Incidente resuelto correctamente.");
  }

  const pendientesFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return reportes.filter((r) => {
      const coincideTipo =
        tipoFiltro === "todos" ||
        (r.tipo || "").toLowerCase() === tipoFiltro.toLowerCase();

      const coincideTexto =
        !texto ||
        (r.descripcion || "").toLowerCase().includes(texto) ||
        (r.tipo || "").toLowerCase().includes(texto);

      return coincideTipo && coincideTexto;
    });
  }, [reportes, busqueda, tipoFiltro]);

  const resumenPorTipo = useMemo(() => {
    return {
      total: reportes.length,
      robo: reportes.filter((r) => (r.tipo || "").toLowerCase() === "robo").length,
      accidente: reportes.filter((r) => (r.tipo || "").toLowerCase() === "accidente").length,
      iluminacion: reportes.filter((r) => {
        const t = (r.tipo || "").toLowerCase();
        return t === "iluminación" || t === "iluminacion";
      }).length,
      vandalismo: reportes.filter((r) => (r.tipo || "").toLowerCase() === "vandalismo").length,
      otro: reportes.filter((r) => {
        const t = (r.tipo || "").toLowerCase();
        return !["robo", "accidente", "iluminación", "iluminacion", "vandalismo"].includes(t);
      }).length,
    };
  }, [reportes]);

  return (
    <div style={{ fontFamily: "Arial, sans-serif" }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: 34, color: "#10212b" }}>Pendientes</h1>
        <p style={{ marginTop: 8, color: "#4b5b66" }}>
          Gestión de incidentes pendientes de resolución.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
          marginBottom: 18,
        }}
      >
        {[
          ["Total", resumenPorTipo.total, "#0f5c7a"],
          ["Robo", resumenPorTipo.robo, "#ff3b30"],
          ["Accidente", resumenPorTipo.accidente, "#9e9e9e"],
          ["Iluminación", resumenPorTipo.iluminacion, "#64b5f6"],
          ["Vandalismo", resumenPorTipo.vandalismo, "#ffd54f"],
          ["Otro", resumenPorTipo.otro, "#8d6e63"],
        ].map(([label, value, color]) => (
          <div
            key={String(label)}
            style={{
              background: "#ffffff",
              borderRadius: 14,
              padding: 16,
              boxShadow: "0 8px 22px rgba(0,0,0,0.08)",
              borderTop: `5px solid ${color}`,
            }}
          >
            <div style={{ color: "#4b5b66", fontWeight: 700, fontSize: 13 }}>{label}</div>
            <div style={{ marginTop: 10, fontSize: 28, fontWeight: 800, color: "#10212b" }}>
              {value}
            </div>
          </div>
        ))}
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
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por tipo o descripción"
            style={{
              flex: "1 1 260px",
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid #cfd8df",
              fontSize: 15,
            }}
          />

          <select
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
            style={{
              minWidth: 180,
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid #cfd8df",
              fontSize: 15,
            }}
          >
            <option value="todos">Todos los tipos</option>
            <option value="robo">Robo</option>
            <option value="accidente">Accidente</option>
            <option value="iluminación">Iluminación</option>
            <option value="vandalismo">Vandalismo</option>
            <option value="otro">Otro</option>
          </select>

          <button
            onClick={() => cargarPendientes()}
            disabled={loading}
            style={{
              border: "none",
              background: "#0f5c7a",
              color: "#fff",
              borderRadius: 10,
              padding: "12px 16px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {loading ? "Actualizando..." : "Actualizar"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {pendientesFiltrados.length === 0 ? (
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              padding: 22,
              boxShadow: "0 8px 22px rgba(0,0,0,0.08)",
              color: "#4b5b66",
            }}
          >
            No hay incidentes pendientes con ese filtro.
          </div>
        ) : (
          pendientesFiltrados.map((r) => (
            <div
              key={r.id}
              style={{
                background: "#ffffff",
                borderRadius: 16,
                padding: 18,
                boxShadow: "0 8px 22px rgba(0,0,0,0.08)",
                display: "grid",
                gap: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  alignItems: "start",
                }}
              >
                <div style={{ display: "grid", gap: 8 }}>
                  <TipoBadge tipo={r.tipo} />
                  <div style={{ color: "#10212b", fontWeight: 800, fontSize: 18 }}>
                    {r.tipo || "Otro"}
                  </div>
                  <div style={{ color: "#4b5b66", maxWidth: 700 }}>
                    {r.descripcion || "Sin descripción"}
                  </div>
                </div>

                <div style={{ textAlign: "right", minWidth: 180 }}>
                  <div
                    style={{
                      display: "inline-block",
                      background: "#fff3e0",
                      color: "#a15c00",
                      borderRadius: 999,
                      padding: "6px 10px",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    pendiente
                  </div>

                  <div style={{ marginTop: 8, color: "#60707a", fontSize: 12 }}>
                    {r.created_at ? new Date(r.created_at).toLocaleString() : "-"}
                  </div>

                  {r.lat != null && r.lng != null && (
                    <a
                      href={`/moderacion/mapa`}
                      style={{
                        display: "inline-block",
                        marginTop: 8,
                        textDecoration: "none",
                        color: "#0f5c7a",
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      Ver en mapa
                    </a>
                  )}
                </div>
              </div>

              {r.imagen_url && (
                <img
                  src={r.imagen_url}
                  alt="Incidente"
                  style={{
                    maxWidth: 320,
                    width: "100%",
                    borderRadius: 12,
                    border: "1px solid #d9e0e5",
                  }}
                />
              )}

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                {puedeResolver ? (
                  <>
                    <select
                      value={accionesSeleccionadas[r.id] || ""}
                      onChange={(e) =>
                        setAccionesSeleccionadas((prev) => ({
                          ...prev,
                          [r.id]: e.target.value,
                        }))
                      }
                      style={{
                        minWidth: 240,
                        padding: "12px 14px",
                        borderRadius: 10,
                        border: "1px solid #cfd8df",
                        fontSize: 15,
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
                      onClick={() => resolverIncidente(r.id)}
                      style={{
                        border: "none",
                        background: "#2e7d32",
                        color: "#fff",
                        borderRadius: 10,
                        padding: "12px 16px",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      Marcar como resuelto
                    </button>
                  </>
                ) : (
                  <div
                    style={{
                      background: "#eef3f7",
                      color: "#35505f",
                      borderRadius: 10,
                      padding: "12px 14px",
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    Vista de solo lectura para moderador
                  </div>
                )}
              </div>
            </div>
          ))
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