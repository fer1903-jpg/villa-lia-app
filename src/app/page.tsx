import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        fontFamily: "Arial, sans-serif",
        backgroundImage: "url('/images/villa-lia.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.52)",
        }}
      />

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 420,
          background: "rgba(255,255,255,0.96)",
          borderRadius: 18,
          padding: 26,
          boxShadow: "0 16px 42px rgba(0,0,0,0.28)",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            marginTop: 0,
            marginBottom: 8,
            fontSize: 36,
            color: "#10212b",
          }}
        >
          Seguridad
        </h1>

        <p
          style={{
            marginTop: 0,
            marginBottom: 22,
            color: "#4b5b66",
            fontSize: 15,
          }}
        >
          Villa Lía · San Antonio de Areco
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <Link
            href="/nuevo"
            style={{
              textDecoration: "none",
              background: "#c62828",
              color: "#fff",
              padding: "16px 16px",
              borderRadius: 12,
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: "0.4px",
              boxShadow: "0 10px 22px rgba(198,40,40,0.32)",
            }}
          >
            🚨 REPORTAR INCIDENTE
          </Link>

          <Link
            href="/login"
            style={{
              textDecoration: "none",
              background: "#ffffff",
              color: "#0f5c7a",
              border: "1px solid #0f5c7a",
              padding: "12px 14px",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            Login moderadores / admin
          </Link>
        </div>

        <div
          style={{
            marginTop: 22,
            paddingTop: 16,
            borderTop: "1px solid #e5eaee",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              color: "#31424d",
              marginBottom: 10,
              fontSize: 14,
            }}
          >
            Teléfonos útiles
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <a
              href="tel:+542326403653"
              style={{
                display: "block",
                textDecoration: "none",
                background: "#d94a38",
                color: "white",
                padding: "12px",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              Bomberos Villa Lía
            </a>

            <a
              href="tel:911"
              style={{
                display: "block",
                textDecoration: "none",
                background: "#1f3c88",
                color: "white",
                padding: "12px",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              Emergencias 911
            </a>
          </div>
        </div>
      </div>
<div
  style={{
    marginTop: 18,
    background: "#ffffff",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    textAlign: "center",
  }}
>
  <h3 style={{ margin: "0 0 8px", color: "#10212b" }}>Descargar app Android</h3>

  <p style={{ margin: "0 0 12px", color: "#4b5 ​:contentReference[oaicite:0]{index=0}​
    </main>
  );
}