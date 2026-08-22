import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

if (!process.env.VITE_API_URL) {
  console.warn(
    "\n[vite] WARNING: VITE_API_URL is not set. " +
    "The dev fallback (http://localhost:5001) will be baked into this build.\n"
  );
}

export default defineConfig({
  server: {
    port: 5174,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "charts", test: /[\\/]node_modules[\\/](recharts|d3-[a-z-]+|victory-[a-z-]+|internmap)[\\/]/ },
            { name: "vendor", test: /[\\/]node_modules[\\/]/ },
          ],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["pwa-icon.svg", "favicon.svg"],
      manifest: {
        name: "Expense Tracker",
        short_name: "Expenses",
  
        description: "Track income and expenses, visualize spending patterns",
        theme_color: "#10b981",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "pwa-icon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "pwa-icon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,json}"],
      },
    }),
  ],
});
