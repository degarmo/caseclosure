// src/components/Fieldset.jsx

export function Field({ children, className = "", ...props }) {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function Label({ children, htmlFor, className = "", ...props }) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block font-bold mb-1 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}
