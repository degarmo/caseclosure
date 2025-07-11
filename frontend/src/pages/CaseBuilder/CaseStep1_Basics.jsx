import { useState } from "react";
import { Field, Label } from "../../components/Fieldset";
import { Input } from "../../components/Input";
import { Textarea } from "../../components/Textarea";
import FileUploader from "../../components/FileUploader"; // Assumes you added this

export default function Step1_Basics({ data = {}, next }) {
  const [form, setForm] = useState({
    title: data.title || "",
    description: data.description || "",
    victim_name: data.victim_name || "",
    relation: data.relation || "",
    photo: data.photo || null,
    photoPreview: data.photoPreview || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Called by FileUploader when photo changes
  const handlePhotoChange = (file, preview) => {
    setForm((prev) => ({ ...prev, photo: file, photoPreview: preview }));
  };

  const handleNext = (e) => {
    e.preventDefault();
    next(form);
  };

  return (
    <form
      className="max-w-xl mx-auto p-8 bg-white rounded-lg shadow"
      onSubmit={handleNext}
      autoComplete="off"
    >
      <h2 className="text-2xl font-bold mb-8 text-center">Step 1: Memorial Basics</h2>
      
      <Field className="mb-5">
        <Label>Memorial Title</Label>
        <Input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="e.g. In Loving Memory of Jane Doe"
          required
        />
      </Field>

      <Field className="mb-5">
        <Label>Short Description</Label>
        <Textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Write a short summary or story…"
          required
        />
      </Field>

      <Field className="mb-5">
        <Label>Victim Name</Label>
        <Input
          name="victim_name"
          value={form.victim_name}
          onChange={handleChange}
          placeholder="Name of the person"
          required
        />
      </Field>

      <Field className="mb-5">
        <Label>Your Relation</Label>
        <Input
          name="relation"
          value={form.relation}
          onChange={handleChange}
          placeholder="e.g. Sister, Friend, Detective…"
        />
      </Field>

      <Field className="mb-5">
        <Label>Victim Photo</Label>
        <FileUploader
          value={{ file: form.photo, preview: form.photoPreview }}
          onChange={handlePhotoChange}
          label="Select Victim Photo"
        />
      </Field>

      <div className="flex justify-end mt-8">
        <button
          type="submit"
          className="bg-blue-600 text-white font-bold px-8 py-2 rounded hover:bg-blue-700"
          disabled={!form.title || !form.description || !form.victim_name}
        >
          Next
        </button>
      </div>
    </form>
  );
}
