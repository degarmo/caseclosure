import React, { useState } from "react";
import { checkSubdomain, publishMemorialSite } from "../api/memorialSites";

// Props: open (bool), onClose (fn), site (object), onPublish (fn)
export default function PublishMemorialModal({ open, onClose, site, onPublish }) {
  const [subdomain, setSubdomain] = useState(site.subdomain || "");
  const [checking, setChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(null);
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [status, setStatus] = useState(site.domain_status || "pending");

  if (!open) return null;

  // Check availability as user types or on button click
  const handleCheck = async () => {
    setChecking(true);
    setError("");
    try {
      const available = await checkSubdomain(subdomain);
      setIsAvailable(available);
      if (!available) setError("Subdomain is already taken.");
    } catch (e) {
      setError("Error checking subdomain.");
    } finally {
      setChecking(false);
    }
  };

  // Publish the site (claim subdomain)
  const handlePublish = async () => {
    setPublishing(true);
    setError("");
    try {
      const updated = await publishMemorialSite(site.id, { subdomain, is_public: true });
      setStatus(updated.domain_status || "pending");
      setIsAvailable(null);
      if (onPublish) onPublish(updated); // Let parent refresh
      onClose();
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to publish.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-2">Publish Memorial Site</h2>
        <p className="mb-3 text-sm text-gray-600">Pick a unique subdomain for your public site:</p>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            className="border p-2 rounded flex-1"
            value={subdomain}
            onChange={e => {
              setSubdomain(e.target.value);
              setIsAvailable(null);
              setError("");
            }}
            placeholder="yourmemorial"
            disabled={publishing}
          />
          <span className="self-center">.caseclosure.org</span>
        </div>
        <button
          className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
          onClick={handleCheck}
          disabled={!subdomain || checking || publishing}
          type="button"
        >
          {checking ? "Checking..." : "Check"}
        </button>
        {isAvailable === true && (
          <div className="mt-2 text-green-600 text-sm">Subdomain is available!</div>
        )}
        {isAvailable === false && (
          <div className="mt-2 text-red-600 text-sm">Subdomain is taken.</div>
        )}
        {error && <div className="mt-2 text-red-600 text-sm">{error}</div>}
        <button
          className="mt-4 px-4 py-2 bg-green-700 text-white rounded w-full disabled:opacity-50"
          onClick={handlePublish}
          disabled={!subdomain || isAvailable === false || publishing || checking}
        >
          {publishing ? "Publishing..." : "Publish"}
        </button>
        <div className="mt-4 flex justify-between items-center">
          <span className="text-xs text-gray-500">
            Status: <b className={
              status === "live"
                ? "text-green-600"
                : status === "pending"
                ? "text-yellow-500"
                : "text-red-500"
            }>{status}</b>
          </span>
          <button className="text-xs underline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
