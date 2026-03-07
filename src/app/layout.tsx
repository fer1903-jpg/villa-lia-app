import type { Metadata } from "next";
import AuthGuard from "../components/AuthGuard";

export const metadata: Metadata = {
  title: "Seguridad Villa Lía",
  description: "App de seguridad vecinal de Villa Lía",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif" }}>
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}
