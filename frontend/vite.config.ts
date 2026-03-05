import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy /tts-proxy/* → https://translate.googleapis.com/*
      // Browser gọi localhost → không bị CORS, server-side request Google
      "/tts-proxy": {
        target: "https://translate.googleapis.com",
        changeOrigin: true,       // Đổi header Origin → tránh bị Google chặn
        rewrite: (path) => path.replace(/^\/tts-proxy/, ""),
        headers: {
          // Giả lập browser request thông thường
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://translate.google.com/",
        },
      },
    },
  },
});