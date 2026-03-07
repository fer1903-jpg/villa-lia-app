"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "../lib/mapConfig";
import IncidentMarker from "./IncidentMarker";

type Props = {
  lat: number | null;
  lng: number | null;
  onPick: (lat: number, lng: number) => void;
};

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}

export default function MapPicker({ lat, lng, onPick }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ height: "50vh", width: "100%" }}>Cargando mapa...</div>;
  }

  const center: [number, number] =
    lat !== null && lng !== null ? [lat, lng] : DEFAULT_MAP_CENTER;

  const tileUrl =
    process.env.NEXT_PUBLIC_TILE_URL ||
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  return (
    <div style={{ height: "50vh", width: "100%", borderRadius: 14, overflow: "hidden" }}>
      <MapContainer
        center={center}
        zoom={DEFAULT_MAP_ZOOM}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url={tileUrl} />
        <ClickHandler onPick={onPick} />

        {lat !== null && lng !== null && (
          <IncidentMarker
            lat={lat}
            lng={lng}
            tipo="Otro"
            descripcion="Ubicación seleccionada"
            estado="pendiente"
            showPopup={false}
          />
        )}
      </MapContainer>
    </div>
  );
}