import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Step1_Basics from "./CaseBuilder/CaseStep1_Basics";
import Step2_CrimeData from "./CaseBuilder/CaseStep2_CrimeData";
import Step3_TemplateLogo from "./CaseBuilder/CaseStep3_TemplateLogo";
import api from "@/utils/axios";

const steps = [
  { label: "About", component: Step1_Basics },
  { label: "Incident", component: Step2_CrimeData },
  { label: "Template", component: Step3_TemplateLogo },
];

function getDisplayName(caseData, id) {
  if (!caseData) return "Case Details";
  const first = (caseData.first_name || "").trim();
  const last = (caseData.last_name || "").trim();
  if (first || last) return `${first} ${last}`.trim();
  const victim = (caseData.victim_name || "").trim();
  if (victim) return victim;
  const name = (caseData.name || "").trim();
  if (name) return name;
  const title = (caseData.title || "").trim();
  if (title) return title;
  return `Case #${id}`;
}

export default function CaseBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Wizard state
  const [step, setStep] = useState(0);

  // Data
  const [caseData, setCaseData] = useState(null);
  const [editBuffer, setEditBuffer] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    api.get(`/cases/${id}/`)
      .then(res => {
        setCaseData(res.data);
        setEditBuffer(res.data);
        setError("");
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load case.");
        setCaseData(null);
        setEditBuffer({});
        setLoading(false);
      });
  }, [id]);

  const handleVisit = () => {
    if (caseData && caseData.public_url) window.open(caseData.public_url, "_blank");
  };

  // Navigation handlers ONLY via child forms
  const handleNextStep = (data) => {
    setEditBuffer(prev => ({ ...prev, ...data }));
    setStep(s => Math.min(steps.length - 1, s + 1));
  };
  const handlePrevStep = () => setStep(s => Math.max(0, s - 1));

  // Current step
  const StepComponent = steps[step].component;
  const isLast = step === steps.length - 1;

  return (
    <div className="max-w-3xl mx-auto p-4 pt-8">
      <div className="mb-4 flex items-center gap-4">
        <Link to="/dashboard" className="text-blue-600 hover:underline text-sm">&larr; Back to Dashboard</Link>
        <div className="flex-1 text-center">
          <span className="text-xl font-bold">
            {getDisplayName(caseData, id)}
          </span>
        </div>
        <select
          value={caseData?.status || "draft"}
          className="border rounded px-3 py-1"
          disabled
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      {caseData?.template && (
        <div className="flex flex-col items-center mb-6">
          <span className="block text-xs text-gray-500 mb-1">Template</span>
          <div className="h-20 w-36 bg-gray-100 flex items-center justify-center rounded shadow">
            <span className="text-xs">{caseData.template}</span>
          </div>
        </div>
      )}

      {/* Stepper: visual only, not clickable */}
      <div className="w-full flex items-center mb-6">
        {steps.map((s, i) => (
          <div key={s.label} className="flex-1 flex items-center">
            <div
              className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${i <= step ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}
            >
              {i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-1 ${i < step ? "bg-blue-600" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>
      <div className="text-center text-md font-semibold mb-2">
        {steps[step].label}
      </div>

      <div>
        {loading ? (
          <div className="p-12 text-center">Loading case...</div>
        ) : error ? (
          <div className="p-12 text-center text-red-600">{error}</div>
        ) : (
          <StepComponent
            data={editBuffer}
            next={handleNextStep}
            back={handlePrevStep}
            isLast={isLast}
          />
        )}
      </div>

      {/* Only the Back button, no wizard Next */}
      <div className="flex justify-between gap-4 mt-8 mb-2">
        <button
          onClick={handlePrevStep}
          className="bg-gray-400 text-white font-bold px-8 py-2 rounded hover:bg-gray-500"
          disabled={step === 0}
        >
          Back
        </button>
      </div>

      <div className="flex gap-4 mt-2">
        {caseData?.public_url && (
          <button
            onClick={handleVisit}
            className="bg-indigo-600 text-white font-bold px-8 py-2 rounded hover:bg-indigo-700"
          >
            Visit Website
          </button>
        )}
      </div>
    </div>
  );
}
