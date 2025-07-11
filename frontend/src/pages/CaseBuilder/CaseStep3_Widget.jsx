import { useState } from "react";

const WIDGETS = [
  {
    id: "light-hero",
    name: "Light Hero Widget",
    description: "Image left, quote right. Modern, simple, beautiful.",
    preview: "/img/widgets/light-hero-preview.png", // update to real
  },
  // Add more widgets later
];

export default function Step3_Widget({ data = {}, next, back }) {
  const [selected, setSelected] = useState(data.widget || "light-hero");
  const [quote, setQuote] = useState(data.quote || "");
  const [img, setImg] = useState(data.image || "");
  const [imgPreview, setImgPreview] = useState(data.image || "");

  // Handle file upload & preview (client only, use backend later)
  const handleImage = e => {
    const file = e.target.files?.[0];
    if (file) {
      setImg(file);
      setImgPreview(URL.createObjectURL(file));
    }
  };

  const handleNext = e => {
    e.preventDefault();
    next({
      ...data,
      widget: selected,
      quote,
      image: img, // Send file object, or save to backend if needed
    });
  };

  return (
    <form className="max-w-xl mx-auto p-8 bg-white rounded-lg shadow mt-8" onSubmit={handleNext}>
      <h2 className="text-xl font-bold mb-6">Step 3: Pick Your Hero Widget</h2>
      <div className="space-y-8">
        {WIDGETS.map((w) => (
          <label
            key={w.id}
            className={`block border rounded-lg p-4 shadow hover:shadow-lg cursor-pointer transition ${
              selected === w.id ? "ring-2 ring-blue-500 border-blue-400" : ""
            }`}
          >
            <div className="flex items-center gap-4">
              <input
                type="radio"
                name="widget"
                checked={selected === w.id}
                onChange={() => setSelected(w.id)}
                className="mr-3"
              />
              <div>
                <div className="font-bold text-lg">{w.name}</div>
                <div className="text-sm text-gray-500 mb-2">{w.description}</div>
                <img src={w.preview} alt="Preview" className="h-12 rounded border" />
              </div>
            </div>
          </label>
        ))}
      </div>
      <div className="mt-8">
        <label className="block font-bold mb-1">Victim Photo</label>
        <input
          type="file"
          accept="image/*"
          className="mb-4"
          onChange={handleImage}
        />
        {imgPreview && (
          <img src={imgPreview} alt="Preview" className="mb-4 rounded border h-32 object-cover" />
        )}
        <label className="block font-bold mb-1">Quote</label>
        <input
          type="text"
          value={quote}
          onChange={e => setQuote(e.target.value)}
          className="border px-3 py-2 rounded w-full"
          placeholder="Enter a short quote here…"
          maxLength={120}
        />
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
          disabled={!selected || !quote || !img}
        >
          Next
        </button>
      </div>
    </form>
  );
}
