import axios from "axios";

// Use your actual API root URL here if not using a Vite proxy:
const api = axios.create({
  baseURL: "/api", // or "http://localhost:8000/api" if not proxied
});

// Attach the access token (if any) to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
