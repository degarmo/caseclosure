import React from "react";
import { X } from "lucide-react"; // optional, use any icon you like

export default function TemplatePreviewModal({ template, onClose, onSelect }) {
  const TemplateComp = template.component;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-xl w-[90vw] h-[90vh] flex flex-col overflow-hidden">
        <button className="absolute top-4 right-6 text-gray-400 hover:text-gray-900" onClick={onClose}>
          <X size={32} />
        </button>
        <div className="flex-1 overflow-auto bg-gray-100">
          <TemplateComp isPreviewMode />
        </div>
        <div className="flex justify-end p-6 space-x-4 bg-white border-t border-gray-100">
          <button
            className="bg-gray-200 text-gray-700 font-semibold px-6 py-2 rounded-lg hover:bg-gray-300"
            onClick={onClose}
          >
            Back to Templates
          </button>
          <button
            className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-700"
            onClick={onSelect}
          >
            Choose This Template
          </button>
        </div>
      </div>
    </div>
  );
}
