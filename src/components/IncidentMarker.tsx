"use client";

import { CircleMarker, Popup, useMapEvents } from "react-leaflet";
import { useState } from "react";

type Props = {
  lat: number;
  lng: number;
  tipo?: string | null;
  descripcion?: string | null;
  estado?: string | null;
  showPopup?: boolean;
};

function getMarkerColors(tipo?: string | null) {
  const t = (tipo || "").toLowerCase();

  if (t === "robo") {
    return {
      outer: "#ff3b30",
      inner: "#b00020",
    };
  }

  if (t === "accidente") {
    return {
      outer: "#9e9e9e",
      inner: "#424242",
    };
  }

  if (t === "iluminación" || t === "iluminacion") {
    return {
      outer: "#64b5f6",
      inner: "#1565c0",
    };
  }

  if (t === "vandalismo") {
    return {
      outer: "#ffd54f",
      inner: "#f9a825",
    };
  }

  return {
    outer: "#8d6e63",
    inner: "#5d4037",
  };
}

function getMarkerSizes(zoom: number) {
  if (zoom >= 18) return { outer: 16, inner: 6 };
  if (zoom >= 17) return { outer: 20, inner: 7 };
  if (zoom >= 16) return { outer: 24, inner: 8 };
  if (zoom >= 15) return { outer: 28, inner: 9 };
  if (zoom >= 14) return { outer: 32, inner: 10 };
  return { outer: 36, inner: 11 };
}

export default function IncidentMarker({
  lat,
  lng,
  tipo,
  descripcion,
  estado,
  showPopup = true,
}: Props) {
  const [zoom, setZoom] = useState(15);

  useMapEvents({
    zoomend(e) {
      setZoom(e.target.getZoom());
    },
  });

  const sizes = getMarkerSizes(zoom);
  const colors = getMarkerColors(tipo);

  return (
    <>
      <CircleMarker
        center={[lat, lng]}
        radius={sizes.outer}
        pathOptions={{
          color: colors.outer,
          weight: 2,
          fillColor: colors.outer,
          fillOpacity: 0.22,
        }}
      />

      <CircleMarker
        center={[lat, lng]}
        radius={sizes.inner}
        pathOptions={{
          color: colors.inner,
          weight: 2,
          fillColor: colors.inner,
          fillOpacity: 0.9,
        }}
      >
        {showPopup && (
          <Popup>
            <div style={{ minWidth: 180, fontFamily: "Arial, sans-serif" }}>
              <b>{tipo || "Incidente"}</b>
              <br />
              {descripcion || "Sin descripción"}
              <br />
              <small>Estado: {estado || "abierto"}</small>
            </div>
          </Popup>
        )}
      </CircleMarker>
    </>
  );
}