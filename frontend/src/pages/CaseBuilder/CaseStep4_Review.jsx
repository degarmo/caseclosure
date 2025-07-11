// src/pages/CaseBuilder/CaseStep4_Review.jsx
import React, { useState } from "react";

export default function CaseStep4_Review({ data, back, next, isLast }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // You might want to replace this with an API call to save the memorial
  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      // Fake API call or trigger parent submit logic
      // await api.post("/memorial-sites/", data);
      setSuccess("Memorial site created successfully!");
      next(); // Or redirect, or whatever comes after
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white shadow-lg rounded-lg p-8">
      <h2 className="text-2xl font-bold mb-6 text-center">Review & Submit</h2>
      <div className="mb-6 space-y-3">
        <div>
          <span className="font-bold">Name:</span> {data.name || "—"}
        </div>
        <div>
          <span className="font-bold">Template:</span> {data.template || "—"}
        </div>
        <div>
          <span className="font-bold">Selected Widgets:</span>{" "}
          {data.widgets?.length ? data.widgets.join(", ") : "—"}
        </div>
        {/* Add more fields as needed */}
      </div>
      {error && <div className="text-red-600 mb-3">{error}</div>}
      {success && <div className="text-green-600 mb-3">{success}</div>}
      <div className="flex justify-between mt-8">
        <button
          type="button"
          className="bg-gray-300 text-gray-700 font-bold px-6 py-2 rounded hover:bg-gray-400"
          onClick={back}
          disabled={submitting}
        >
          Back
        </button>
        <button
          type="button"
          className="bg-blue-600 text-white font-bold px-6 py-2 rounded hover:bg-blue-700"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
}
