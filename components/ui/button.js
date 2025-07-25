export function Button({ children, asChild = false, variant = "solid" }) {
  const className = variant === "outline"
    ? "border border-blue-600 text-blue-600 px-4 py-2 rounded hover:bg-blue-50"
    : "bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700";

  return asChild ? (
    <span className={className}>{children}</span>
  ) : (
    <button className={className}>{children}</button>
  );
}
