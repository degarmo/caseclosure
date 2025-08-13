import React, { useState, useEffect } from "react";
import { X, User, MapPin, Calendar, Phone, Mail, Camera, FileText, Clock, Tag } from "lucide-react";
import api from "@/utils/axios";

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

function getCaseStatusColor(status) {
  switch(status) {
    case 'active': return 'bg-green-100 text-green-800 border-green-200';
    case 'monitoring': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'cold': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function formatDate(dateString) {
  if (!dateString) return 'Not specified';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
}

export default function CaseDetailsModal({ isOpen, onClose, caseId }) {
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && caseId) {
      setLoading(true);
      setError("");
      
      api.get(`/cases/${caseId}/`)
        .then(res => {
          console.log("[CaseDetailsModal] Loaded case:", res.data);
          setCaseData(res.data);
        })
        .catch(err => {
          console.error("[CaseDetailsModal] Error loading case:", err);
          setError("Could not load case details.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, caseId]);

  const handleClose = () => {
    onClose();
    // Reset state when closing
    setTimeout(() => {
      setCaseData(null);
      setError("");
    }, 300);
  };

  const handleVisit = () => {
    if (caseData && caseData.public_url) {
      window.open(caseData.public_url, "_blank");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center gap-4">
            <FileText className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">
                {getDisplayName(caseData, caseId)}
              </h2>
              <p className="text-blue-100">Case #{caseId} Details</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {caseData && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getCaseStatusColor(caseData.status)}`}>
                {caseData.status ? caseData.status.charAt(0).toUpperCase() + caseData.status.slice(1) : 'Draft'}
              </span>
            )}
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading case details...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <div className="text-red-500 mb-4">
                <X className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          ) : caseData ? (
            <div className="p-6 space-y-8">
              {/* Basic Information */}
              <section>
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-6 h-6 text-blue-600" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 rounded-lg p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Full Name</label>
                      <p className="text-lg font-semibold text-gray-800">
                        {caseData.first_name || caseData.last_name ? 
                          `${caseData.first_name || ''} ${caseData.last_name || ''}`.trim() : 
                          'Not specified'
                        }
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Victim Name</label>
                      <p className="text-gray-800">{caseData.victim_name || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Age</label>
                      <p className="text-gray-800">{caseData.age || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Gender</label>
                      <p className="text-gray-800">{caseData.gender || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Height</label>
                      <p className="text-gray-800">{caseData.height || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Weight</label>
                      <p className="text-gray-800">{caseData.weight || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Hair Color</label>
                      <p className="text-gray-800">{caseData.hair_color || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Eye Color</label>
                      <p className="text-gray-800">{caseData.eye_color || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Photo Section */}
              {caseData.photo && (
                <section>
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Camera className="w-6 h-6 text-blue-600" />
                    Photo
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <img 
                      src={caseData.photo} 
                      alt="Case photo"
                      className="max-w-xs rounded-lg shadow-md mx-auto block"
                    />
                  </div>
                </section>
              )}

              {/* Description */}
              {caseData.description && (
                <section>
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-blue-600" />
                    Description
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {caseData.description}
                    </p>
                  </div>
                </section>
              )}

              {/* Your Relation */}
              {caseData.relation && (
                <section>
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <User className="w-6 h-6 text-blue-600" />
                    Your Relation
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <p className="text-gray-800">{caseData.relation}</p>
                  </div>
                </section>
              )}

              {/* Incident Information */}
              <section>
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-blue-600" />
                  Incident Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 rounded-lg p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Incident Type</label>
                      <p className="text-gray-800">{caseData.incident_type || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Last Seen Date</label>
                      <p className="text-gray-800">{formatDate(caseData.last_seen_date)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Last Seen Location</label>
                      <p className="text-gray-800">{caseData.last_seen_location || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Circumstances</label>
                      <p className="text-gray-800 leading-relaxed">
                        {caseData.circumstances || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Template Information */}
              {caseData.template && (
                <section>
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Tag className="w-6 h-6 text-blue-600" />
                    Template & Branding
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Selected Template</label>
                        <p className="text-lg font-semibold text-gray-800">{caseData.template}</p>
                      </div>
                      {caseData.logo && (
                        <img 
                          src={caseData.logo} 
                          alt="Logo"
                          className="h-12 w-12 object-contain rounded"
                        />
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* Timestamps */}
              <section>
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-blue-600" />
                  Case Timeline
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 rounded-lg p-6">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created</label>
                    <p className="text-gray-800">{formatDate(caseData.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Last Updated</label>
                    <p className="text-gray-800">{formatDate(caseData.updated_at)}</p>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-600">No case data available.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {caseData && (
          <div className="flex justify-between items-center p-6 bg-gray-50 border-t">
            <div className="text-sm text-gray-600">
              Case ID: {caseId}
            </div>
            
            <div className="flex gap-3">
              {caseData.public_url && (
                <button
                  onClick={handleVisit}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                >
                  Visit Website
                </button>
              )}
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}