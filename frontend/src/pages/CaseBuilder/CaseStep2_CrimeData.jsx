import { useState, useId, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import api from "@/utils/axios";

const CRIME_TYPES = ["Homicide", "Assault", "Missing", "Other"];

export default function CaseStep2_CrimeData({ data = {}, next, back, isModal = false }) {
  const firstName = data.first_name || "your loved one";
  const photoUrl = data.photoPreview || data.photo_url || data.photo || "";
  const resultedInDeathId = useId();
  const rewardOfferedId = useId();

  const [form, setForm] = useState({
    date_of_birth: data.date_of_birth || "",
    resulted_in_death: data.resulted_in_death ?? !!data.date_of_death,
    date_of_death: data.date_of_death || "",
    crime_type: data.crime_type || "",
    case_number: data.case_number || "",
    incident_date: data.incident_date || "",
    incident_location: data.incident_location || "",
    incident_latlng: data.incident_latlng || null,
    incident_description: data.description || data.incident_description || "",
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
    reward_offered:
      data.reward_offered === "true" ||
      data.reward_offered === true ||
      data.reward_offered === 1,
    reward_amount: data.reward_amount || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // When "resulted in death" is toggled, automatically set date_of_death to incident_date
  useEffect(() => {
    if (form.resulted_in_death && form.incident_date && !form.date_of_death) {
      setForm(prev => ({
        ...prev,
        date_of_death: prev.incident_date
      }));
    }
  }, [form.resulted_in_death, form.incident_date]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => {
      const newForm = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      // If incident_date changes and resulted_in_death is true, update date_of_death
      if (name === "incident_date" && prev.resulted_in_death) {
        newForm.date_of_death = value;
      }

      return newForm;
    });
  };

  const handleSwitch = (name, checked) => {
    setForm((prev) => {
      const newForm = {
        ...prev,
        [name]: checked,
      };

      // If toggling resulted_in_death to true, set date_of_death to incident_date
      if (name === "resulted_in_death" && checked && prev.incident_date) {
        newForm.date_of_death = prev.incident_date;
      }

      return newForm;
    });
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
      description: form.incident_description || "",
      case_number: form.case_number || "",
      reward_offered: form.reward_offered ? "true" : "false",
      media_links: Array.isArray(form.media_links)
        ? form.media_links.filter(Boolean).join(",")
        : "",
    };

    delete output.incident_description;
    delete output.media_link_input;

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

  const containerClass = isModal ? "w-full" : "w-full p-8 bg-white rounded-lg shadow mt-8";

  return (
    <form
      className={`${containerClass} space-y-6`}
      onSubmit={handleNext}
      autoComplete="off"
    >
      {error && (
        <div className="mb-4 text-red-600 text-center font-medium">{error}</div>
      )}

      <div className={`${isModal ? 'grid grid-cols-1 lg:grid-cols-2 gap-8' : ''}`}>
        {/* Left Column */}
        <div className="space-y-6">
          {/* 1. Person Details */}
          <section>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-3">
              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">1</span>
              About {firstName}
            </h2>
            <div className="flex items-start gap-4">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Portrait"
                  className="h-20 w-20 rounded-lg object-cover border-2 border-gray-200 shadow-sm"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "";
                  }}
                />
              ) : (
                <div className="h-20 w-20 flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 text-xs text-center">
                  No Photo
                </div>
              )}
              <div className="flex-1 space-y-3">
                <div>
                  <label className="block font-semibold mb-1 text-sm">Date of Birth</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={form.date_of_birth}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <Label htmlFor={resultedInDeathId} className="font-semibold text-sm">
                      Did incident result in death?
                    </Label>
                    <Switch
                      id={resultedInDeathId}
                      checked={form.resulted_in_death}
                      onCheckedChange={(checked) =>
                        handleSwitch("resulted_in_death", checked)
                      }
                    />
                    <span className="text-sm text-gray-600">{form.resulted_in_death ? "Yes" : "No"}</span>
                  </div>
                  {form.resulted_in_death && (
                    <div className="mt-2">
                      <label className="block font-semibold mb-1 text-sm text-red-700">Date of Death</label>
                      <input
                        type="date"
                        name="date_of_death"
                        value={form.date_of_death}
                        onChange={handleChange}
                        className="w-full border border-red-300 px-3 py-2 rounded-lg text-sm focus:border-red-500 focus:outline-none"
                      />
                      <p className="text-xs text-red-600 mt-1">
                        This will be automatically set to the incident date unless you specify otherwise.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 2. Incident Details */}
          <section>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-3">
              <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">2</span>
              Incident Details
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-sm">Type of Crime</label>
                  <select
                    name="crime_type"
                    value={form.crime_type}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
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
                {!form.resulted_in_death && (
                  <div>
                    <label className="block font-semibold mb-1 text-sm">Date of Incident</label>
                    <input
                      type="date"
                      name="incident_date"
                      value={form.incident_date}
                      onChange={handleChange}
                      className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                )}
              </div>
              
              {form.resulted_in_death && (
                <div>
                  <label className="block font-semibold mb-1 text-sm">Date of Incident</label>
                  <input
                    type="date"
                    name="incident_date"
                    value={form.incident_date}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1 text-sm">Location of Incident</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    name="incident_location"
                    value={form.incident_location}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 px-3 py-2 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Address, intersection, or landmark"
                    required
                  />
                  <Button type="button" size="sm" onClick={handleMapSelect}>
                    Map
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="block font-semibold mb-1 text-sm">Brief Incident Description</label>
                <textarea
                  name="incident_description"
                  value={form.incident_description}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:border-blue-500 focus:outline-none resize-none"
                  rows={3}
                  placeholder="Brief description of what happened (optional)"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* 3. Investigation Details */}
          <section>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-3">
              <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">3</span>
              Investigation & Contact
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block font-semibold mb-1 text-sm">Investigating Department</label>
                <input
                  type="text"
                  name="investigating_department"
                  value={form.investigating_department}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Police department or agency"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-sm">Case Number</label>
                <input
                  type="text"
                  name="case_number"
                  value={form.case_number}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. 2024-00123"
                />
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-sm">Detective Name</label>
                  <input
                    type="text"
                    name="detective_name"
                    value={form.detective_name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-sm">Detective Phone</label>
                  <input
                    type="text"
                    name="detective_phone"
                    value={form.detective_phone}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-sm">Detective Email</label>
                  <input
                    type="email"
                    name="detective_email"
                    value={form.detective_email}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 4. Media & Reward */}
          <section>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-3">
              <span className="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-sm font-bold">4</span>
              Media & Reward
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block font-semibold mb-1 text-sm">Media Links</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    name="media_link_input"
                    value={form.media_link_input}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 px-3 py-2 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Paste a news or video link"
                  />
                  <Button type="button" onClick={handleAddLink} size="sm">
                    Add
                  </Button>
                </div>
                {form.media_links.length > 0 && (
                  <ul className="mt-2 space-y-1 max-h-20 overflow-y-auto">
                    {form.media_links.map((link, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs">
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline break-all flex-1 truncate"
                          title={link}
                        >
                          {link}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveLink(idx)}
                          className="px-2 py-0.5 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              <div className="border-t pt-4">
                <div className="flex items-center gap-3 mb-3">
                  <Label htmlFor={rewardOfferedId} className="font-semibold text-sm">
                    Reward Offered?
                  </Label>
                  <Switch
                    id={rewardOfferedId}
                    checked={form.reward_offered}
                    onCheckedChange={(checked) =>
                      handleSwitch("reward_offered", checked)
                    }
                  />
                  <span className="text-sm text-gray-600">{form.reward_offered ? "Yes" : "No"}</span>
                </div>
                {form.reward_offered && (
                  <div>
                    <label className="block font-semibold mb-1 text-sm">Reward Amount ($)</label>
                    <input
                      type="number"
                      name="reward_amount"
                      value={form.reward_amount}
                      onChange={handleChange}
                      className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="Enter amount"
                    />
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      {!isModal && (
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
            {loading ? "Saving..." : "Next: Choose Template"}
          </Button>
        </div>
      )}

      {isModal && (
        <div className="flex justify-end mt-6">
          <Button
            type="submit"
            disabled={
              loading ||
              !form.crime_type ||
              !form.incident_date ||
              !form.incident_location
            }
            className="px-8"
          >
            {loading ? "Saving..." : "Next: Choose Template"}
          </Button>
        </div>
      )}
    </form>
  );
}