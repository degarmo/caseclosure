// src/components/CaseList.jsx
import React from "react";

const cases = [
  {
    id: 1,
    name: "John Doe",
    title: "In Loving Memory of John Doe",
    crime_type: "Homicide",
    incident_date: "2024-01-15",
    status: "Open"
  },
  {
    id: 2,
    name: "Jane Smith",
    title: "Seeking Justice for Jane",
    crime_type: "Missing",
    incident_date: "2023-12-05",
    status: "Active"
  }
  // Add more as needed
];

export default function CaseList({ onClose }) {
  return (
    <div className="bg-white rounded-xl shadow p-8 w-full mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-xl">Case List</h2>
        <button
          onClick={onClose}
          className="text-sm px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
        >
          Close
        </button>
      </div>
      {cases.length === 0 ? (
        <div className="text-gray-400">No cases yet.</div>
      ) : (
        <table className="w-full table-auto">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Title</th>
              <th className="py-2">Crime Type</th>
              <th className="py-2">Incident Date</th>
              <th className="py-2">Status</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="py-2">{c.title}</td>
                <td className="py-2">{c.crime_type}</td>
                <td className="py-2">{c.incident_date}</td>
                <td className="py-2">{c.status}</td>
                <td className="py-2">
                  <button
                    className="text-blue-600 underline font-medium"
                    onClick={() => alert(`Go to case ${c.id}`)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
