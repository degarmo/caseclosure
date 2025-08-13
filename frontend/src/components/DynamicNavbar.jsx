import React from "react";
import { Link, useLocation } from "react-router-dom";

// pages = [{ slug: "about", title: "About" }, ...]
export default function DynamicNavbar({ pages = [] }) {
  const location = useLocation();

  return (
    <>
      {pages.map((page) => (
        <Link
          key={page.slug}
          to={`/${page.slug}`}
          className={`px-4 py-2 text-slate-700 hover:text-blue-600 font-medium transition
            ${location.pathname === `/${page.slug}` ? "border-b-2 border-blue-600" : ""}
          `}
        >
          {page.title}
        </Link>
      ))}
    </>
  );
}
