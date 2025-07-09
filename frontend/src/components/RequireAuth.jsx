import React from "react";
import { Navigate, useLocation } from "react-router-dom";

// Replace with your real useAuth!
function useAuth() {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {}
  return { user, isAuthenticated: !!user };
}

export default function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login, preserve original location for post-login redirect
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}
