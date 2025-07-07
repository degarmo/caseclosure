import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function MemorialPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [memorial, setMemorial] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef();

  useEffect(() => {
    api.get(`sites/${id}/`)
      .then(res => {
        setMemorial(res.data);
        setForm({ ...res.data });
      })
      .catch(() => setError("Memorial not found."));
  }, [id]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = e => {
    setForm({ ...form, photo: e.target.files[0] });
  };

  const handleEdit = () => {
    setEditing(true);
    setSuccess(""); setError("");
  };

  const handleCancel = () => {
    setEditing(false);
    setForm({ ...memorial });
    setSuccess(""); setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      let data;
      let headers = {};
      // Handle file upload if photo changed
      if (form.photo && form.photo !== memorial.photo) {
        data = new FormData();
        Object.keys(form).forEach(key => {
          if (form[key] !== null && form[key] !== undefined)
            data.append(key, form[key]);
        });
        headers["Content-Type"] = "multipart/form-data";
      } else {
        data = { ...form };
      }
      const res = await api.patch(`sites/${id}/`, data, { headers });
      setMemorial(res.data);
      setEditing(false);
      setSuccess("Memorial updated!");
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
        "Could not update memorial. Please check your input."
      );
    }
  };

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!memorial) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 my-8">
      <h1 className="text-3xl font-bold mb-4 text-blue-600">
        {memorial.name || "Memorial Site"}
      </h1>
      {memorial.photo && !editing && (
        <img
          src={memorial.photo}
          alt="Victim"
          className="w-48 h-48 object-cover rounded-lg mb-6 border"
        />
      )}
      {editing ? (
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 font-bold">Site Title</label>
            <input
              name="name"
              value={form.name || ""}
              onChange={handleChange}
              required
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 font-bold">Victim Name</label>
            <input
              name="victim_name"
              value={form.victim_name || ""}
              onChange={handleChange}
              required
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 font-bold">Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="w-full border px-3 py-2 rounded"
            />
            {memorial.photo && (
              <img src={memorial.photo} alt="Victim" className="w-24 h-24 object-cover mt-2 rounded" />
            )}
          </div>
          <div>
            <label className="block text-sm mb-1 font-bold">Date of Birth</label>
            <input
              type="date"
              name="date_of_birth"
              value={form.date_of_birth || ""}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 font-bold">Date of Death</label>
            <input
              type="date"
              name="date_of_death"
              value={form.date_of_death || ""}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 font-bold">Incident Date</label>
            <input
              type="date"
              name="incident_date"
              value={form.incident_date || ""}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 font-bold">Incident Location</label>
            <input
              name="incident_location"
              value={form.incident_location || ""}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 font-bold">Case Number</label>
            <input
              name="case_number"
              value={form.case_number || ""}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 font-bold">Investigating Department</label>
            <input
              name="investigating_department"
              value={form.investigating_department || ""}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 font-bold">Detective Contact</label>
            <input
              name="detective_contact"
              value={form.detective_contact || ""}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 font-bold">Description</label>
            <textarea
              name="description"
              value={form.description || ""}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
              rows={4}
            />
          </div>
          <div>
            <label className="block text-sm mb-1 font-bold">Media Links</label>
            <input
              name="media_links"
              value={form.media_links || ""}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
              placeholder="Comma-separated URLs"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 font-bold">Reward Offered</label>
            <input
              name="reward_offered"
              value={form.reward_offered || ""}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
              placeholder="Reward details"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_public"
              checked={form.is_public}
              onChange={e => setForm({ ...form, is_public: e.target.checked })}
            />
            <label className="block text-sm font-bold">Publicly Visible</label>
          </div>
          <div>
            <label className="block text-sm mb-1 font-bold">Subdomain</label>
            <input
              name="subdomain"
              value={form.subdomain || ""}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
              placeholder="Unique subdomain"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 font-bold">Custom Domain</label>
            <input
              name="custom_domain"
              value={form.custom_domain || ""}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
              placeholder="Custom domain (optional)"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 transition"
            >
              Save
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-3">
          {memorial.photo && (
            <img src={memorial.photo} alt="Victim" className="w-48 h-48 object-cover rounded-lg border mb-4" />
          )}
          <ReadOnlyRow label="Victim Name" value={memorial.victim_name} />
          <ReadOnlyRow label="Date of Birth" value={memorial.date_of_birth} />
          <ReadOnlyRow label="Date of Death" value={memorial.date_of_death} />
          <ReadOnlyRow label="Incident Date" value={memorial.incident_date} />
          <ReadOnlyRow label="Incident Location" value={memorial.incident_location} />
          <ReadOnlyRow label="Case Number" value={memorial.case_number} />
          <ReadOnlyRow label="Investigating Dept." value={memorial.investigating_department} />
          <ReadOnlyRow label="Detective Contact" value={memorial.detective_contact} />
          <ReadOnlyRow label="Reward Offered" value={memorial.reward_offered} />
          <ReadOnlyRow label="Media Links" value={memorial.media_links} />
          <ReadOnlyRow label="Description" value={memorial.description} isTextarea />
          <ReadOnlyRow label="Subdomain" value={memorial.subdomain} />
          <ReadOnlyRow label="Custom Domain" value={memorial.custom_domain} />
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">Publicly Visible:</span>
            <span className={memorial.is_public ? "text-green-600" : "text-red-600"}>
              {memorial.is_public ? "Yes" : "No"}
            </span>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600 transition"
              onClick={handleEdit}
            >
              Edit
            </button>
            <button
              className="bg-gray-400 text-white px-4 py-2 rounded shadow hover:bg-gray-600 transition"
              onClick={() => navigate("/dashboard")}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
      {success && <div className="mt-4 text-green-600">{success}</div>}
      {error && <div className="mt-4 text-red-600">{error}</div>}
    </div>
  );
}

// Helper component for read-only rows
function ReadOnlyRow({ label, value, isTextarea }) {
  return (
    <div>
      <span className="block text-sm font-bold">{label}:</span>
      <span className={`block text-slate-600 ${isTextarea ? "whitespace-pre-line" : ""}`}>
        {value || <span className="text-slate-400">—</span>}
      </span>
    </div>
  );
}
