"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

export default function MapView() {
  const tileUrl =
    process.env.NEXT_PUBLIC_TILE_URL ||
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const center: [number, number] = [-34.1237, -59.4313]; // Villa Lía

  return (
    <div style={{ height: "70vh", width: "100%" }}>
      <MapContainer center={center} zoom={15} style={{ height: "100%", width: "100%" }}>
        <TileLayer url={tileUrl} />
        <Marker position={center}>
          <Popup>Villa Lía</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}