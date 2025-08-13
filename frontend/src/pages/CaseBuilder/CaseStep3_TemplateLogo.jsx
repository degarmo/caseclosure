// CaseStep3_TemplateLogo.jsx - Fixed version with 1 available template and 5 coming soon
import React, { useState } from "react";
import TemplatePreviewModal from "@/components/TemplatePreviewModal";
import SalientTemplate from "@/templates/salient/SalientTemplate";
import { Clock, Sparkles, Camera, FileText, Globe, Shield } from "lucide-react";
import api from "@/utils/axios";

const TEMPLATES = [
  {
    id: "hope-justice",
    name: "Hope & Justice",
    component: SalientTemplate,
    description: "Simple, clean, accessible. Easy for families and advocates.",
    available: true, // Only this one is available
    color: "blue",
    icon: <FileText className="w-8 h-8" />
  },
  {
    id: "modern-memorial",
    name: "Modern Memorial",
    component: SalientTemplate,
    description: "Contemporary design with photo galleries and timeline.",
    available: false, // Coming soon
    color: "purple",
    icon: <Camera className="w-8 h-8" />
  },
  {
    id: "detective-pro",
    name: "Detective Pro",
    component: SalientTemplate,
    description: "Professional layout for law enforcement agencies.",
    available: false, // Coming soon
    color: "green", 
    icon: <Shield className="w-8 h-8" />
  },
  {
    id: "community-focus",
    name: "Community Focus",
    component: SalientTemplate,
    description: "Designed to maximize community engagement and sharing.",
    available: false, // Coming soon
    color: "orange",
    icon: <Globe className="w-8 h-8" />
  },
  {
    id: "timeline-story",
    name: "Timeline Story",
    component: SalientTemplate,
    description: "Interactive timeline format with multimedia support.",
    available: false, // Coming soon
    color: "pink",
    icon: <Clock className="w-8 h-8" />
  },
  {
    id: "premium-plus",
    name: "Premium Plus",
    component: SalientTemplate,
    description: "Advanced features with analytics and social integration.",
    available: false, // Coming soon
    color: "indigo",
    icon: <Sparkles className="w-8 h-8" />
  }
];

const getColorClasses = (color, available = true) => {
  const baseClasses = {
    blue: available 
      ? "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
      : "from-gray-300 to-gray-400",
    purple: available 
      ? "from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
      : "from-gray-300 to-gray-400",
    green: available 
      ? "from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
      : "from-gray-300 to-gray-400",
    orange: available 
      ? "from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
      : "from-gray-300 to-gray-400",
    pink: available 
      ? "from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700"
      : "from-gray-300 to-gray-400",
    indigo: available 
      ? "from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700"
      : "from-gray-300 to-gray-400",
  };
  
  return baseClasses[color] || (available ? baseClasses.blue : "from-gray-300 to-gray-400");
};

export default function CaseStep3_TemplateLogo({ data = {}, next, isModal = false }) {
  const [modal, setModal] = useState({ open: false, template: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(data.template || null);

  if (!data.id) {
    return (
      <div className="text-center py-8">
        <div className="text-xl font-bold text-red-600 mb-2">No Case ID</div>
        <p className="text-gray-600">Please complete previous steps and save your case before choosing a template.</p>
      </div>
    );
  }

  const handleSelect = async (templateId) => {
    console.log("[TemplateLogo] Selecting template:", templateId);
    
    setLoading(true);
    setError("");
    
    try {
      const res = await api.patch(`/cases/${data.id}/`, { template: templateId });
      console.log("[TemplateLogo] API response:", res.data);
      
      setLoading(false);
      setModal({ open: false, template: null });
      setSelectedTemplate(templateId);
      
      // Pass the updated case data including the template
      const updatedData = { ...data, ...res.data, template: templateId };
      
      if (next) {
        console.log("[TemplateLogo] Calling next with:", updatedData);
        next(updatedData);
      }
      
    } catch (err) {
      console.error("[TemplateLogo] API error:", err);
      setLoading(false);
      setError(
        err?.response?.data?.detail ||
        err?.message ||
        "Could not save template selection."
      );
    }
  };

  const handleTemplateClick = (template) => {
    if (!template.available) {
      // Show coming soon message for unavailable templates
      alert(`The "${template.name}" template is coming soon! For now, please select the "Hope & Justice" template.`);
      return;
    }

    // Direct selection for available templates
    if (window.confirm(`Select "${template.name}" template?`)) {
      handleSelect(template.id);
    }
  };

  return (
    <div className="w-full">
      {isModal && (
        <div className="mb-6">
          <h3 className="text-xl font-bold text-center text-gray-900">Choose Your Template</h3>
          <p className="text-center text-gray-600 mt-2">Select a design that best represents your case</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TEMPLATES.map((template) => (
          <div
            key={template.id}
            className={`relative group rounded-2xl overflow-hidden shadow-lg transition-all duration-300 bg-white ${
              template.available 
                ? "cursor-pointer hover:shadow-2xl hover:scale-105 transform" 
                : "cursor-not-allowed opacity-75"
            }`}
            onClick={() => handleTemplateClick(template)}
          >
            {/* Template Preview Area */}
            <div className="h-48 relative overflow-hidden">
              <div className={`w-full h-full bg-gradient-to-br ${getColorClasses(template.color, template.available)} flex flex-col items-center justify-center text-white relative`}>
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10 text-center">
                  <div className="mb-3 opacity-90">
                    {template.icon}
                  </div>
                  <div className="text-sm font-medium">
                    {template.available ? "Click to Select" : "Coming Soon"}
                  </div>
                </div>
              </div>

              {/* Selected Badge */}
              {selectedTemplate === template.id && (
                <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  Selected
                </div>
              )}

              {/* Coming Soon Badge */}
              {!template.available && (
                <div className="absolute top-3 left-3 bg-gray-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                  Coming Soon
                </div>
              )}
            </div>

            {/* Template Info */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-2">
                <h3 className={`font-bold text-lg ${template.available ? 'text-gray-900' : 'text-gray-500'}`}>
                  {template.name}
                </h3>
                <div className={`${template.available ? `text-${template.color}-600` : 'text-gray-400'} ml-2`}>
                  {React.cloneElement(template.icon, { className: "w-5 h-5" })}
                </div>
              </div>
              <p className={`text-sm ${template.available ? 'text-gray-600' : 'text-gray-400'}`}>
                {template.description}
              </p>
              
              <div className={`mt-4 flex items-center text-xs font-medium ${
                template.available 
                  ? "text-green-600" 
                  : "text-gray-400"
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  template.available ? "bg-green-500" : "bg-gray-400"
                }`}></div>
                {template.available 
                  ? "Click to select this template"
                  : "Template under development"
                }
              </div>
            </div>

            {/* Hover Effect (only for available templates) */}
            {template.available && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            )}
          </div>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-6 py-3 rounded-lg">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
            {error}
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Saving template selection...</p>
          </div>
        </div>
      )}
    </div>
  );
}