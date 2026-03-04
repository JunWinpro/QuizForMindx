// src/api/axios.ts
import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

// Không gắn token vào các route auth (login/register)
api.interceptors.request.use((config) => {
  try {
    const isAuthRoute = config.url?.startsWith("/auth/");
    if (!isAuthRoute) {
      const token = localStorage.getItem("token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (e) {
    // ignore
  }
  return config;
});

export default api;