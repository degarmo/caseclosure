import { useState } from "react";
import { Button } from "@/components/ui/button";

// Example template data. Add more as you create them!
const TEMPLATES = [
  {
    id: "caseclassic",
    name: "Case Classic",
    description: "Clean, full-page memorial landing site. All widgets in one scroll.",
    preview: "/img/templates/caseclassic-preview.png", // Update with your real image path
    disabled: false,
  },
  // { id: "future-template", ... }
];
const defaultLogo = "/logo.png"; // Update if you use another default

export default function Step3_TemplateLogo({ data = {}, next, back }) {
  const [selected, setSelected] = useState(data.template || TEMPLATES[0].id);
  const [logo, setLogo] = useState(data.logo || null);
  const [logoPreview, setLogoPreview] = useState(data.logoPreview || "");

  // Logo file upload & preview logic
  const handleLogo = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleNext = (e) => {
    e.preventDefault();
    next({
      ...data,
      template: selected,
      logo,
      logoPreview,
    });
  };

  return (
    <form className="max-w-xl mx-auto p-8 bg-white rounded-lg shadow mt-8" onSubmit={handleNext}>
      <h2 className="text-xl font-bold mb-6">Step 3: Logo & Memorial Template</h2>
      <div className="mb-8">
        <label className="block font-bold mb-1">Memorial Logo</label>
        <input
          type="file"
          accept="image/*"
          className="mb-4"
          onChange={handleLogo}
        />
        <div className="flex items-center gap-4">
          <img
            src={logoPreview || defaultLogo}
            alt="Logo Preview"
            className="mb-4 rounded border h-20 w-20 object-contain bg-gray-100"
          />
          <span className="text-xs text-gray-500">
            (Families can upload a custom logo, or keep the default.)
          </span>
        </div>
      </div>
      <div>
        <label className="block font-bold mb-3">Choose a Memorial Template</label>
        <div className="grid gap-4">
          {TEMPLATES.map((tpl) => (
            <label
              key={tpl.id}
              className={`block border rounded-lg p-4 shadow hover:shadow-lg cursor-pointer transition
                ${selected === tpl.id ? "ring-2 ring-blue-500 border-blue-400" : ""}
                ${tpl.disabled ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              <div className="flex items-center gap-4">
                <input
                  type="radio"
                  name="template"
                  checked={selected === tpl.id}
                  onChange={() => setSelected(tpl.id)}
                  className="mr-3"
                  disabled={tpl.disabled}
                />
                <div>
                  <div className="font-bold text-lg">{tpl.name}</div>
                  <div className="text-sm text-gray-500 mb-2">{tpl.description}</div>
                  <img src={tpl.preview} alt="Template Preview" className="h-32 w-full object-cover rounded border" />
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
      {/* Future: Option to upload custom template */}
      <div className="mt-8 flex justify-between">
        <Button variant="outline" type="button" onClick={back}>
          Back
        </Button>
        <Button type="submit" disabled={!selected}>
          Next
        </Button>
      </div>
    </form>
  );
}

