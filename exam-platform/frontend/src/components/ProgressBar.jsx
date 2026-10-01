export default function ProgressBar({ percent }) {
  return (
    <div className="progress-outer">
      <div className="progress-inner" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
    </div>
  );
}
