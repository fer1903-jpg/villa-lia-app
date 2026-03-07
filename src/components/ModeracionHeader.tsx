"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  username: string | null;
  role: string | null;
};

export default function ModeracionHeader({ username, role }: Props) {
  const pathname = usePathname();

  const links = [
    { href: "/mapa", label: "Mapa de incidentes" },
    { href: "/moderacion", label: "Inicio" },
    { href: "/moderacion/mapa", label: "Mapa operativo" },
    { href: "/moderacion/zonas", label: "Zonas críticas" },
    { href: "/moderacion/zonas/calor", label: "Mapa de calor" },
  ];

  return (
    <header
      style={{
        background: "#0f5c7a",
        color: "#ffffff",
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          fontWeight: 800,
          fontSize: 18,
          whiteSpace: "nowrap",
        }}
      >
        Seguridad Villa Lía
      </div>

      <nav
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "center",
          flex: 1,
        }}
      >
        {links.map((link) => {
          const active = pathname === link.href;

          const isMapaIncidentes = link.href === "/mapa";

          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                color: "#ffffff",
                textDecoration: "none",
                fontWeight: 700,
                padding: "8px 12px",
                borderRadius: 8,
                background: active
                  ? "rgba(255,255,255,0.22)"
                  : isMapaIncidentes
                  ? "rgba(255,255,255,0.14)"
                  : "transparent",
                border: isMapaIncidentes
                  ? "1px solid rgba(255,255,255,0.28)"
                  : "1px solid transparent",
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          opacity: 0.92,
          whiteSpace: "nowrap",
        }}
      >
        {username ? `${username} (${role})` : ""}
      </div>
    </header>
  );
}