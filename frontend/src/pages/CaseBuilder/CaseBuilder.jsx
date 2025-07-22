import { useState } from "react";
import Step1_Basics from "./CaseStep1_Basics";
import CaseStep2_CrimeData from "./CaseStep2_CrimeData";
import Step3_TemplateLogo from "./CaseStep3_TemplateLogo";

// List ALL form fields you want to preserve
const CRITICAL_FIELDS = [
  // Step 1 fields
  "first_name", "last_name", "title", "description", "relation", "photo", "photoPreview",
  // Step 2 fields
  "date_of_birth", "resulted_in_death", "date_of_death", "crime_type",
  "incident_date", "incident_location", "incident_latlng", "incident_description",
  "investigating_department", "detective_name", "detective_phone", "detective_email",
  "media_links", "reward_offered", "reward_amount",
  // Step 3 fields (add as needed)
  "template"
];

// Utility to always keep last non-blank for each critical field
const authoritativeMerge = (prev, next) => {
  const merged = { ...prev };
  for (const key of CRITICAL_FIELDS) {
    // If the new data has the field (even as ""), use it; else use the old one
    if (Object.prototype.hasOwnProperty.call(next, key)) {
      merged[key] = next[key];
    }
    // If the key isn't present in either, fill with "" (or null)
    if (merged[key] === undefined) merged[key] = "";
  }
  return merged;
};

const steps = [
  Step1_Basics,
  CaseStep2_CrimeData,
  Step3_TemplateLogo,
];

export default function CaseBuilder() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});

  const handleNext = (data) => {
    setFormData(prev => {
      // Always merge with full authority: never drop any field
      const updated = authoritativeMerge(prev, data);
      console.log("[CaseBuilder] Authoritative merged formData:", updated);
      return updated;
    });
    setStep(prevStep => Math.min(steps.length - 1, prevStep + 1));
  };

  const handleBack = () => setStep(s => Math.max(0, s - 1));

  const StepComponent = steps[step];

  return (
    <div>
      <div className="mb-4">
        <span className="font-bold">
          Step {step + 1} of {steps.length}
        </span>
      </div>
      <StepComponent
        data={formData}
        next={handleNext}
        back={handleBack}
        isLast={step === steps.length - 1}
      />
    </div>
  );
}
