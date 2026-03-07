"use client";

import Link from "next/link";

export default function AppHeader() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        background: "#0f5c7a",
        color: "white",
        padding: "12px 16px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            fontSize: "22px",
            fontWeight: 700,
          }}
        >
          Seguridad
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <a
            href="tel:911"
            style={{
              textDecoration: "none",
              color: "white",
              background: "#c62828",
              padding: "10px 16px",
              borderRadius: "10px",
              fontWeight: 700,
              boxShadow: "0 6px 14px rgba(198,40,40,0.25)",
            }}
          >
            911
          </a>

          <Link
            href="/moderacion"
            style={{
              textDecoration: "none",
              color: "#0f5c7a",
              background: "white",
              padding: "10px 16px",
              borderRadius: "10px",
              fontWeight: 700,
            }}
          >
            Informes
          </Link>
        </div>
      </div>
    </header>
  );
}