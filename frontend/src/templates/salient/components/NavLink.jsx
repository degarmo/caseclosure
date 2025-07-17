import { Link, useLocation } from "react-router-dom";

export function NavLink({ to, href, children, className = "", ...rest }) {
  const location = useLocation();
  let isActive = false;

  if (to) {
    isActive = location.pathname === to;
  }

  if (to) {
    return (
      <Link
        to={to}
        className={`text-slate-700 hover:text-blue-600 font-medium transition ${isActive ? "font-bold underline" : ""} ${className}`}
        {...rest}
      >
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        className={`text-slate-700 hover:text-blue-600 font-medium transition ${className}`}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return null;
}
