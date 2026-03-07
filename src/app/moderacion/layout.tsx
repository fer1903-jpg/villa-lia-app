import ModeracionHeader from "../../components/ModeracionHeader";

export default function ModeracionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main style={{ minHeight: "100vh", background: "#f4f6f8", fontFamily: "Arial, sans-serif" }}>
      <ModeracionHeader />
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: 20 }}>
        {children}
      </section>
    </main>
  );
}