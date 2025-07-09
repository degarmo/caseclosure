import React from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  // Example stats—replace with real data calls if desired
  const siteCount = 2; // Replace with actual count
  const recent = [
    { label: "Case Updated", date: "2024-06-30" },
    { label: "Tip Submitted", date: "2024-06-25" }
  ];

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Welcome to CaseClosure.org</h1>
      <p className="mb-6 text-gray-700">Your private justice dashboard.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow text-center">
          <div className="text-4xl font-bold">{siteCount}</div>
          <div className="text-gray-500 mt-2">Memorial Sites</div>
          <button
            className="mt-4 text-blue-600 underline"
            onClick={() => navigate("/memorial-sites")}
          >
            View Sites
          </button>
        </div>
        <div className="bg-white rounded-xl p-6 shadow text-center">
          <div className="text-4xl font-bold">–</div>
          <div className="text-gray-500 mt-2">Analytics</div>
          <span className="mt-4 block text-gray-400 text-xs">Coming soon</span>
        </div>
        <div className="bg-white rounded-xl p-6 shadow text-center">
          <div className="text-4xl font-bold">–</div>
          <div className="text-gray-500 mt-2">Notifications</div>
          <span className="mt-4 block text-gray-400 text-xs">Coming soon</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="font-bold mb-2 text-lg">Recent Activity</h2>
        <ul className="text-sm text-gray-700">
          {recent.map((item, idx) => (
            <li key={idx} className="mb-1 flex items-center">
              <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mr-2" />
              {item.label} <span className="text-gray-400 ml-2">{item.date}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 text-xs text-gray-400">More features coming soon.</div>
      </div>
    </div>
  );
}
