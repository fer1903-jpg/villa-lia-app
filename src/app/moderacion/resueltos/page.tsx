"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Reporte = {
  id: string;
  tipo: string | null;
  descripcion: string | null;
  estado: string | null;
  created_at: string | null;
  resuelto_at: string | null;
  accion_resolucion: string | null;
  imagen_url: string | null;
  resuelto_by: string | null;
};

type ResolverMap = Record<string, string>;

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

export default function ModeracionResueltosPage() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [resolverMap, setResolverMap] = useState<ResolverMap>({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos");

  const cargarResueltos = useCallback(async () => {
    setLoading(true);
    setMsg("");

    const { data, error } = await supabase
      .from("reportes")
      .select(
        "id, tipo, descripcion, estado, created_at, resuelto_at, accion_resolucion, imagen_url, resuelto_by"
      )
      .eq("estado", "resuelto")
      .order("resuelto_at", { ascending: false });

    setLoading(false);

    if (error) {
      setMsg("Error al cargar resueltos: " + error.message);
      return;
    }

    const rows = (data as Reporte[]) || [];
    setReportes(rows);

    const userIds = Array.from(
      new Set(rows.map((r) => r.resuelto_by).filter(Boolean))
    ) as string[];

    if (userIds.length > 0) {
      const { data: perfiles, error: perfilesError } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds);

      if (!perfilesError && perfiles) {
        const map: ResolverMap = {};
        perfiles.forEach((p: { id: string; username: string | null }) => {
          map[p.id] = p.username || p.id;
        });
        setResolverMap(map);
      }
    }
  }, []);

  useEffect(() => {
    cargarResueltos();
  }, [cargarResueltos]);

  const resueltosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return reportes.filter((r) => {
      const coincideTipo =
        tipoFiltro === "todos" ||
        (r.tipo || "").toLowerCase() === tipoFiltro.toLowerCase();

      const coincideTexto =
        !texto ||
        (r.descripcion || "").toLowerCase().includes(texto) ||
        (r.tipo || "").toLowerCase().includes(texto) ||
        (r.accion_resolucion || "").toLowerCase().includes(texto);

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
        <h1 style={{ margin: 0, fontSize: 34, color: "#10212b" }}>Resueltos</h1>
        <p style={{ marginTop: 8, color: "#4b5b66" }}>
          Histórico de incidentes cerrados y acciones realizadas.
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
          ["Total", resumenPorTipo.total, "#2e7d32"],
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
            placeholder="Buscar por tipo, descripción o acción"
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
            onClick={cargarResueltos}
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
        {resueltosFiltrados.length === 0 ? (
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              padding: 22,
              boxShadow: "0 8px 22px rgba(0,0,0,0.08)",
              color: "#4b5b66",
            }}
          >
            No hay incidentes resueltos con ese filtro.
          </div>
        ) : (
          resueltosFiltrados.map((r) => (
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

                <div style={{ textAlign: "right", minWidth: 220 }}>
                  <div
                    style={{
                      display: "inline-block",
                      background: "#e8f5e9",
                      color: "#1b5e20",
                      borderRadius: 999,
                      padding: "6px 10px",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    resuelto
                  </div>

                  <div style={{ marginTop: 8, color: "#60707a", fontSize: 12 }}>
                    <div>
                      <b>Creado:</b>{" "}
                      {r.created_at ? new Date(r.created_at).toLocaleString() : "-"}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <b>Resuelto:</b>{" "}
                      {r.resuelto_at ? new Date(r.resuelto_at).toLocaleString() : "-"}
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    background: "#f4f6f8",
                    color: "#31424d",
                    borderRadius: 10,
                    padding: "10px 12px",
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  Acción: {r.accion_resolucion || "Sin acción registrada"}
                </div>

                <div
                  style={{
                    background: "#f4f6f8",
                    color: "#31424d",
                    borderRadius: 10,
                    padding: "10px 12px",
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  Resuelto por:{" "}
                  {r.resuelto_by ? resolverMap[r.resuelto_by] || r.resuelto_by : "No registrado"}
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