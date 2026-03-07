"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

type Point = {
  lat: number;
  lng: number;
};

type Props = {
  points: Point[];
  mode?: "always" | "if-outside";
  maxZoom?: number;
};

export default function AutoFitBounds({
  points,
  mode = "if-outside",
  maxZoom = 16,
}: Props) {
  const map = useMap();
  const firstFitDone = useRef(false);

  useEffect(() => {
    const validPoints = points.filter(
      (p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)
    );

    if (validPoints.length === 0) return;

    const bounds = L.latLngBounds(
      validPoints.map((p) => [p.lat, p.lng] as [number, number])
    );

    // PRIMER AJUSTE (cuando llegan datos)
    if (!firstFitDone.current) {
      map.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom,
      });
      firstFitDone.current = true;
      return;
    }

    if (mode === "always") {
      map.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom,
      });
      return;
    }

    const currentBounds = map.getBounds();

    const puntoFuera = validPoints.some(
      (p) => !currentBounds.contains([p.lat, p.lng])
    );

    if (puntoFuera) {
      map.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom,
      });
    }
  }, [points, map, mode, maxZoom]);

  return null;
}