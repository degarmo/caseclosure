export function Button({ type = "button", variant = "primary", className = "", children, ...props }) {
  const base = "inline-flex items-center px-4 py-2 font-semibold rounded shadow transition disabled:opacity-60 focus:outline-none";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
  };
  return (
    <button
      type={type}
      className={`${base} ${variants[variant] || ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
export default Button;
