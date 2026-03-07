"use client";

import Link from "next/link";

export default function FloatingReportButton() {
  return (
    <Link
      href="/nuevo"
      style={{
        position: "absolute",
        right: 18,
        bottom: 18,
        zIndex: 1100,
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        textDecoration: "none",
        background: "#d94a38",
        color: "#ffffff",
        padding: "14px 18px",
        borderRadius: "999px",
        fontFamily: "Arial, sans-serif",
        fontWeight: 700,
        fontSize: "15px",
        boxShadow: "0 10px 24px rgba(0,0,0,0.25)",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.18)",
          fontSize: "18px",
          lineHeight: 1,
        }}
      >
        +
      </span>
      <span>Reportar incidente</span>
    </Link>
  );
}