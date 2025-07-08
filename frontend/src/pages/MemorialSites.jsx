import React, { useEffect, useState } from "react";
import axios from "axios";
import PublishMemorialModal from "../components/PublishMemorialModal";

// Utility for formatting date strings
const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString() : "—";

export default function MemorialSites() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishOpen, setPublishOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const [error, setError] = useState("");

  // Fetch sites from backend
  const fetchSites = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("/api/sites/sites/", { withCredentials: true });
      setSites(res.data);
    } catch (err) {
      setError("Failed to load memorial sites.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  // Handle publish modal open
  const openPublishModal = (site) => {
    setSelectedSite(site);
    setPublishOpen(true);
  };

  // Called after publish completes
  const handlePublish = () => {
    setPublishOpen(false);
    setSelectedSite(null);
    fetchSites(); // Refresh the site list
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Your Memorial Sites</h1>
      {error && <div className="mb-4 text-red-600">{error}</div>}
      {loading ? (
        <div>Loading…</div>
      ) : sites.length === 0 ? (
        <div className="text-gray-500">You have no memorial sites yet.</div>
      ) : (
        <div className="space-y-4">
          {sites.map(site => (
            <div
              key={site.id}
              className="p-4 bg-white rounded-xl shadow flex flex-col md:flex-row md:items-center md:justify-between"
            >
              <div className="flex-1">
                <div className="font-bold text-lg">{site.name}</div>
                <div className="text-sm text-gray-600">{site.victim_name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Created: {formatDate(site.created_at)}
                </div>
                <div className="text-xs mt-1">
                  <b>Status:</b>{" "}
                  {site.is_public ? (
                    <span className={
                      site.domain_status === "live"
                        ? "text-green-600"
                        : site.domain_status === "pending"
                        ? "text-yellow-500"
                        : "text-red-500"
                    }>
                      {site.domain_status.charAt(0).toUpperCase() + site.domain_status.slice(1)}
                    </span>
                  ) : (
                    <span className="text-gray-600">Draft (Not Published)</span>
                  )}
                </div>
                {site.is_public && site.subdomain && (
                  <div className="mt-2 text-xs">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                      https://{site.subdomain}.caseclosure.org
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-3 md:mt-0 flex flex-col gap-2">
                <button
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                  onClick={() => openPublishModal(site)}
                >
                  {site.is_public ? "Update Domain" : "Publish"}
                </button>
                {/* Add more actions (edit, delete) here if needed */}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Publish Modal */}
      <PublishMemorialModal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        site={selectedSite}
        onPublish={handlePublish}
      />
    </div>
  );
}
