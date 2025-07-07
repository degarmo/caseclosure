import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/", // or your deployed API base
});

// Add JWT token to every request if available
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem("access");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Handle 401 errors: try to refresh the token and retry the original request
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const refresh = localStorage.getItem("refresh");
        if (!refresh) throw new Error("No refresh token");

        const res = await axios.post(
          "http://127.0.0.1:8000/api/auth/token/refresh/",
          { refresh }
        );
        localStorage.setItem("access", res.data.access);
        originalRequest.headers["Authorization"] = `Bearer ${res.data.access}`;
        return api(originalRequest); // retry the original request
      } catch (e) {
        // Refresh failed, force logout
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        window.location.href = "/login";
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
