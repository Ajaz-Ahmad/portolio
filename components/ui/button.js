import React from "react";

export function Button({ children, asChild = false, variant = "solid" }) {
  const className = variant === "outline"
    ? "border border-blue-600 text-blue-600 px-4 py-2 rounded hover:bg-blue-50"
    : "bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700";

  if (asChild) {
    return React.cloneElement(React.Children.only(children), { className });
  }
  return <button className={className}>{children}</button>;
}
