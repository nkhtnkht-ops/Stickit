import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  base: "/Stickit/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png"],
      manifest: {
        name: "Stickit",
        short_name: "Stickit",
        description: "TickTick互換タスク管理 PWA",
        start_url: "/Stickit/",
        scope: "/Stickit/",
        display: "standalone",
        background_color: "#FAFAFA",
        theme_color: "#00C853",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
    }),
  ],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
