export function Spinner({ size = 24, label }: { size?: number; label?: string }) {
  return (
    <div className="spinner-wrapper">
      <div className="spinner" style={{ width: size, height: size }} />
      {label && <span className="spinner-label">{label}</span>}
    </div>
  );
}
