import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import Step1_Basics from "./CaseStep1_Basics";
import Step2_CrimeData from "./CaseStep2_CrimeData";
import Step3_TemplateLogo from "./CaseStep3_TemplateLogo";

const steps = [
  { label: "About", component: Step1_Basics },
  { label: "Incident", component: Step2_CrimeData },
  { label: "Template", component: Step3_TemplateLogo },
];

export default function CaseCreationModal({ isOpen, onClose, onComplete }) {
  const [step, setStep] = useState(0);
  const [caseData, setCaseData] = useState({});
  const [editBuffer, setEditBuffer] = useState({});

  useEffect(() => {
    if (!isOpen) {
      // Reset modal state when closed
      setStep(0);
      setCaseData({});
      setEditBuffer({});
    }
  }, [isOpen]);

  const handleNextStep = (data) => {
    console.log("[CaseCreationModal] handleNextStep called with step:", step, "data:", data);

    const merged = { ...editBuffer, ...data };
    setEditBuffer(merged);
    setCaseData(merged);

    // Step-by-step progression with validation
    if (step === 0) {
      // Step 1 → Step 2: Basic info completed and case created
      if (merged.id) {
        console.log("[CaseCreationModal] Step 1 complete, case created with ID:", merged.id);
        setStep(1);
      } else {
        console.error("[CaseCreationModal] Step 1 did not create case ID");
      }
    } else if (step === 1) {
      // Step 2 → Step 3: Incident info completed, case should have ID
      if (merged.id) {
        console.log("[CaseCreationModal] Step 2 complete, proceeding to template selection");
        setStep(2);
      } else {
        console.error("[CaseCreationModal] Cannot proceed to step 3 without case ID");
      }
    } else if (step === 2) {
      // Step 3 completed - template selected
      console.log("[CaseCreationModal] All steps completed, closing modal");
      onComplete?.(merged);
    }
  };

  const handlePrevStep = () => {
    setStep(prev => Math.max(0, prev - 1));
  };

  const handleClose = () => {
    if (step > 0 && (editBuffer.first_name || editBuffer.last_name)) {
      // Ask for confirmation if user has entered data
      if (window.confirm("Are you sure you want to close? Your progress will be lost.")) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  const StepComponent = steps[step].component;
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-6xl max-h-[95vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">Create New Case</h2>
            <div className="text-sm opacity-90">
              Step {step + 1} of {steps.length}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="w-full flex items-center">
            {steps.map((stepItem, index) => (
              <div key={stepItem.label} className="flex-1 flex items-center">
                <div
                  className={`w-10 h-10 flex items-center justify-center rounded-full font-bold text-sm ${
                    index <= step 
                      ? "bg-blue-600 text-white" 
                      : index === 2 && !editBuffer.id
                      ? "bg-gray-200 text-gray-400 opacity-50"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {index + 1}
                </div>
                <div className="flex-1 mx-4">
                  <div className={`text-sm font-medium ${
                    index <= step ? "text-blue-700" : 
                    index === 2 && !editBuffer.id ? "text-gray-400" : "text-gray-500"
                  }`}>
                    {stepItem.label}
                    {index === 2 && !editBuffer.id && (
                      <span className="block text-xs text-amber-600">Complete previous steps first</span>
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-1 mt-2 rounded ${
                        index < step ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
          {/* Only render current step */}
          {step < 2 || (step === 2 && editBuffer.id) ? (
            <StepComponent
              data={editBuffer}
              next={handleNextStep}
              back={handlePrevStep}
              isLast={isLast}
              isModal={true}
            />
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Complete Previous Steps</h3>
              <p className="text-gray-600 mb-6">
                Please complete and save the case information in the previous steps before choosing a template.
              </p>
              <button
                onClick={() => setStep(1)}
                className="bg-blue-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go Back to Incident Details
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 bg-gray-50 border-t">
          <button
            onClick={handlePrevStep}
            disabled={step === 0}
            className="px-6 py-2 bg-gray-400 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            Back
          </button>
          
          <div className="text-sm text-gray-600">
            {step + 1} of {steps.length} steps
            {step === 1 && !editBuffer.id && (
              <span className="block text-xs text-amber-600 mt-1">
                Save your case info to continue to template selection
              </span>
            )}
          </div>
          
          <div className="w-20"></div> {/* Spacer for alignment */}
        </div>
      </div>
    </div>
  );
}