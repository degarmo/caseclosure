import React from "react";

export function Switch({ id, checked, onCheckedChange, className = "", ...props }) {
  // Standard switch component (styled for Tailwind)
  return (
    <label className={`relative inline-block w-11 h-6 align-middle select-none ${className}`}>
      <input
        type="checkbox"
        id={id}
        checked={!!checked}
        onChange={e => onCheckedChange?.(e.target.checked)}
        className="sr-only"
        {...props}
      />
      <span
        className={
          "block w-11 h-6 rounded-full transition bg-gray-200 " +
          (checked ? "bg-indigo-500" : "bg-gray-200")
        }
      ></span>
      <span
        className={
          "absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition shadow " +
          (checked ? "translate-x-5" : "")
        }
      ></span>
    </label>
  );
}
export default Switch;
