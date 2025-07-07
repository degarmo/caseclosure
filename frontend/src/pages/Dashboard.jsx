import React, { useEffect, useState } from "react";
import api from "../api/axios";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [sites, setSites] = useState([]);
  const [form, setForm] = useState({
    name: "",
    victim_name: "",
    subdomain: "",
    custom_domain: "",
    description: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Fetch user info
    api
      .get("auth/user/")
      .then((res) => setUser(res.data))
      .catch(() => setUser(null));
    // Fetch sites
    api
      .get("sites/")
      .then((res) => setSites(res.data))
      .catch(() => setSites([]));
  }, [success]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      await api.post("sites/", form, {
        headers: { "Content-Type": "application/json" },
      });
      setSuccess("Memorial site created!");
      setForm({
        name: "",
        victim_name: "",
        subdomain: "",
        custom_domain: "",
        description: "",
      });
      setModalOpen(false);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
        "Error creating site. Please check your input."
      );
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8 mb-8">
          <h1 className="text-3xl font-bold mb-2 text-blue-600">
            Welcome{user ? `, ${user.username}` : ""}!
          </h1>
          <p className="text-slate-600 mb-6">
            This is your CaseClosure dashboard.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create Memorial Site Card */}
            <div className="bg-slate-50 rounded-lg p-6 shadow">
              <h2 className="text-xl font-semibold mb-2">Create a Memorial Site</h2>
              <p className="text-slate-600 mb-4">
                Honor your loved one and start tracking leads.
              </p>
              <button
                className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 transition"
                onClick={() => setModalOpen(true)}
              >
                Create Memorial Site
              </button>
            </div>
            {/* User Sites Card */}
            <div className="bg-slate-50 rounded-lg p-6 shadow">
              <h2 className="text-xl font-semibold mb-2">Your Sites</h2>
              <p className="text-slate-600 mb-4">
                List and manage all your memorial pages here.
              </p>
              {sites.length === 0 ? (
                <div className="text-slate-400">No sites yet.</div>
              ) : (
                <ul>
                  {sites.map((site) => (
                    <li key={site.id} className="mb-2">
                      <span className="font-semibold">{site.name}</span>{" "}
                      <span className="text-xs text-slate-400">{site.subdomain}.caseclosure.org</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Modal for Site Creation */}
        {modalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-8">
              <h2 className="text-2xl font-bold mb-4">Create Memorial Site</h2>
              {error && (
                <div className="mb-4 text-red-500 text-center">{error}</div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm mb-1">Site Title</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm mb-1">Victim Name</label>
                  <input
                    name="victim_name"
                    value={form.victim_name}
                    onChange={handleChange}
                    required
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm mb-1">Subdomain</label>
                  <input
                    name="subdomain"
                    value={form.subdomain}
                    onChange={handleChange}
                    required
                    className="w-full border px-3 py-2 rounded"
                  />
                  <small className="text-slate-400">Will appear as subdomain.caseclosure.org</small>
                </div>
                <div className="mb-4">
                  <label className="block text-sm mb-1">Custom Domain (optional)</label>
                  <input
                    name="custom_domain"
                    value={form.custom_domain}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded"
                  />
                  <small className="text-slate-400">e.g. 4josh.org</small>
                </div>
                <div className="mb-4">
                  <label className="block text-sm mb-1">Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded"
                    rows={3}
                  />
                </div>
                {/* Add more fields as you wish */}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
                    onClick={() => setModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 transition"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-600 text-white py-2 px-6 rounded-lg shadow-lg z-50">
            {success}
          </div>
        )}

        {/* Placeholder for analytics */}
        <div className="bg-white shadow rounded-lg p-6 text-slate-500 text-center mt-8">
          Visitor Analytics Coming Soon!
        </div>
      </div>
    </div>
  );
}
