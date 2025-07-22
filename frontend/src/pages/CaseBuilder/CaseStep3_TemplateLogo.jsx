import React, { useState } from "react";
import TemplatePreviewModal from "@/components/TemplatePreviewModal";
import SalientTemplate from "@/templates/salient/SalientTemplate";
import api from "@/utils/axios"; // <-- Axios instance with auth

const TEMPLATES = [
  {
    id: "hope-justice",
    name: "Hope & Justice",
    component: SalientTemplate,
    description: "Simple, clean, accessible. Easy for families and advocates.",
  },
  // Add more templates as needed!
];

export default function CaseStep3_TemplateSelect({ caseId, onTemplateSelect, next }) {
  const [modal, setModal] = useState({ open: false, template: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSelect = async (templateId) => {
    setLoading(true);
    setError("");
    try {
      // PATCH template selection to backend
      const res = await api.patch(`/cases/${caseId}/`, { template: templateId });
      setLoading(false);
      if (onTemplateSelect) onTemplateSelect(templateId);
      if (next) next(res.data); // Proceed to next step if needed
      setModal({ open: false, template: null });
    } catch (err) {
      setLoading(false);
      setError(
        err?.response?.data?.detail ||
        err?.message ||
        "Could not save template selection."
      );
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-5xl p-12">
        {TEMPLATES.map(tmpl => (
          <div
            key={tmpl.id}
            className="cursor-pointer shadow-xl rounded-2xl overflow-hidden transform hover:scale-105 transition duration-300 bg-white border-4 border-transparent hover:border-blue-400"
            style={{ minHeight: 350 }}
            onClick={() => setModal({ open: true, template: tmpl })}
          >
            <div className="w-full h-56 bg-gray-200 flex items-center justify-center">
              <tmpl.component isPreviewMode />
            </div>
            <div className="p-6">
              <div className="font-bold text-2xl">{tmpl.name}</div>
              <div className="text-gray-500 mt-1">{tmpl.description}</div>
            </div>
          </div>
        ))}
      </div>

      {modal.open && (
        <TemplatePreviewModal
          template={modal.template}
          onClose={() => setModal({ open: false, template: null })}
          onSelect={() => handleSelect(modal.template.id)}
          loading={loading}
        />
      )}

      {error && (
        <div className="fixed bottom-8 left-0 right-0 mx-auto text-center text-red-600 font-semibold">
          {error}
        </div>
      )}
    </div>
  );
}
