import ModeracionMapView from "../../../components/ModeracionMapView";

export default function ModeracionMapaPage() {
  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: 34, color: "#10212b" }}>
          Mapa operativo
        </h1>
        <p style={{ marginTop: 8, color: "#4b5b66", fontFamily: "Arial, sans-serif" }}>
          Vista en tiempo real para seguimiento y resolución de incidentes.
        </p>
      </div>

      <ModeracionMapView />
    </div>
  );
}