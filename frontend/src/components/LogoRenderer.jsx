import React from "react";

export default function LogoRenderer({ logo, className }) {
  if (logo) {
    return <img src={logo} alt="Site Logo" className={className} />;

  }
  // fallback SVG or placeholder
  return (
    <svg viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="20" fill="#4F8EF7" />
      <text x="24" y="28" fontSize="16" textAnchor="middle" fill="#fff">Logo</text>
    </svg>
  );
}
