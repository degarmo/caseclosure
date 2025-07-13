import React from "react";

export function Label({ htmlFor, children, className = "", ...props }) {
  return (
    <label htmlFor={htmlFor} className={`font-medium text-gray-800 ${className}`} {...props}>
      {children}
    </label>
  );
}
export default Label;
