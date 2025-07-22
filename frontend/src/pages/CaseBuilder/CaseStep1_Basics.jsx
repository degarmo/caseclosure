import { useState, useEffect } from "react";
import { Field, Label } from "@/components/Fieldset";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import FileUploader from "@/components/FileUploader";
import api from "@/utils/axios";

export default function Step1_Basics({ data = {}, next }) {
  const [form, setForm] = useState({
    first_name: data.first_name || "",
    last_name: data.last_name || "",
    title: data.name || data.title || "",
    description: data.description || "",
    relation: data.relation || "",
    photo: data.photo || null,
    photoPreview: data.photoPreview || data.photo_url || "",
  });

  // Only reset form state if data.id (case) changes
  useEffect(() => {
    setForm({
      first_name: data.first_name || "",
      last_name: data.last_name || "",
      title: data.name || data.title || "",
      description: data.description || "",
      relation: data.relation || "",
      photo: data.photo || null,
      photoPreview: data.photoPreview || data.photo_url || "",
    });
  }, [data.id]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const firstName = form.first_name || "your loved one";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (file, preview) => {
    setForm((prev) => ({ ...prev, photo: file, photoPreview: preview }));
  };

  const handleNext = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    console.log("Submitting form...");

    try {
      const victim_name = `${form.first_name} ${form.last_name}`.trim();
      const formData = new FormData();

      formData.append("victim_name", victim_name);
      formData.append("first_name", form.first_name);
      formData.append("last_name", form.last_name);
      formData.append("name", form.title);
      formData.append("description", form.description);
      if (form.relation) formData.append("relation", form.relation);
      if (form.photo instanceof File) formData.append("photo", form.photo);

      const userId = data.user || JSON.parse(localStorage.getItem("user"))?.id;
      if (userId) formData.append("user", userId);

      let res;
      if (data.id) {
        console.log("PATCHING existing case:", data.id);
        res = await api.patch(`/cases/${data.id}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        console.log("POSTING new case...");
        res = await api.post("/cases/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      setLoading(false);
      console.log("About to call next() with:", { ...form, ...res.data });
      if (typeof next === "function") {
        next({ ...form, ...res.data }); // <- THIS is the stepper trigger!
      } else {
        console.error("No next function provided to Step1_Basics!");
      }
    } catch (err) {
      setLoading(false);
      setError(
        err?.response?.data?.detail ||
        JSON.stringify(err?.response?.data) ||
        err?.message ||
        "Could not save case."
      );
      console.error("ERROR RESPONSE:", err, err.response?.data);
    }
  };

  return (
    <form
      className="w-full p-8 bg-white rounded-lg shadow"
      onSubmit={handleNext}
      autoComplete="off"
    >
      <h2 className="text-2xl font-bold mb-8 text-center">Tell Their Story</h2>

      {error && (
        <div className="mb-4 text-red-600 text-center font-medium">{error}</div>
      )}

      <div className="flex gap-4 mb-5">
        <Field className="flex-1">
          <Label>First Name</Label>
          <Input
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            placeholder="First Name"
            required
          />
        </Field>
        <Field className="flex-1">
          <Label>Last Name</Label>
          <Input
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            placeholder="Last Name"
            required
          />
        </Field>
      </div>

      <Field className="mb-5">
        <Label>Memorial Title</Label>
        <Input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder={`e.g. In Loving Memory of ${firstName}`}
          required
        />
      </Field>

      <Field className="mb-5">
        <Label>Tell us about {firstName}</Label>
        <Textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder={`Write a short summary or story about ${firstName}…`}
          required
        />
      </Field>

      <Field className="mb-5">
        <Label>
          How are you related to {firstName}?
          <span className="text-gray-400 text-xs block">
            (e.g. Sister, friend, parent)
          </span>
        </Label>
        <Input
          name="relation"
          value={form.relation}
          onChange={handleChange}
          placeholder={`Your relation to ${firstName}`}
        />
      </Field>

      <Field className="mb-5">
        <Label>Photo of {firstName}</Label>
        <FileUploader
          value={{ file: form.photo, preview: form.photoPreview }}
          onChange={handlePhotoChange}
          label={`Select a photo of ${firstName}`}
        />
      </Field>

      <div className="flex justify-end mt-8">
        <button
          type="submit"
          className="bg-blue-600 text-white font-bold px-8 py-2 rounded hover:bg-blue-700"
          disabled={
            loading ||
            !form.first_name?.trim() ||
            !form.last_name?.trim() ||
            !form.title?.trim() ||
            !form.description?.trim()
          }
        >
          {loading ? "Saving..." : "Next"}
        </button>
      </div>
    </form>
  );
}
