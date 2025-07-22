import { useState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import api from "@/utils/axios";

const CRIME_TYPES = ["Homicide", "Assault", "Missing", "Other"];

export default function CaseStep2_CrimeData({ data = {}, next, back }) {
  const firstName = data.first_name || "your loved one";
  // Always prefer data.photo, then data.portrait, then ""
  const portrait = data.photo || data.portrait || "";
  const photoUrl = portrait && typeof portrait === "string" ? portrait : "";
  const resultedInDeathId = useId();
  const rewardOfferedId = useId();

  const [form, setForm] = useState({
    date_of_birth: data.date_of_birth || "",
    resulted_in_death: data.resulted_in_death ?? !!data.date_of_death,
    date_of_death: data.date_of_death || "",
    crime_type: data.crime_type || "",
    incident_date: data.incident_date || "",
    incident_location: data.incident_location || "",
    incident_latlng: data.incident_latlng || null,
    incident_description: data.incident_description || "",
    investigating_department: data.investigating_department || "",
    detective_name: data.detective_name || "",
    detective_phone: data.detective_phone || "",
    detective_email: data.detective_email || "",
    media_links: Array.isArray(data.media_links)
      ? data.media_links
      : typeof data.media_links === "string"
      ? data.media_links.split(",").filter(Boolean)
      : [],
    media_link_input: "",
    reward_offered: data.reward_offered === "true" || data.reward_offered === true,
    reward_amount: data.reward_amount || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSwitch = (name, checked) => {
    setForm((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleAddLink = (e) => {
    e.preventDefault();
    const link = form.media_link_input.trim();
    if (link && !form.media_links.includes(link)) {
      setForm((prev) => ({
        ...prev,
        media_links: [...prev.media_links, link],
        media_link_input: "",
      }));
    }
  };

  const handleRemoveLink = (idx) => {
    setForm((prev) => ({
      ...prev,
      media_links: prev.media_links.filter((_, i) => i !== idx),
    }));
  };

  const handleMapSelect = () => {
    alert("Map selection coming soon!");
  };

  const handleNext = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const output = {
      ...form,
      resulted_in_death: !!form.resulted_in_death,
      reward_offered: form.reward_offered ? "true" : "false",
      media_links: Array.isArray(form.media_links)
        ? form.media_links.filter(Boolean).join(",")
        : "",
    };

    if (!output.resulted_in_death) delete output.date_of_death;
    if (output.reward_offered !== "true") delete output.reward_amount;
    if (!output.reward_amount) delete output.reward_amount;
    if (data.user) output.user = data.user;

    try {
      const res = await api.patch(`/cases/${data.id}/`, output);
      setLoading(false);
      next({ ...form, ...res.data });
    } catch (err) {
      setLoading(false);
      setError(
        err?.response?.data?.detail ||
          JSON.stringify(err?.response?.data) ||
          err?.message ||
          "Could not update case."
      );
      console.error(
        "[CaseStep2_CrimeData] ERROR during PATCH:",
        err,
        err.response?.data
      );
    }
  };

  return (
    <form
      className="w-full p-8 bg-white rounded-lg shadow mt-8 space-y-10"
      onSubmit={handleNext}
      autoComplete="off"
    >
      {error && (
        <div className="mb-4 text-red-600 text-center font-medium">{error}</div>
      )}

      {/* 1. More about Loved One */}
      <section>
        <h2 className="text-lg font-bold mb-4">1. More about {firstName}</h2>
        <div className="flex items-start mb-4 gap-6">
          <div>
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Portrait"
                className="h-28 w-28 rounded-lg object-cover border"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "";
                }}
              />
            ) : (
              <div className="h-28 w-28 flex items-center justify-center bg-gray-100 rounded-lg border text-gray-400">
                No Image
              </div>
            )}
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <label className="block font-bold mb-1">Date of Birth</label>
              <input
                type="date"
                name="date_of_birth"
                value={form.date_of_birth}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor={resultedInDeathId} className="font-bold">
                  Did incident result in death?
                </Label>
                <Switch
                  id={resultedInDeathId}
                  checked={form.resulted_in_death}
                  onCheckedChange={(checked) =>
                    handleSwitch("resulted_in_death", checked)
                  }
                />
                <span>{form.resulted_in_death ? "Yes" : "No"}</span>
              </div>
            </div>
            {form.resulted_in_death && (
              <div>
                <label className="block font-bold mb-1">Date of Death</label>
                <input
                  type="date"
                  name="date_of_death"
                  value={form.date_of_death}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Incident Details */}
      <section>
        <h2 className="text-lg font-bold mb-4">2. Incident Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold mb-1">Type of Crime</label>
            <select
              name="crime_type"
              value={form.crime_type}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
              required
            >
              <option value="">Select...</option>
              {CRIME_TYPES.map((ct) => (
                <option key={ct} value={ct}>
                  {ct}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold mb-1">Date of Crime</label>
            <input
              type="date"
              name="incident_date"
              value={form.incident_date}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
              required
            />
          </div>
        </div>
        <div className="my-3">
          <label className="block font-bold mb-1">Location of Incident</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              name="incident_location"
              value={form.incident_location}
              onChange={handleChange}
              className="flex-1 border px-3 py-2 rounded"
              placeholder="Address, intersection, or landmark"
              required
            />
            <Button type="button" className="ml-2" onClick={handleMapSelect}>
              Pinpoint on Map
            </Button>
          </div>
        </div>
        <div>
          <label className="block font-bold mb-1">
            Brief Incident Description
          </label>
          <textarea
            name="incident_description"
            value={form.incident_description}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            rows={3}
            placeholder="Optional"
          />
        </div>
      </section>

      {/* 3. Contacts */}
      <section>
        <h2 className="text-lg font-bold mb-4">3. Contacts & Reporting</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold mb-1">
              Investigating Department
            </label>
            <input
              type="text"
              name="investigating_department"
              value={form.investigating_department}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block font-bold mb-1">Detective Name</label>
            <input
              type="text"
              name="detective_name"
              value={form.detective_name}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block font-bold mb-1">Detective Phone</label>
            <input
              type="text"
              name="detective_phone"
              value={form.detective_phone}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block font-bold mb-1">Detective Email</label>
            <input
              type="email"
              name="detective_email"
              value={form.detective_email}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
        </div>
      </section>

      {/* 4. Media & Reward */}
      <section>
        <h2 className="text-lg font-bold mb-4">4. Media & Reward</h2>
        <div className="mb-4">
          <label className="block font-bold mb-1">Media Links</label>
          <div className="flex gap-2">
            <input
              type="url"
              name="media_link_input"
              value={form.media_link_input}
              onChange={handleChange}
              className="flex-1 border px-3 py-2 rounded"
              placeholder="Paste a news or video link"
            />
            <Button type="button" onClick={handleAddLink}>
              Add
            </Button>
          </div>
          <ul className="mt-2 space-y-1">
            {form.media_links.map((link, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 underline break-all"
                >
                  {link}
                </a>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleRemoveLink(idx)}
                  className="ml-2 px-2 py-0.5 text-xs bg-red-200 hover:bg-red-300 text-red-800 rounded"
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Label htmlFor={rewardOfferedId} className="font-bold">
              Reward Offered?
            </Label>
            <Switch
              id={rewardOfferedId}
              checked={form.reward_offered}
              onCheckedChange={(checked) =>
                handleSwitch("reward_offered", checked)
              }
            />
            <span>{form.reward_offered ? "Yes" : "No"}</span>
          </div>
          {form.reward_offered && (
            <div className="mt-2">
              <label className="block font-bold mb-1">Reward Amount ($)</label>
              <input
                type="number"
                name="reward_amount"
                value={form.reward_amount}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
          )}
        </div>
      </section>

      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          type="button"
          onClick={back}
          disabled={loading}
        >
          Back
        </Button>
        <Button
          type="submit"
          disabled={
            loading ||
            !form.crime_type ||
            !form.incident_date ||
            !form.incident_location
          }
        >
          {loading ? "Saving..." : "Next"}
        </Button>
      </div>
    </form>
  );
}
