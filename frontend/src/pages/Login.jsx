import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await axios.post("http://127.0.0.1:8000/api/auth/login/", form, {
        headers: { "Content-Type": "application/json" },
      });
      // Store tokens (for later use in AuthContext)
      localStorage.setItem("access", response.data.access);
      localStorage.setItem("refresh", response.data.refresh);
      // Redirect to dashboard or protected route
      navigate("/dashboard");
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
        "Login failed. Check your credentials."
      );
    }
  };

  return (
    <div className="container mx-auto px-4 h-full flex flex-col justify-center items-center min-h-screen bg-white">
      <div className="w-full max-w-md px-4">
        <div className="shadow-lg rounded-lg bg-white border-0">
          <div className="rounded-t px-6 py-6">
            <div className="text-center mb-3">
              <h6 className="text-slate-500 text-lg font-bold">Sign In</h6>
            </div>
            <hr className="mt-6 border-b-1 border-slate-300" />
          </div>
          <div className="px-6 py-6">
            {error && (
              <div className="mb-4 text-red-500 text-center">{error}</div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-slate-600 text-xs font-bold mb-2">
                  Username
                </label>
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  type="text"
                  className="border-0 px-3 py-3 placeholder-slate-300 text-slate-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full"
                  placeholder="Username or Email"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-slate-600 text-xs font-bold mb-2">
                  Password
                </label>
                <input
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  type="password"
                  className="border-0 px-3 py-3 placeholder-slate-300 text-slate-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full"
                  placeholder="Password"
                  required
                />
              </div>
              <div className="text-center mt-6">
                <button
                  className="bg-blue-500 text-white active:bg-blue-600 text-sm font-bold uppercase px-6 py-3 rounded shadow hover:shadow-lg focus:outline-none w-full"
                  type="submit"
                >
                  Sign In
                </button>
              </div>
            </form>
            <div className="mt-4 text-center">
              <span className="text-slate-600 text-sm">Don't have an account? </span>
              <a href="/signup" className="text-blue-500 hover:text-blue-700 font-semibold text-sm">
                Sign Up
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
