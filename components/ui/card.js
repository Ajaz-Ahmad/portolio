export function Card({ children }) {
  return <div className="rounded-lg border shadow p-4">{children}</div>;
}

export function CardContent({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}
