// src/pages/MemorialSettings.jsx
import React, { useEffect, useState } from "react";
import api from "../api/axios";

export default function MemorialSettings() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api.get("profile/")
      .then(res => {
        setProfile(res.data);
        setForm(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load profile.");
        setLoading(false);
      });
  }, []);

  const handleChange = e => {
    const { name, value, type, checked, files } = e.target;
    if (type === "checkbox") {
      setForm({ ...form, [name]: checked });
    } else if (type === "file") {
      setForm({ ...form, [name]: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
    setSuccess("");
  };

  const handleEdit = () => {
    setEditMode(true);
    setForm(profile);
    setError(""); setSuccess("");
  };

  const handleCancel = () => {
    setEditMode(false);
    setForm(profile);
    setError(""); setSuccess("");
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    // FormData for avatar upload support
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        data.append(key, value);
      }
    });

    try {
      const res = await api.put("profile/", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setProfile(res.data);
      setEditMode(false);
      setSuccess("Memorial settings updated!");
    } catch (err) {
      setError("Failed to update memorial settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!profile) return <div>Profile not found.</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8 mt-8">
      <h2 className="text-xl font-bold mb-4">Memorial Settings</h2>
      {error && <div className="mb-3 text-red-600">{error}</div>}
      {success && <div className="mb-3 text-green-600">{success}</div>}

      {!editMode ? (
        <div>
          <div className="mb-4">
            <label className="block font-bold mb-1">Avatar</label>
            {profile.avatar ? (
              <img src={profile.avatar} alt="Avatar" className="h-20 w-20 object-cover rounded-full mb-2" />
            ) : (
              <span className="text-gray-400">No avatar</span>
            )}
          </div>
          <div className="mb-2"><span className="font-bold">Organization:</span> {profile.organization || <span className="text-gray-400">—</span>}</div>
          <div className="mb-2"><span className="font-bold">Role/Relationship:</span> {profile.role || <span className="text-gray-400">—</span>}</div>
          <div className="mb-2"><span className="font-bold">Bio:</span> {profile.bio || <span className="text-gray-400">—</span>}</div>
          <div className="mb-2"><span className="font-bold">Location:</span> {profile.location || <span className="text-gray-400">—</span>}</div>
          <button
            className="mt-6 bg-blue-600 text-white font-bold px-6 py-2 rounded hover:bg-blue-700"
            onClick={handleEdit}
          >
            Edit
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="mb-4">
            <label className="block font-bold mb-2">Avatar</label>
            {profile.avatar && (
              <img src={profile.avatar} alt="Avatar" className="h-20 w-20 object-cover rounded-full mb-2" />
            )}
            <input type="file" name="avatar" accept="image/*" onChange={handleChange} />
          </div>

          <div className="mb-4">
            <label className="block font-bold mb-2">Organization/Affiliation</label>
            <input
              type="text"
              name="organization"
              value={form.organization || ""}
              onChange={handleChange}
              className="border px-3 py-2 rounded w-full"
              placeholder="Your organization or affiliation"
            />
          </div>
          <div className="mb-4">
            <label className="block font-bold mb-2">Role/Relationship</label>
            <input
              type="text"
              name="role"
              value={form.role || ""}
              onChange={handleChange}
              className="border px-3 py-2 rounded w-full"
              placeholder="e.g. Family, Detective, Advocate"
            />
          </div>
          <div className="mb-4">
            <label className="block font-bold mb-2">Bio/About</label>
            <textarea
              name="bio"
              value={form.bio || ""}
              onChange={handleChange}
              className="border px-3 py-2 rounded w-full"
              placeholder="Tell your story or connection"
              rows={4}
            />
          </div>
          <div className="mb-4">
            <label className="block font-bold mb-2">Location</label>
            <input
              type="text"
              name="location"
              value={form.location || ""}
              onChange={handleChange}
              className="border px-3 py-2 rounded w-full"
              placeholder="City, State"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="bg-blue-600 text-white font-bold px-6 py-2 rounded hover:bg-blue-700"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className="bg-gray-300 text-gray-700 font-bold px-6 py-2 rounded hover:bg-gray-400"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
