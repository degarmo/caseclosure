// CaseBuilder.jsx - Simplified version that goes directly to PageBuilder
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import PageBuilder from "../PageBuilder";
import api from "@/utils/axios";

export default function CaseBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCase = async () => {
      try {
        if (!id) {
          // If no ID, redirect to dashboard - case creation should be done via modal
          console.log("[CaseBuilder] No ID provided, redirecting to dashboard");
          navigate("/dashboard");
          return;
        }

        const res = await api.get(`/cases/${id}/`);
        const caseInfo = res.data;

        console.log("[CaseBuilder] Loaded case from DB:", caseInfo);

        setCaseData(caseInfo);
        setError("");
      } catch (err) {
        console.error("Error fetching case:", err);
        setError("Could not load case. Redirecting to dashboard...");
        setTimeout(() => navigate("/dashboard"), 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchCase();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading case...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  if (!caseData || !caseData.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No case data available.</p>
          <Link to="/dashboard" className="text-blue-600 hover:underline">
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Go directly to PageBuilder - no more multi-step forms!
  // The PageBuilder will handle all the case editing
  return <PageBuilder data={caseData} />;
}