import { useState } from "react";
import Step1_Basics from "./CaseStep1_Basics";
import Step2_Template from "./CaseStep2_Template";
import Step3_Widget from "./CaseStep3_Widget";
import Step4_Review from "./CaseStep4_Review"; 

const steps = [
  Step1_Basics,
  Step2_Template,
  Step3_Widget,
  Step4_Review, // <-- Add here
];

export default function CaseBuilder() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});

  const next = (data) => {
    setFormData((d) => ({ ...d, ...data }));
    setStep((s) => s + 1);
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

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
        next={next}
        back={back}
        isLast={step === steps.length - 1}
      />
    </div>
  );
}
