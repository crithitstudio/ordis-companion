import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Platform-specific proxies for profile data
      "/api/warframe/profile/pc": {
        target: "https://content.warframe.com",
        changeOrigin: true,
        secure: false,
        rewrite: (path: string) => {
          const url = new URL(path, "http://localhost");
          const playerId = url.searchParams.get("playerId");
          return `/dynamic/getProfileViewingData.php?playerId=${playerId}`;
        },
      },
      "/api/warframe/profile/ps4": {
        target: "https://content-ps4.warframe.com",
        changeOrigin: true,
        secure: false,
        rewrite: (path: string) => {
          const url = new URL(path, "http://localhost");
          const playerId = url.searchParams.get("playerId");
          return `/dynamic/getProfileViewingData.php?playerId=${playerId}`;
        },
      },
      "/api/warframe/profile/xb1": {
        target: "https://content-xb1.warframe.com",
        changeOrigin: true,
        secure: false,
        rewrite: (path: string) => {
          const url = new URL(path, "http://localhost");
          const playerId = url.searchParams.get("playerId");
          return `/dynamic/getProfileViewingData.php?playerId=${playerId}`;
        },
      },
      "/api/warframe/profile/switch": {
        target: "https://content-swi.warframe.com",
        changeOrigin: true,
        secure: false,
        rewrite: (path: string) => {
          const url = new URL(path, "http://localhost");
          const playerId = url.searchParams.get("playerId");
          return `/dynamic/getProfileViewingData.php?playerId=${playerId}`;
        },
      },
      "/api/warframe": {
        target: "https://api.warframe.com",
        changeOrigin: true,
        rewrite: (path: string) =>
          path.replace(/^\/api\/warframe\/dynamic/, "/cdn"),
      },
      "/api/alecaframe": {
        target: "https://stats.alecaframe.com",
        changeOrigin: true,
        secure: false,
        rewrite: (path: string) =>
          path.replace(/^\/api\/alecaframe/, "/api/v1/public"),
      },
    },
  },
});
