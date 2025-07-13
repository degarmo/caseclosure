import { useState } from "react";
import { Carousel } from "@material-tailwind/react";
import { Button } from "@/components/ui/button";
import FileUploader from "@/components/FileUploader";

const TEMPLATE_DATA = [
  {
    name: "Hope & Justice",
    img: "/img/templates/hope-header-preview.png", // your real image
    desc: "Simple, clean, accessible. Easy for families and advocates.",
    locked: false,
  },
  {
    name: "Template 2",
    img: "/img/templates/template-coming-soon.png", // placeholder
    desc: "Coming soon",
    locked: true,
  },
  {
    name: "Template 3",
    img: "/img/templates/template-coming-soon.png", // placeholder
    desc: "Coming soon",
    locked: true,
  },
];

const LOGOS = [
  { src: "/img/default-logo.png", alt: "Default Logo", comingSoon: false },
  { src: "/img/logo-coming-soon-1.png", alt: "Logo Coming Soon", comingSoon: true },
  { src: "/img/logo-coming-soon-2.png", alt: "Logo Coming Soon", comingSoon: true },
  { src: "/img/logo-coming-soon-3.png", alt: "Logo Coming Soon", comingSoon: true },
];

export default function CaseStep3_TemplateLogo({ data = {}, next, back }) {
  const [activeTemplate, setActiveTemplate] = useState(0);
  const [logo, setLogo] = useState(LOGOS[0].src);

  // Handle custom logo upload
  const handleLogoUpload = (fileUrl) => setLogo(fileUrl);

  const handleNext = (e) => {
    e.preventDefault();
    next({
      template: TEMPLATE_DATA[activeTemplate],
      logo,
    });
  };

  return (
    <form
      className="w-full max-w-4xl mx-auto p-8 bg-white rounded-lg shadow mt-8"
      onSubmit={handleNext}
    >
      <h2 className="text-xl font-bold mb-6">Step 3: Pick a Template & Logo</h2>

      <div className="mb-10">
        <Carousel
          className="rounded-xl"
          navigation={({ setActiveIndex, activeIndex, length }) => (
            <div className="absolute bottom-4 left-2/4 z-50 flex -translate-x-2/4 gap-2">
              {new Array(length).fill("").map((_, i) => (
                <span
                  key={i}
                  className={`block h-1 cursor-pointer rounded-2xl transition-all ${
                    activeIndex === i ? "w-8 bg-blue-600" : "w-4 bg-blue-300/50"
                  }`}
                  onClick={() => setActiveIndex(i)}
                />
              ))}
            </div>
          )}
          onChange={setActiveTemplate}
        >
          {TEMPLATE_DATA.map((tpl, idx) => (
            <div key={tpl.name} className="relative">
              <img
                src={tpl.img}
                alt={tpl.name}
                className={`h-64 w-full object-cover rounded-xl border ${tpl.locked ? "opacity-60 grayscale" : ""}`}
              />
              <div className="absolute inset-0 flex flex-col justify-end p-4">
                <div className="font-bold text-white text-lg drop-shadow">{tpl.name}</div>
                <div className="text-white text-sm drop-shadow">{tpl.desc}</div>
              </div>
              {tpl.locked && (
                <span className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-3 py-1 rounded shadow">
                  Coming Soon
                </span>
              )}
            </div>
          ))}
        </Carousel>
      </div>

      <div className="mb-8">
        <h3 className="font-bold mb-2">Choose a Logo</h3>
        <div className="flex gap-4 items-center">
          {LOGOS.map((l, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <img
                src={l.src}
                alt={l.alt}
                className={`w-16 h-16 object-contain rounded-full border-2 cursor-pointer mb-1 ${logo === l.src ? "border-blue-500" : "border-gray-300"} ${l.comingSoon ? "opacity-50 grayscale" : ""}`}
                onClick={() => !l.comingSoon && setLogo(l.src)}
                style={{ pointerEvents: l.comingSoon ? "none" : "auto" }}
              />
              {l.comingSoon && (
                <span className="text-xs text-gray-400">Coming Soon</span>
              )}
            </div>
          ))}
          {/* Upload new logo */}
          <div className="flex flex-col items-center">
            <FileUploader
              onChange={handleLogoUpload}
              accept="image/*"
              className="w-16 h-16 border-2 border-dashed rounded-full flex items-center justify-center cursor-pointer"
            />
            <span className="text-xs mt-1">Upload</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-10">
        <Button variant="outline" type="button" onClick={back}>
          Back
        </Button>
        <Button type="submit">
          Next
        </Button>
      </div>
    </form>
  );
}
