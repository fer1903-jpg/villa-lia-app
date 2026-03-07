"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const PUBLIC_PATHS = ["/", "/login", "/nuevo", "/mapa"];

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const isPublic = PUBLIC_PATHS.includes(pathname);

      if (isPublic) {
        if (mounted) setChecked(true);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const hasSession = !!data.session;

      if (!hasSession) {
        router.replace("/login");
        return;
      }

      if (mounted) setChecked(true);
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  if (!checked) {
    return <main style={{ padding: 20 }}>Cargando...</main>;
  }

  return <>{children}</>;
}