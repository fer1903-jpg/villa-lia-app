"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {

  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const login = async () => {

    setError("");

    let email = usuario;

    // si no parece email, buscarlo por username
    if (!usuario.includes("@")) {

      const { data, error } = await supabase
        .rpc("get_email_by_username", { p_username: usuario });

      if (error || !data) {
        setError("Usuario no encontrado");
        return;
      }

      email = data;
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (loginError) {
      setError("Credenciales incorrectas");
      return;
    }

    window.location.href = "/mapa";
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}
    >

      <div style={{ width: 320 }}>

        <h2>Login Moderación</h2>

        <input
          placeholder="Usuario o email"
          value={usuario}
          onChange={(e)=>setUsuario(e.target.value)}
          style={{ width:"100%", marginBottom:10, padding:10 }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          style={{ width:"100%", marginBottom:10, padding:10 }}
        />

        <button
          onClick={login}
          style={{
            width:"100%",
            padding:10,
            background:"#0f5c7a",
            color:"white",
            borderRadius:8
          }}
        >
          Entrar
        </button>

        {error && (
          <p style={{ color:"red", marginTop:10 }}>
            {error}
          </p>
        )}

      </div>

    </main>
  );
}