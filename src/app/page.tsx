"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f6f8",
        fontFamily: "Arial, sans-serif",
        padding: 20,
      }}
    >
      <div
        style={{
          maxWidth: 820,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            borderRadius: 18,
            boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
            padding: 24,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 34,
              color: "#10212b",
              textAlign: "center",
            }}
          >
            Seguridad Villa Lía
          </h1>

          <p
            style={{
              marginTop: 10,
              marginBottom: 0,
              textAlign: "center",
              color: "#4b5b66",
              fontSize: 16,
            }}
          >
            Plataforma de reportes e incidentes para vecinos y moderadores.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              justifyContent: "center",
              marginTop: 24,
            }}
          >
            <Link
              href="/nuevo"
              style={{
                display: "inline-block",
                padding: "12px 18px",
                borderRadius: 10,
                background: "#0f5c7a",
                color: "#ffffff",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Reportar incidente
            </Link>

            <Link
              href="/mapa"
              style={{
                display: "inline-block",
                padding: "12px 18px",
                borderRadius: 10,
                background: "#ffffff",
                color: "#0f5c7a",
                textDecoration: "none",
                fontWeight: 700,
                border: "2px solid #0f5c7a",
              }}
            >
              Ver mapa
            </Link>

            <Link
              href="/login"
              style={{
                display: "inline-block",
                padding: "12px 18px",
                borderRadius: 10,
                background: "#10212b",
                color: "#ffffff",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Login moderadores
            </Link>
          </div>
        </div>

        <div
          style={{
            marginTop: 18,
            background: "#ffffff",
            borderRadius: 18,
            boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
            padding: 24,
            textAlign: "center",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: 8,
              color: "#10212b",
              fontSize: 28,
            }}
          >
            Descargar app Android
          </h2>

          <p
            style={{
              marginTop: 0,
              marginBottom: 16,
              color: "#4b5b66",
              fontSize: 15,
            }}
          >
            Escaneá el QR desde tu teléfono Android o tocá el botón para descargar la app.
          </p>

          <img
            src="/qr-app-android.png"
            alt="QR descarga app Android"
            style={{
              width: 220,
              maxWidth: "100%",
              height: "auto",
              borderRadius: 12,
              background: "#ffffff",
              padding: 8,
              boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
            }}
          />

          <div style={{ marginTop: 18 }}>
            <a
              href="https://peebgtdzdcqbvlqqnpqj.supabase.co/storage/v1/object/public/apps/SEGVL.apk"
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-block",
                padding: "12px 18px",
                borderRadius: 10,
                background: "#0f5c7a",
                color: "#ffffff",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Descargar APK
            </a>
          </div>

          <p
            style={{
              marginTop: 14,
              marginBottom: 0,
              color: "#6b7a84",
              fontSize: 13,
            }}
          >
            Archivo: SEGVL.apk
          </p>
        </div>
      </div>
    </main>
  );
}