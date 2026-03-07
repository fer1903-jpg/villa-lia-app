"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "../../../lib/supabase";
import { obtenerZona } from "../../../lib/zonasVillaLia";

const ZonasMapView = dynamic(() => import("../../../components/ZonasMapView"), {
  ssr: false,
});

type Reporte = {
  id: string;
  tipo: string | null;
  estado: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string | null;
};

type ZonaResumen = {
  key: string;
  label: string;
  centerLat: number;
  centerLng: number;
  total: number;
  pendientes: number;
  resueltos: number;
  porTipo: Record<string, number>;
};

type AddressMap = Record<string, string>;

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
      <div
        style={{
          marginTop: 10,
          fontSize: typeof value === "string" && value.length > 24 ? 22 : 28,
          fontWeight: 800,
          color: "#10212b",
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function agruparPorZona(reportes: Reporte[]): ZonaResumen[] {
  const grupos: Record<string, ZonaResumen> = {};

  reportes.forEach((r) => {
    if (r.lat == null || r.lng == null) return;

    const zonaNombre = obtenerZona(r.lat, r.lng);

    if (!grupos[zonaNombre]) {
      grupos[zonaNombre] = {
        key: zonaNombre,
        label: zonaNombre,
        centerLat: r.lat,
        centerLng: r.lng,
        total: 0,
        pendientes: 0,
        resueltos: 0,
        porTipo: {},
      };
    }

    const zona = grupos[zonaNombre];

    zona.total += 1;

    if (r.estado === "resuelto") {
      zona.resueltos += 1;
    } else {
      zona.pendientes += 1;
    }

    const tipo = r.tipo || "Otro";
    zona.porTipo[tipo] = (zona.porTipo[tipo] || 0) + 1;
  });

  return Object.values(grupos).sort((a, b) => b.total - a.total);
}

function formatApproxAddress(data: any): string {
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

export default function ModeracionZonasPage() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [addressMap, setAddressMap] = useState<AddressMap>({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    async function cargar() {
      setLoading(true);
      setMsg("");

      const { data, error } = await supabase
        .from("reportes")
        .select("id, tipo, estado, lat, lng, created_at")
        .not("lat", "is", null)
        .not("lng", "is", null)
        .order("created_at", { ascending: false });

      setLoading(false);

      if (error) {
        setMsg("Error al cargar zonas: " + error.message);
        return;
      }

      setReportes((data as Reporte[]) || []);
    }

    cargar();
  }, []);

  const zonas = useMemo(() => agruparPorZona(reportes), [reportes]);

  useEffect(() => {
    async function resolveAddresses() {
      const faltantes = zonas.filter((z) => !addressMap[z.key]).slice(0, 20);

      for (const zona of faltantes) {
        try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${zona.centerLat}&lon=${zona.centerLng}`;
          const res = await fetch(url, { headers: { Accept: "application/json" } });

          if (!res.ok) {
            setAddressMap((prev) => ({
              ...prev,
              [zona.key]: "Calle cercana",
            }));
            continue;
          }

          const data = await res.json();
          const label = formatApproxAddress(data);

          setAddressMap((prev) => ({
            ...prev,
            [zona.key]: label,
          }));
        } catch {
          setAddressMap((prev) => ({
            ...prev,
            [zona.key]: "Calle cercana",
          }));
        }
      }
    }

    if (zonas.length) {
      resolveAddresses();
    }
  }, [zonas, addressMap]);

  const zonaMasActiva = zonas[0];

  const zonaMasActivaLabel = zonaMasActiva
    ? addressMap[zonaMasActiva.key] || "Calle cercana"
    : "Calle cercana";

  return (
    <div style={{ fontFamily: "Arial, sans-serif" }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: 34, color: "#10212b" }}>Zonas</h1>
        <p style={{ marginTop: 8, color: "#4b5b66" }}>
          Vista geográfica de zonas críticas. Hacé click sobre una zona para ver el detalle.
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
        <StatCard
          label="Reportes geolocalizados"
          value={reportes.length}
          color="#0f5c7a"
        />

        <StatCard
          label="Zonas detectadas"
          value={zonas.length}
          color="#6a1b9a"
        />

        <StatCard
          label="Zona más activa"
          value={zonaMasActivaLabel}
          color="#ef6c00"
        />

        <StatCard
          label="Incidentes en zona líder"
          value={zonaMasActiva?.total || 0}
          color="#c62828"
        />
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
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0, color: "#10212b" }}>Mapa de zonas críticas</h2>

          <div
            style={{
              background: "#eef3f7",
              color: "#35505f",
              borderRadius: 10,
              padding: "10px 12px",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            Click en una zona para abrir su detalle
          </div>
        </div>

        {loading ? (
          <p style={{ color: "#4b5b66" }}>Cargando zonas...</p>
        ) : zonas.length === 0 ? (
          <p style={{ color: "#4b5b66" }}>No hay datos geográficos suficientes.</p>
        ) : (
          <ZonasMapView zonas={zonas} addressMap={addressMap} />
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