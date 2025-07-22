import React, { useEffect, useState } from "react";
import api from "@/utils/axios";

export default function CaseList() {
  // User/admin check (from localStorage, change to Context if needed)
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {}
  const isAdmin = user?.is_staff || user?.is_superuser;

  if (!isAdmin) {
    return (
      <div className="p-8 text-red-600 font-bold">
        Access Denied. This page is for administrators only.
      </div>
    );
  }

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all cases on mount
  useEffect(() => {
    api
      .get("/cases/")
      .then((res) => {
        setCases(res.data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e?.response?.data?.detail || e.toString());
        setLoading(false);
      });
  }, []);

  // Enable/Disable a case
  const toggleDisable = (caseId, isDisabled) => {
    api
      .patch(`/cases/${caseId}/`, { is_disabled: !isDisabled })
      .then((res) => {
        setCases((prev) =>
          prev.map((c) => (c.id === res.data.id ? res.data : c))
        );
      });
  };

  // Delete a case
  const deleteCase = (caseId) => {
    if (!window.confirm("Are you sure you want to delete this case?")) return;
    api.delete(`/cases/${caseId}/`).then(() => {
      setCases((prev) => prev.filter((c) => c.id !== caseId));
    });
  };

  if (loading) return <div>Loading cases...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  return (
    <div className="bg-white rounded-xl shadow p-8 w-full mt-8">
      <h2 className="font-bold text-xl mb-4">Case List</h2>
      {cases.length === 0 ? (
        <div>No cases found.</div>
      ) : (
        <table className="w-full table-auto">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Title</th>
              <th className="py-2">Victim</th>
              <th className="py-2">Incident Date</th>
              <th className="py-2">Reward ($)</th>
              <th className="py-2">Status</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => (
              <tr
                key={c.id}
                className={c.is_disabled ? "bg-gray-100 text-gray-400" : ""}
              >
                <td className="py-2">{c.name}</td>
                <td className="py-2">{c.victim_name}</td>
                <td className="py-2">{c.incident_date || ""}</td>
                <td className="py-2">{c.reward_amount || ""}</td>
                <td className="py-2">
                  {c.is_disabled ? (
                    <span className="px-2 py-1 bg-gray-300 rounded text-xs">
                      Disabled
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-green-200 rounded text-xs">
                      Active
                    </span>
                  )}
                </td>
                <td className="py-2">
                  <button
                    className="text-sm text-blue-700 underline mr-2"
                    onClick={() => toggleDisable(c.id, c.is_disabled)}
                  >
                    {c.is_disabled ? "Enable" : "Disable"}
                  </button>
                  <button
                    className="text-sm text-red-700 underline"
                    onClick={() => deleteCase(c.id)}
                  >
                    Delete
                  </button>
                  {/* Add Edit button/modal here if needed */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}