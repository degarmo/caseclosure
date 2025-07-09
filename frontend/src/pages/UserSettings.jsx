import React, { useEffect, useState } from "react";
import api from "../api/axios";

const TIMEZONE_OPTIONS = [
  "Eastern", "Central", "Mountain", "Pacific", "Hawaii–Aleutian", "Alaskan"
];

const LANGUAGE_OPTIONS = [
  "English", "Spanish", "French", "Other"
];

export default function UserSettings() {
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
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setForm({ ...form, [name]: checked });
    } else {
      setForm({ ...form, [name]: value });
    }
    setSuccess("");
  };

  const handleEdit = () => {
    setEditMode(true);
    setForm(profile);
    setError("");
    setSuccess("");
  };

  const handleCancel = () => {
    setEditMode(false);
    setForm(profile);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.put("profile/", form);
      setProfile(res.data);
      setEditMode(false);
      setSuccess("Profile updated!");
    } catch (err) {
      setError("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!profile) return <div>Profile not found.</div>;

  // Used for "Other" language option
  const showOtherLanguage = form.language === "Other";

  return (
    <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-8 mt-8">
      <h2 className="text-xl font-bold mb-4">User Settings</h2>
      {error && <div className="mb-3 text-red-600">{error}</div>}
      {success && <div className="mb-3 text-green-600">{success}</div>}

      {!editMode ? (
        <div>
          <div className="flex gap-6 mb-4">
            <div>
              <div className="font-bold text-sm mb-1">First Name</div>
              <div>{profile.first_name || <span className="text-gray-400">—</span>}</div>
            </div>
            <div>
              <div className="font-bold text-sm mb-1">Last Name</div>
              <div>{profile.last_name || <span className="text-gray-400">—</span>}</div>
            </div>
          </div>
          <div className="flex gap-6 mb-4">
            <div>
              <div className="font-bold text-sm mb-1">Email</div>
              <div>{profile.email || <span className="text-gray-400">—</span>}</div>
            </div>
            <div>
              <div className="font-bold text-sm mb-1">Phone</div>
              <div>{profile.phone || <span className="text-gray-400">—</span>}</div>
            </div>
          </div>
          <div className="mb-4">
            <span className="font-bold text-sm">Preferred Contact:</span> {profile.preferred_contact || <span className="text-gray-400">—</span>}
          </div>
          <div className="mb-4 flex gap-8">
            <span className="font-bold text-sm">Notifications:</span>
            <span>Tips <input type="checkbox" checked={!!profile.notifications_tips} disabled /></span>
            <span>Emails <input type="checkbox" checked={!!profile.notifications_updates} disabled /></span>
          </div>
          <div className="mb-4">
            <span className="font-bold text-sm">Time Zone:</span> {profile.timezone || <span className="text-gray-400">—</span>}
          </div>
          <div className="mb-4">
            <span className="font-bold text-sm">Language:</span> {profile.language || <span className="text-gray-400">—</span>}
            {profile.language === "Other" && profile.other_language && (
              <span className="ml-2 text-gray-500">({profile.other_language})</span>
            )}
          </div>
          <button
            className="mt-6 bg-blue-600 text-white font-bold px-6 py-2 rounded hover:bg-blue-700"
            onClick={handleEdit}
          >
            Edit
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="flex gap-6 mb-4">
            <div className="flex-1">
              <label className="block font-bold mb-1">First Name</label>
              <input
                type="text"
                name="first_name"
                value={form.first_name || ""}
                onChange={handleChange}
                className="border px-3 py-2 rounded w-full"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block font-bold mb-1">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={form.last_name || ""}
                onChange={handleChange}
                className="border px-3 py-2 rounded w-full"
                required
              />
            </div>
          </div>
          <div className="flex gap-6 mb-4">
            <div className="flex-1">
              <label className="block font-bold mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email || ""}
                onChange={handleChange}
                className="border px-3 py-2 rounded w-full"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block font-bold mb-1">Phone</label>
              <input
                type="text"
                name="phone"
                value={form.phone || ""}
                onChange={handleChange}
                className="border px-3 py-2 rounded w-full"
                placeholder="Phone number"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block font-bold mb-1">Preferred Contact</label>
            <select
              name="preferred_contact"
              value={form.preferred_contact || "email"}
              onChange={handleChange}
              className="border px-3 py-2 rounded w-full"
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div className="mb-4 flex gap-8">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                name="notifications_tips"
                checked={!!form.notifications_tips}
                onChange={handleChange}
              />
              <span className="ml-2">Tips</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                name="notifications_updates"
                checked={!!form.notifications_updates}
                onChange={handleChange}
              />
              <span className="ml-2">Emails</span>
            </label>
          </div>
          <div className="mb-4">
            <label className="block font-bold mb-1">Time Zone</label>
            <select
              name="timezone"
              value={form.timezone || ""}
              onChange={handleChange}
              className="border px-3 py-2 rounded w-full"
              required
            >
              <option value="">Select...</option>
              {TIMEZONE_OPTIONS.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block font-bold mb-1">Language</label>
            <select
              name="language"
              value={form.language || ""}
              onChange={handleChange}
              className="border px-3 py-2 rounded w-full"
              required
            >
              <option value="">Select...</option>
              {LANGUAGE_OPTIONS.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
            {showOtherLanguage && (
              <input
                type="text"
                name="other_language"
                value={form.other_language || ""}
                onChange={handleChange}
                className="border px-3 py-2 rounded w-full mt-2"
                placeholder="Please specify"
              />
            )}
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
