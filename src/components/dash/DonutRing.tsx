/**
 * حلقة نسبة مئوية (SVG) — خادمية.
 */
export default function DonutRing({
  percent,
  label,
  hint,
  size = 150,
  stroke = 13,
  color = 'var(--purple-500)',
}: {
  percent: number;
  label: string;
  hint?: string;
  size?: number;
  stroke?: number;
  color?: string;
}) {
  const p = Math.max(0, Math.min(100, percent));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - p / 100);
  const cx = size / 2;

  return (
    <div className="dash-ring-stat">
      <div className="dash-ring-wrap" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--gray-100)" strokeWidth={stroke} />
          <circle
            cx={cx}
            cy={cx}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="dash-ring-center">
          <div className="dash-ring-value">{p}%</div>
          <div className="dash-ring-label">{label}</div>
        </div>
      </div>
      {hint && <div className="dash-ring-hint">{hint}</div>}
    </div>
  );
}
