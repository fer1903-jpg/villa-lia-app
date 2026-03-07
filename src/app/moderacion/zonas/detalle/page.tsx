"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../../lib/supabase";
import { obtenerZona } from "../../../../lib/zonasVillaLia";

type Reporte = {
  id: string;
  tipo: string | null;
  descripcion: string | null;
  estado: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string | null;
  imagen_url: string | null;
};

type AddressResponse = {
  display_name?: string;
  address?: Record<string, string>;
};

function getTipoColor(tipo: string) {
  const t = tipo.toLowerCase();

  if (t === "robo") return "#ff3b30";
  if (t === "accidente") return "#9e9e9e";
  if (t === "iluminación" || t === "iluminacion") return "#64b5f6";
  if (t === "vandalismo") return "#ffd54f";
  return "#8d6e63";
}

function formatApproxAddress(data: AddressResponse): string {
  const addr = data?.address || {};

  const road =
    addr.road ||
    addr.pedestrian ||
    addr.residential ||
    addr.path ||
    addr.footway;

  const houseNumber = addr.house_number;

  const crossStreet =
    addr.crossing ||
    addr.neighbourhood ||
    addr.suburb;

  if (road && houseNumber) {
    const altura = Math.round(Number(houseNumber) / 100) * 100;
    return `Calle ${road} ${altura}`;
  }

  if (road && crossStreet) {
    return `Calle ${road} y ${crossStreet}`;
  }

  if (road) {
    return `Calle ${road}`;
  }

  return "Calle cercana";
}

export default function ModeracionZonaDetallePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const zonaKey = searchParams.get("zona") || "";

  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [addressLabel, setAddressLabel] = useState("Calculando referencia...");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!zonaKey) {
      setMsg("Zona inválida.");
      return;
    }

    async function cargar() {
      const { data, error } = await supabase
        .from("reportes")
        .select("id, tipo, descripcion, estado, lat, lng, created_at, imagen_url")
        .not("lat", "is", null)
        .not("lng", "is", null)
        .order("created_at", { ascending: false });

      if (error) {
        setMsg("Error al cargar la zona: " + error.message);
        return;
      }

      const filtrados = ((data as Reporte[]) || []).filter((r) => {
        if (r.lat == null || r.lng == null) return false;
        return obtenerZona(r.lat, r.lng) === zonaKey;
      });

      setReportes(filtrados);

      // Sacamos referencia de la primera ubicación disponible dentro de la zona
      const referenciaBase = filtrados.find((r) => r.lat != null && r.lng != null);

      if (referenciaBase?.lat != null && referenciaBase?.lng != null) {
        try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${referenciaBase.lat}&lon=${referenciaBase.lng}`;
          const res = await fetch(url, { headers: { Accept: "application/json" } });

          if (!res.ok) {
            setAddressLabel("Calle cercana");
            return;
          }

          const data = (await res.json()) as AddressResponse;
          setAddressLabel(formatApproxAddress(data));
        } catch {
          setAddressLabel("Calle cercana");
        }
      } else {
        setAddressLabel("Calle cercana");
      }
    }

    cargar();
  }, [zonaKey]);

  const resumen = useMemo(() => {
    const porTipo: Record<string, number> = {};

    reportes.forEach((r) => {
      const tipo = r.tipo || "Otro";
      porTipo[tipo] = (porTipo[tipo] || 0) + 1;
    });

    return {
      total: reportes.length,
      pendientes: reportes.filter((r) => r.estado === "pendiente").length,
      resueltos: reportes.filter((r) => r.estado === "resuelto").length,
      porTipo: Object.entries(porTipo).sort((a, b) => b[1] - a[1]),
    };
  }, [reportes]);

  return (
    <div style={{ fontFamily: "Arial, sans-serif" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 34, color: "#10212b" }}>Detalle de zona</h1>
          <p style={{ marginTop: 8, color: "#4b5b66" }}>
            {zonaKey ? `Zona ${zonaKey}` : "Zona"}
          </p>
          <p style={{ marginTop: 4, color: "#60707a", fontSize: 14 }}>
            {addressLabel}
          </p>
        </div>

        <button
          onClick={() => router.push("/moderacion/zonas")}
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
          Volver a Zonas
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        {[
          ["Total", resumen.total, "#0f5c7a"],
          ["Pendientes", resumen.pendientes, "#ef6c00"],
          ["Resueltos", resumen.resueltos, "#2e7d32"],
        ].map(([label, value, color]) => (
          <div
            key={String(label)}
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
        ))}
      </div>

      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          padding: 20,
          boxShadow: "0 8px 22px rgba(0,0,0,0.08)",
          marginBottom: 18,
        }}
      >
        <h2 style={{ marginTop: 0, color: "#10212b" }}>Composición por tipo</h2>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {resumen.porTipo.length === 0 ? (
            <div style={{ color: "#4b5b66" }}>Sin incidentes para esta zona.</div>
          ) : (
            resumen.porTipo.map(([tipo, cantidad]) => (
              <div
                key={tipo}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#f9fbfc",
                  borderRadius: 999,
                  padding: "8px 10px",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#31424d",
                }}
              >
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: getTipoColor(tipo),
                    display: "inline-block",
                  }}
                />
                <span>
                  {tipo}: {cantidad}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          padding: 20,
          boxShadow: "0 8px 22px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ marginTop: 0, color: "#10212b" }}>Incidentes de esta zona</h2>

        {reportes.length === 0 ? (
          <p style={{ color: "#4b5b66" }}>No hay incidentes en esta zona.</p>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {reportes.map((r) => (
              <div
                key={r.id}
                style={{
                  border: "1px solid #e5eaee",
                  borderRadius: 14,
                  padding: 16,
                  display: "grid",
                  gap: 10,
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
                  <div style={{ fontWeight: 800, color: "#10212b", fontSize: 18 }}>
                    {r.tipo || "Otro"}
                  </div>

                  <div
                    style={{
                      display: "inline-block",
                      background: r.estado === "resuelto" ? "#e8f5e9" : "#fff3e0",
                      color: r.estado === "resuelto" ? "#1b5e20" : "#a15c00",
                      borderRadius: 999,
                      padding: "6px 10px",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {r.estado || "pendiente"}
                  </div>
                </div>

                <div style={{ color: "#4b5b66" }}>
                  {r.descripcion || "Sin descripción"}
                </div>

                <div style={{ color: "#60707a", fontSize: 12 }}>
                  {r.created_at ? new Date(r.created_at).toLocaleString() : "-"}
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
            boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
          }}
        >
          {msg}
        </div>
      )}
    </div>
  );
}