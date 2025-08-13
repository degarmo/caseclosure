import React, { useRef, useState } from "react";

// Example: array of gallery logo SVGs or URLs
const GALLERY_LOGOS = [
  { id: "default-blue", label: "Blue Circle", src: "/gallery/logo-blue.svg" },
  { id: "default-star", label: "Star", src: "/gallery/logo-star.svg" },
  // ...more
];

export default function LogoSelector({ value, onChange }) {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(value?.fileUrl || "");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    onChange({ file, galleryId: null, fileUrl: previewUrl });
   };

  const handleGallerySelect = (id, src) => {
    setPreview(src);
    onChange({ file: null, galleryId: id });
  };

  return (
    <div>
      <div className="mb-4">
        <label className="block mb-1 font-medium">Upload your own logo:</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          ref={fileInputRef}
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-medium">Or choose a gallery logo:</label>
        <div className="flex gap-4">
          {GALLERY_LOGOS.map(logo => (
            <button
              key={logo.id}
              type="button"
              className={`border-2 rounded p-1 ${value?.galleryId === logo.id ? "border-blue-500" : "border-gray-200"}`}
              onClick={() => handleGallerySelect(logo.id, logo.src)}
            >
              <img src={logo.src} alt={logo.label} className="h-10 w-10 object-contain" />
            </button>
          ))}
        </div>
      </div>
      {preview && (
        <div className="mt-4">
          <div className="text-xs text-slate-500 mb-1">Logo Preview:</div>
          <img src={preview} alt="Selected Logo Preview" className="h-14 object-contain" />
        </div>
      )}
    </div>
  );
}
