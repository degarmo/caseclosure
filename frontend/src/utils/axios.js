import axios from "axios";

// Determine the API URL based on environment
const getAPIBaseURL = () => {
  // In development, use the Vite proxy
  if (import.meta.env.DEV) {
    return "/api";
  }
  
  // In production, use environment variable or fallback
  // Set VITE_API_URL in your Render environment variables
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Production fallback - adjust this to your actual backend URL
  return "https://caseclosure-api.onrender.com/api";
};

const api = axios.create({
  baseURL: "http://localhost:8000/api", // Hardcode for now instead of "/api"
});

//const api = axios.create({
//  baseURL: getAPIBaseURL(),
//  timeout: 30000,
//  headers: {
//    'Content-Type': 'application/json',
//  },
//});

// Attach the access token (if any) to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access") || 
                   localStorage.getItem("authToken") || 
                   localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses (optional but recommended)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear tokens and redirect to login
      localStorage.removeItem("access");
      localStorage.removeItem("authToken");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/signin')) {
        window.location.href = '/signin';
      }
    }
    return Promise.reject(error);
  }
);

export default api;