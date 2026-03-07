import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.villalia.seguridad",
  appName: "Seguridad Villa Lía",
  webDir: "www",
  server: {
    url: "https://fer1903-jpg-villa-lia-app.vercel.app",
    cleartext: true
  }
};

export default config;