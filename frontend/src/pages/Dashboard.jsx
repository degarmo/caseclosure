import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Retrieve token from localStorage
    const token = localStorage.getItem("access");
    if (!token) return;

    axios.get("http://127.0.0.1:8000/api/auth/user/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  return (
    <div className="bg-slate-100 min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8 mb-8">
          <h1 className="text-3xl font-bold mb-2 text-blue-600">
            Welcome{user ? `, ${user.username}` : ""}!
          </h1>
          <p className="text-slate-600 mb-6">
            This is your CaseClosure dashboard.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-lg p-6 shadow">
              <h2 className="text-xl font-semibold mb-2">Create a Memorial Site</h2>
              <p className="text-slate-600 mb-4">
                Honor your loved one and start tracking leads.
              </p>
              <button
                className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 transition"
                // onClick={() => ...} // To hook up your create form/modal
              >
                Create Memorial Site
              </button>
            </div>
            <div className="bg-slate-50 rounded-lg p-6 shadow">
              <h2 className="text-xl font-semibold mb-2">Your Sites</h2>
              <p className="text-slate-600 mb-4">
                List and manage all your memorial pages here.
              </p>
              <div className="text-slate-400">No sites yet.</div>
            </div>
          </div>
        </div>
        {/* Placeholder for analytics or future dashboard widgets */}
        <div className="bg-white shadow rounded-lg p-6 text-slate-500 text-center">
          Visitor Analytics Coming Soon!
        </div>
      </div>
    </div>
  );
}
