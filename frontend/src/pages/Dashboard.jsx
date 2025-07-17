import React from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  // Example stats (replace with real data as needed)
  const siteCount = 2;
  const recent = [
    { label: "Case Updated", date: "2024-06-30" },
    { label: "Tip Submitted", date: "2024-06-25" }
  ];

  return (
    <div className="w-full h-full px-4 py-8">
      {/* Stats/Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white rounded-xl p-8 shadow text-center w-full">
          <div className="text-5xl font-extrabold">{siteCount}</div>
          <div className="text-gray-500 mt-3 text-lg">Memorial Sites</div>
          <button
            className="mt-6 text-blue-600 underline font-medium"
            onClick={() => navigate("/memorial-sites")}
          >
            View Sites
          </button>
        </div>
        <div className="bg-white rounded-xl p-8 shadow text-center w-full">
          <div className="text-5xl font-extrabold">–</div>
          <div className="text-gray-500 mt-3 text-lg">Analytics</div>
          <span className="mt-6 block text-gray-400 text-sm">Coming soon</span>
        </div>
        <div className="bg-white rounded-xl p-8 shadow text-center w-full">
          <div className="text-5xl font-extrabold">–</div>
          <div className="text-gray-500 mt-3 text-lg">Notifications</div>
          <span className="mt-6 block text-gray-400 text-sm">Coming soon</span>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow p-8 w-full mt-8">
        <h2 className="font-bold mb-4 text-xl">Recent Activity</h2>
        <ul className="text-base text-gray-700">
          {recent.map((item, idx) => (
            <li key={idx} className="mb-2 flex items-center">
              <span className="inline-block w-3 h-3 bg-blue-600 rounded-full mr-3" />
              {item.label}
              <span className="text-gray-400 ml-4">{item.date}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 text-xs text-gray-400">More features coming soon.</div>
      </div>
    </div>
  );
}
