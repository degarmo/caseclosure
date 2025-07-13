import { useState } from "react";
import { Field, Label } from "@/components/Fieldset";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import FileUploader from "@/components/FileUploader";

export default function Step1_Basics({ data = {}, next }) {
  const [form, setForm] = useState({
    first_name: data.first_name || "",
    last_name: data.last_name || "",
    title: data.title || "",
    description: data.description || "",
    relation: data.relation || "",
    photo: data.photo || null,
    photoPreview: data.photoPreview || "",
  });

  // Full name for dynamic placeholders
  const firstName = form.first_name || "your loved one";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (file, preview) => {
    setForm((prev) => ({ ...prev, photo: file, photoPreview: preview }));
  };

  const handleNext = (e) => {
    e.preventDefault();
    // Append victim_name before passing to next step or backend
    const victim_name = `${form.first_name} ${form.last_name}`.trim();
    next({ ...form, victim_name });
  };

  return (
    <form
      className="w-full p-8 bg-white rounded-lg shadow"
      onSubmit={handleNext}
      autoComplete="off"
    >
      <h2 className="text-2xl font-bold mb-8 text-center">Tell Their Story</h2>
      
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
            !form.first_name?.trim() ||
            !form.last_name?.trim() ||
            !form.title?.trim() ||
            !form.description?.trim()
          }
        >
          Next
        </button>
      </div>
    </form>
  );
}
