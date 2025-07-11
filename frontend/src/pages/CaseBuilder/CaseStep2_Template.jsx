import { useState } from "react";

const TEMPLATES = [
  {
    id: "hope-justice",
    name: "Hope & Justice",
    headerImg: "/img/templates/hope-header-preview.png",   // Placeholders
    footerImg: "/img/templates/hope-footer-preview.png",
    demo: "Simple, clean, accessible. Easy for families and advocates.",
    locked: false,
  },
  // Add more templates here later!
];

export default function Step2_Template({ data = {}, next, back }) {
  const [selected, setSelected] = useState(data.template || "");

  const handleNext = e => {
    e.preventDefault();
    if (selected) next({ ...data, template: selected });
  };

  return (
    <form className="max-w-xl mx-auto p-8 bg-white rounded-lg shadow mt-8" onSubmit={handleNext}>
      <h2 className="text-xl font-bold mb-6">Step 2: Choose a Template</h2>
      <div className="space-y-8">
        {TEMPLATES.map((tpl) => (
          <label
            key={tpl.id}
            className={`block border rounded-lg p-4 shadow hover:shadow-lg cursor-pointer transition ${
              selected === tpl.id ? "ring-2 ring-blue-500 border-blue-400" : ""
            }`}
          >
            <div className="flex items-center gap-4">
              <input
                type="radio"
                name="template"
                checked={selected === tpl.id}
                onChange={() => setSelected(tpl.id)}
                className="mr-3"
                disabled={tpl.locked}
              />
              <div>
                <div className="font-bold text-lg">{tpl.name}</div>
                <div className="text-sm text-gray-500 mb-2">{tpl.demo}</div>
                <div className="flex gap-4">
                  <img src={tpl.headerImg} alt={`${tpl.name} Header`} className="h-12 rounded border" />
                  <img src={tpl.footerImg} alt={`${tpl.name} Footer`} className="h-12 rounded border" />
                </div>
              </div>
            </div>
          </label>
        ))}
      </div>
      <div className="flex justify-between mt-8">
        <button
          type="button"
          className="bg-gray-300 text-gray-800 font-bold px-8 py-2 rounded hover:bg-gray-400"
          onClick={back}
        >
          Back
        </button>
        <button
          type="submit"
          className="bg-blue-600 text-white font-bold px-8 py-2 rounded hover:bg-blue-700"
          disabled={!selected}
        >
          Next
        </button>
      </div>
    </form>
  );
}
