import React, { useState, useEffect } from "react";
import { Field, Label } from "@/components/Fieldset";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import FileUploader from "@/components/FileUploader";
import api from "@/utils/axios";

export default function Step1_Basics({ data = {}, next, isModal = false }) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    description: "",
    relation: "",
    photo: null,
    photoPreview: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!data) return;
    setForm((prev) => ({
      ...prev,
      first_name: data.first_name || "",
      last_name: data.last_name || "",
      description: data.description || "",
      relation: data.relation || "",
      photo: null,
      photoPreview: data.photo || data.photo_url || "",
    }));
  }, [data]);

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

    if (
      !form.first_name.trim() ||
      !form.last_name.trim() ||
      !form.description.trim()
    ) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      const victim_name = `${form.first_name} ${form.last_name}`.trim();

      formData.append("victim_name", victim_name);
      formData.append("first_name", form.first_name);
      formData.append("last_name", form.last_name);
      formData.append("description", form.description);
      formData.append("relation", form.relation);
      if (form.photo instanceof File) {
        formData.append("photo", form.photo);
      }

      const userId = data.user || JSON.parse(localStorage.getItem("user"))?.id;
      if (userId) formData.append("user", userId);

      let res;
      if (data.id) {
        res = await api.patch(`/cases/${data.id}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await api.post("/cases/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      next?.({ ...form, ...res.data });
    } catch (err) {
      const errorMessage =
        err?.response?.data?.detail ||
        JSON.stringify(err?.response?.data) ||
        err?.message ||
        "Could not save case. Please check your network and try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const firstName = form.first_name || "your loved one";
  const isNextButtonDisabled =
    loading ||
    !form.first_name.trim() ||
    !form.last_name.trim() ||
    !form.description.trim();

  const containerClass = isModal 
    ? "w-full" 
    : "min-h-screen flex flex-col bg-gray-50";
  const formClass = isModal
    ? "w-full"
    : "w-full max-w-2xl p-8 bg-white rounded-lg shadow-lg";

  return (
    <div className={containerClass}>
      {!isModal && (
        <div className="flex flex-1 items-center justify-center">
          <form
            className={formClass}
            onSubmit={handleNext}
            autoComplete="off"
          >
            <h2 className="text-2xl font-bold mb-8 text-center">Tell Their Story</h2>

            {error && (
              <div className="mb-4 text-red-600 text-center font-medium">{error}</div>
            )}

            <div className="space-y-5">
              <div className="flex gap-4">
                <Field className="flex-1">
                  <Label>First Name</Label>
                  <Input
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    required
                    className={`w-full border px-3 py-2 rounded ${
                      !form.first_name.trim() && error ? "border-red-500" : ""
                    }`}
                  />
                </Field>
                <Field className="flex-1">
                  <Label>Last Name</Label>
                  <Input
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    required
                    className={`w-full border px-3 py-2 rounded ${
                      !form.last_name.trim() && error ? "border-red-500" : ""
                    }`}
                  />
                </Field>
              </div>

              <Field>
                <Label>Tell us about {firstName}</Label>
                <Textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                  rows={6}
                  className={`w-full border px-3 py-2 rounded resize-none ${
                    !form.description.trim() && error ? "border-red-500" : ""
                  }`}
                  placeholder="Share their story, their dreams, what made them special..."
                />
              </Field>

              <Field>
                <Label>Your relation to {firstName}</Label>
                <Input
                  name="relation"
                  value={form.relation}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded"
                  placeholder="e.g., Mother, Father, Sister, Friend"
                />
              </Field>

              <Field>
                <Label>Photo of {firstName}</Label>
                <FileUploader
                  value={{ file: form.photo, preview: form.photoPreview }}
                  onChange={handlePhotoChange}
                />
                <p className="text-sm text-gray-500 mt-2">
                  Upload a clear, high-quality photo that shows {firstName} well.
                </p>
              </Field>
            </div>

            <div className="flex justify-end mt-8">
              <button
                type="submit"
                disabled={isNextButtonDisabled}
                className="bg-blue-600 text-white font-bold px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Saving..." : "Next: Incident Details"}
              </button>
            </div>
          </form>
        </div>
      )}

      {isModal && (
        <form
          className={formClass}
          onSubmit={handleNext}
          autoComplete="off"
        >
          {error && (
            <div className="mb-4 text-red-600 text-center font-medium">{error}</div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left column in modal */}
            <div className="space-y-5">
              <div className="flex gap-4">
                <Field className="flex-1">
                  <Label>First Name</Label>
                  <Input
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    required
                    className={`w-full border px-3 py-2 rounded ${
                      !form.first_name.trim() && error ? "border-red-500" : ""
                    }`}
                  />
                </Field>
                <Field className="flex-1">
                  <Label>Last Name</Label>
                  <Input
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    required
                    className={`w-full border px-3 py-2 rounded ${
                      !form.last_name.trim() && error ? "border-red-500" : ""
                    }`}
                  />
                </Field>
              </div>

              <Field>
                <Label>Tell us about {firstName}</Label>
                <Textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className={`w-full border px-3 py-2 rounded resize-none ${
                    !form.description.trim() && error ? "border-red-500" : ""
                  }`}
                  placeholder="Share their story, their dreams, what made them special..."
                />
              </Field>

              <Field>
                <Label>Your relation to {firstName}</Label>
                <Input
                  name="relation"
                  value={form.relation}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded"
                  placeholder="e.g., Mother, Father, Sister, Friend"
                />
              </Field>
            </div>

            {/* Right column in modal */}
            <div className="space-y-5">
              <Field>
                <Label>Photo of {firstName}</Label>
                <FileUploader
                  value={{ file: form.photo, preview: form.photoPreview }}
                  onChange={handlePhotoChange}
                />
                <p className="text-sm text-gray-500 mt-2">
                  Upload a clear, high-quality photo that shows {firstName} well.
                </p>
              </Field>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Why This Matters</h3>
                <p className="text-sm text-blue-800">
                  Sharing {firstName}'s story helps people connect emotionally and remember 
                  important details that could lead to tips and information.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <button
              type="submit"
              disabled={isNextButtonDisabled}
              className="bg-blue-600 text-white font-bold px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Saving..." : "Next: Incident Details"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}