"use client";

import "leaflet/dist/leaflet.css";
import { Circle, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { divIcon } from "leaflet";
import { useRouter } from "next/navigation";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "../lib/mapConfig";
import AutoFitBounds from "./AutoFitBounds";

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

function getZonaColor(total: number) {
  if (total >= 8) return "#c62828";
  if (total >= 5) return "#ef6c00";
  if (total >= 3) return "#f9a825";
  return "#0f5c7a";
}

function getZonaRadius(total: number) {
  if (total >= 8) return 220;
  if (total >= 5) return 180;
  if (total >= 3) return 140;
  return 100;
}

function getTipoPredominante(porTipo: Record<string, number>) {
  const entries = Object.entries(porTipo).sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] || "Otro";
}

function createZoneLabelIcon(text: string) {
  return divIcon({
    className: "zona-label-icon",
    html: `
      <div style="
        transform: translate(18px, -6px);
        font-size: 12px;
        font-weight: 700;
        color: #000000;
        text-shadow:
          0 0 2px #ffffff,
          0 0 4px #ffffff,
          0 0 6px #ffffff;
        white-space: nowrap;
        pointer-events: none;
      ">
        ${text}
      </div>
    `,
    iconSize: [140, 20],
    iconAnchor: [0, 0],
  });
}

export default function ZonasMapView({
  zonas,
  addressMap = {},
}: {
  zonas: ZonaResumen[];
  addressMap?: AddressMap;
}) {
  const router = useRouter();

  return (
    <div
      style={{
        position: "relative",
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
        <TileLayer
          url={process.env.NEXT_PUBLIC_TILE_URL ||
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
        />
<AutoFitBounds
  points={zonas.map((z) => ({ lat: z.centerLat, lng: z.centerLng }))}
  mode="always"
/>
        {zonas.map((zona) => {
          const color = getZonaColor(zona.total);
          const radius = getZonaRadius(zona.total);
          const predominante = getTipoPredominante(zona.porTipo);
          const referencia = addressMap[zona.key] || "Calle cercana";

          return (
            <div key={zona.key}>
              <Circle
                center={[zona.centerLat, zona.centerLng]}
                radius={radius}
                pathOptions={{
                  color,
                  weight: 3,
                  fillColor: color,
                  fillOpacity: 0.18,
                }}
                eventHandlers={{
                  click: () => {
                    router.push(
                      `/moderacion/zonas/detalle?zona=${encodeURIComponent(zona.key)}`
                    );
                  },
                }}
              >
                <Popup>
                  <div style={{ minWidth: 240, fontFamily: "Arial, sans-serif" }}>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: 18,
                        color: "#10212b",
                        marginBottom: 8,
                      }}
                    >
                      {zona.label}
                    </div>

                    <div style={{ color: "#4b5b66", marginBottom: 8 }}>
                      {referencia}
                    </div>

                    <div style={{ marginBottom: 4 }}>
                      <b>Total:</b> {zona.total}
                    </div>
                    <div style={{ marginBottom: 4 }}>
                      <b>Pendientes:</b> {zona.pendientes}
                    </div>
                    <div style={{ marginBottom: 4 }}>
                      <b>Resueltos:</b> {zona.resueltos}
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <b>Tipo predominante:</b> {predominante}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/moderacion/zonas/detalle?zona=${encodeURIComponent(zona.key)}`
                        )
                      }
                      style={{
                        border: "none",
                        background: "#0f5c7a",
                        color: "#fff",
                        borderRadius: 10,
                        padding: "10px 12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        width: "100%",
                      }}
                    >
                      Ver detalle de la zona
                    </button>
                  </div>
                </Popup>
              </Circle>

              <Marker
                position={[zona.centerLat, zona.centerLng]}
                icon={createZoneLabelIcon(zona.label)}
                interactive={false}
              />
            </div>
          );
        })}
      </MapContainer>

      {/* Rosa de los vientos */}
      <div
        style={{
          position: "absolute",
          left: 14,
          bottom: 14,
          width: 84,
          height: 84,
          borderRadius: "50%",
          background: "rgba(20,20,20,0.78)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
          zIndex: 1000,
          userSelect: "none",
        }}
        title="Rosa de los vientos"
      >
        <div style={{ position: "relative", width: 64, height: 64 }}>
          <div
            style={{
              position: "absolute",
              top: 2,
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: 14,
              fontWeight: 800,
            }}
          >
            N
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 2,
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: 14,
              fontWeight: 800,
            }}
          >
            S
          </div>
          <div
            style={{
              position: "absolute",
              left: 2,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 14,
              fontWeight: 800,
            }}
          >
            O
          </div>
          <div
            style={{
              position: "absolute",
              right: 2,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 14,
              fontWeight: 800,
            }}
          >
            E
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 12,
              width: 2,
              height: 40,
              background: "rgba(255,255,255,0.85)",
              transform: "translateX(-50%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: 12,
              width: 40,
              height: 2,
              background: "rgba(255,255,255,0.85)",
              transform: "translateY(-50%)",
            }}
          />

          <div
            style={{
              position: "absolute",
              top: 10,
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderBottom: "12px solid #ff5252",
            }}
          />
        </div>
      </div>
    </div>
  );
}