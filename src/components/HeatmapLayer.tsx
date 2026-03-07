"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

type HeatPoint = [number, number, number?];

export default function HeatmapLayer({
  points,
}: {
  points: HeatPoint[];
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !points.length) return;

    const heatLayer = (L as any).heatLayer(points, {
      radius: 28,
      blur: 22,
      maxZoom: 18,
      minOpacity: 0.35,
      gradient: {
        0.2: "#64b5f6",
        0.4: "#4caf50",
        0.6: "#ffd54f",
        0.8: "#ef6c00",
        1.0: "#c62828",
      },
    });

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}