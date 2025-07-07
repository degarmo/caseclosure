// src/pages/MemorialPublicPage.jsx
import React, { useEffect, useState } from "react";
import api from "../api/axios";

export default function MemorialPublicPage({ subdomain }) {
  const [memorial, setMemorial] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/sites/public/?subdomain=${subdomain}`)
      .then(res => setMemorial(res.data))
      .catch(() => setNotFound(true));
  }, [subdomain]);

  if (notFound) return <div>Memorial page not found.</div>;
  if (!memorial) return <div>Loading...</div>;

  return (
    <div>
      <h1>{memorial.name}</h1>
      <p>{memorial.victim_name}</p>
      {/* more fields */}
    </div>
  );
}
