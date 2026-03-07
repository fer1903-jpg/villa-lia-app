"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

type IncidentPoint = {
  lat: number;
  lng: number;
};

type Props = {
  points: IncidentPoint[];
};

export default function FitMapToIncidents({ points }: Props) {
  const map = useMap();

  useEffect(() => {
    if (!map || !points.length) return;

    const validPoints = points.filter(
      (p) =>
        typeof p.lat === "number" &&
        typeof p.lng === "number" &&
        !Number.isNaN(p.lat) &&
        !Number.isNaN(p.lng)
    );

    if (!validPoints.length) return;

    if (validPoints.length === 1) {
      map.setView([validPoints[0].lat, validPoints[0].lng], 16, {
        animate: true,
      });
      return;
    }

    const bounds = L.latLngBounds(validPoints.map((p) => [p.lat, p.lng] as [number, number]));

    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 17,
      animate: true,
    });
  }, [map, points]);

  return null;
}