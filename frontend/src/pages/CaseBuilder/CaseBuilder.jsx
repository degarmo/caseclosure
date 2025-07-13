import { useState } from "react";
import Step1_Basics from "./CaseStep1_Basics";
import Step2_CrimeDetails from "./CaseStep2_CrimeData";
import Step3_TemplateLogo from "./CaseStep3_TemplateLogo";


const steps = [
  Step1_Basics,
  Step2_CrimeDetails,
  Step3_TemplateLogo,
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
