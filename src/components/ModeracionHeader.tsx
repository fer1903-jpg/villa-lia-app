"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Props = {
  username?: string;
  role?: string;
};

export default function ModeracionHeader({ username, role }: Props) {
  const router = useRouter();

  async function salir() {
    try {
      await supabase.auth.signOut();
    } catch {
      // no bloquea navegación
    }
    router.push("/login");
  }

  return (
    <header
      style={{
        background: "#10212b",
        color: "#ffffff",
        padding: "16px 20px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Moderación</div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>
            {username ? `${username}${role ? ` · ${role}` : ""}` : "Panel de control"}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/moderacion"
            style={{
              color: "#ffffff",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            Inicio
          </Link>

          <button
            type="button"
            onClick={salir}
            style={{
              background: "#c62828",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "10px 14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}