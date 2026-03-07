"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { supabase } from "../../lib/supabase";
import AppHeader from "../../components/AppHeader";

const MapPicker = dynamic(() => import("../../components/MapPicker"), {
  ssr: false,
});

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
};

type TipoIncidente = "Robo" | "Accidente" | "Iluminación" | "Vandalismo" | "Otro";

function getTipoStyles(tipo: TipoIncidente, selected: boolean) {
  const colors: Record<TipoIncidente, { bg: string; border: string; text: string }> = {
    Robo: { bg: "#ff3b30", border: "#ff3b30", text: "#ffffff" },
    Accidente: { bg: "#9e9e9e", border: "#9e9e9e", text: "#ffffff" },
    Iluminación: { bg: "#64b5f6", border: "#64b5f6", text: "#ffffff" },
    Vandalismo: { bg: "#ffd54f", border: "#ffd54f", text: "#3a2b00" },
    Otro: { bg: "#8d6e63", border: "#8d6e63", text: "#ffffff" },
  };

  const c = colors[tipo];

  return {
    padding: "12px 16px",
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    border: "none",
    background: selected ? c.bg : "#ffffff",
    color: selected ? c.text : c.bg,
    boxShadow: selected
      ? "0 6px 14px rgba(0,0,0,0.18)"
      : `0 0 0 2px ${c.border} inset`,
  };
}

export default function NuevoReportePage() {
  const router = useRouter();

  const [tipo, setTipo] = useState<TipoIncidente>("Robo");
  const [descripcion, setDescripcion] = useState("");
  const [direccion, setDireccion] = useState("");
  const [direccionValidada, setDireccionValidada] = useState<string | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [imagen, setImagen] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const tipos: TipoIncidente[] = ["Robo", "Accidente", "Iluminación", "Vandalismo", "Otro"];

  async function validarDireccionConMapa() {
    setMsg("");
    setDireccionValidada(null);

    const q = direccion.trim();
    if (!q) {
      setMsg("Ingresá una dirección primero.");
      return;
    }

    try {
      const url =
        "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" +
        encodeURIComponent(q);

      const res = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        setMsg("No se pudo validar la dirección.");
        return;
      }

      const data = (await res.json()) as NominatimResult[];

      if (!data.length) {
        setMsg("No encontré esa dirección. Probá agregando localidad y provincia.");
        return;
      }

      const first = data[0];
      setLat(Number(first.lat));
      setLng(Number(first.lon));
      setDireccionValidada(first.display_name);
      setMsg("Dirección validada correctamente.");
    } catch {
      setMsg("Ocurrió un error al validar la dirección.");
    }
  }

  function usarGeolocalizacion() {
    setMsg("");
    setDireccionValidada(null);

    if (!navigator.geolocation) {
      setMsg("Tu navegador no soporta geolocalización.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setMsg("Ubicación obtenida correctamente.");
      },
      (err) => {
        setMsg("No se pudo obtener la ubicación: " + err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }

  async function subirImagen(): Promise<string | null> {
    if (!imagen) return null;

    const ext = imagen.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
    const fileName = `incidente-${Date.now()}.${safeExt}`;

    const { error } = await supabase.storage
      .from("incidentes")
      .upload(fileName, imagen, {
        upsert: false,
        contentType: imagen.type || "image/jpeg",
      });

    if (error) {
      throw new Error("No se pudo subir la imagen: " + error.message);
    }

    const { data } = supabase.storage.from("incidentes").getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function guardar() {
    setMsg("");
    setLoading(true);

    if (lat == null || lng == null) {
      setLoading(false);
      setMsg("Falta ubicación. Validá una dirección o usá geolocalización.");
      return;
    }

    if (tipo === "Otro" && !descripcion.trim()) {
      setLoading(false);
      setMsg("Si elegís 'Otro', la descripción es obligatoria.");
      return;
    }

    try {
      const imagenUrl = await subirImagen();

      const { error } = await supabase.from("reportes").insert([
        {
          tipo,
          descripcion: descripcion.trim() || null,
          lat,
          lng,
          estado: "pendiente",
          imagen_url: imagenUrl,
        },
      ]);

      setLoading(false);

      if (error) {
        setMsg("Error al guardar: " + error.message);
        return;
      }

      setMsg("Incidente enviado correctamente.");

      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (e) {
      setLoading(false);
      setMsg(e instanceof Error ? e.message : "Ocurrió un error al enviar el incidente.");
    }
  }

  return (
    <main
      style={{
        fontFamily: "Arial, sans-serif",
        background: "#f4f6f8",
        minHeight: "100vh",
      }}
    >
      <AppHeader />

      <section style={{ padding: 20, maxWidth: 820, margin: "0 auto" }}>
        <div style={{ marginBottom: 18 }}>
          <h1 style={{ margin: 0, fontSize: 32, color: "#10212b" }}>Nuevo incidente</h1>
          <p style={{ marginTop: 8, color: "#4b5b66" }}>
            Completá los datos y fijá la ubicación en el mapa.
          </p>
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: 16,
            boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
            padding: 24,
          }}
        >
          <label
            style={{
              display: "block",
              fontWeight: 700,
              color: "#31424d",
              marginBottom: 10,
            }}
          >
            Tipo de incidente
          </label>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 6,
            }}
          >
            {tipos.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                style={getTipoStyles(t, tipo === t)}
              >
                {t}
              </button>
            ))}
          </div>

          <label
            style={{
              display: "block",
              marginTop: 14,
              fontWeight: 700,
              color: "#31424d",
            }}
          >
            Descripción {tipo === "Otro" ? "(obligatoria)" : "(opcional)"}
          </label>

          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder={
              tipo === "Otro"
                ? "Describí el incidente para poder enviarlo."
                : "Agregá detalles que ayuden a identificar el incidente."
            }
            style={{
              width: "100%",
              padding: 12,
              marginTop: 6,
              borderRadius: 10,
              border: "1px solid #cfd8df",
              fontSize: 16,
              minHeight: 110,
              boxSizing: "border-box",
              resize: "vertical",
            }}
          />

          <label
            style={{
              display: "block",
              marginTop: 14,
              fontWeight: 700,
              color: "#31424d",
            }}
          >
            Dirección
          </label>

          <input
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Ej: San Martín 123, Villa Lía, Buenos Aires"
            style={{
              width: "100%",
              padding: 12,
              marginTop: 6,
              borderRadius: 10,
              border: "1px solid #cfd8df",
              fontSize: 16,
              boxSizing: "border-box",
            }}
          />

          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={validarDireccionConMapa}
              disabled={loading}
              style={{
                padding: "12px 16px",
                borderRadius: 10,
                border: "none",
                background: "#0f5c7a",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Validar dirección
            </button>

            <button
              type="button"
              onClick={usarGeolocalizacion}
              disabled={loading}
              style={{
                padding: "12px 16px",
                borderRadius: 10,
                border: "1px solid #0f5c7a",
                background: "#fff",
                color: "#0f5c7a",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Usar mi ubicación
            </button>
          </div>

          {direccionValidada && (
            <p style={{ marginTop: 12, color: "#31424d" }}>
              <b>Dirección validada:</b> {direccionValidada}
            </p>
          )}

          <div style={{ marginTop: 16 }}>
           <MapPicker
  lat={lat}
  lng={lng}
  onPick={(a, o) => {
    setLat(a);
    setLng(o);
    setMsg("Ubicación ajustada manualmente en el mapa.");
  }}
/>
          </div>

          <p style={{ marginTop: 10, color: "#31424d" }}>
            <b>Coordenadas:</b> {lat?.toFixed(6) ?? "-"}, {lng?.toFixed(6) ?? "-"}
          </p>

          <small style={{ color: "#5f6d76" }}>
            Podés hacer click en el mapa para ajustar la ubicación.
          </small>

          <label
            style={{
              display: "block",
              marginTop: 18,
              fontWeight: 700,
              color: "#31424d",
            }}
          >
            Imagen del incidente
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImagen(e.target.files?.[0] || null)}
            style={{ marginTop: 8, display: "block" }}
          />

          {imagen && (
            <p style={{ marginTop: 8, color: "#31424d" }}>
              Imagen seleccionada: <b>{imagen.name}</b>
            </p>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
  <button
    type="button"
    onClick={guardar}
    disabled={loading}
    style={{
      padding: "12px 18px",
      borderRadius: 10,
      border: "none",
      background: "#0f5c7a",
      color: "#fff",
      fontWeight: 700,
      cursor: "pointer",
    }}
  >
    {loading ? "Enviando..." : "Enviar incidente"}
  </button>

  <button
    type="button"
    onClick={() => router.push("/")}
    disabled={loading}
    style={{
      padding: "12px 18px",
      borderRadius: 10,
      border: "1px solid #0f5c7a",
      background: "#fff",
      color: "#0f5c7a",
      fontWeight: 700,
      cursor: "pointer",
    }}
  >
    Cancelar
  </button>
</div>

          {msg && (
            <p style={{ marginTop: 14, whiteSpace: "pre-wrap", color: "#8a1f1f" }}>{msg}</p>
          )}
        </div>
      </section>
    </main>
  );
}