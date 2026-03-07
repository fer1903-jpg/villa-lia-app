export type ZonaVillaLia = {
  id: string;
  nombre: string;
  bounds: {
    latMin: number;
    latMax: number;
    lngMin: number;
    lngMax: number;
  };
};

export const ZONAS_VILLA_LIA: ZonaVillaLia[] = [
  {
    id: "norte",
    nombre: "Norte",
    bounds: {
      latMin: -34.1242,
      latMax: -34.1185,
      lngMin: -59.4315,
      lngMax: -59.4190,
    },
  },
  {
    id: "oeste",
    nombre: "Oeste",
    bounds: {
      latMin: -34.1318,
      latMax: -34.1242,
      lngMin: -59.4400,
      lngMax: -59.4288,
    },
  },
  {
    id: "centro",
    nombre: "Centro",
    bounds: {
      latMin: -34.1318,
      latMax: -34.1242,
      lngMin: -59.4288,
      lngMax: -59.4228,
    },
  },
  {
    id: "este",
    nombre: "Este",
    bounds: {
      latMin: -34.1318,
      latMax: -34.1242,
      lngMin: -59.4228,
      lngMax: -59.4170,
    },
  },
  {
    id: "sur",
    nombre: "Sur",
    bounds: {
      latMin: -34.1395,
      latMax: -34.1318,
      lngMin: -59.4330,
      lngMax: -59.4185,
    },
  },
];

export function obtenerZona(lat: number, lng: number): string {
  const zona = ZONAS_VILLA_LIA.find(
    (z) =>
      lat >= z.bounds.latMin &&
      lat <= z.bounds.latMax &&
      lng >= z.bounds.lngMin &&
      lng <= z.bounds.lngMax
  );

  return zona ? zona.nombre : "Exterior";
}