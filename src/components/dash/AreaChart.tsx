/**
 * رسم بياني خطّي/مساحي بسيط (SVG) — خادمي، بلا مكتبات.
 * يعرض سلسلتين على 7 نقاط (أو أي عدد)، مع شبكة وتسميات أفقية.
 */
export interface Series {
  color: string;
  values: number[];
  dashed?: boolean;
}

const W = 600;
const H = 185;
const PAD_X = 22;
const TOP = 20;
const BOTTOM = 40; // مساحة للتسميات

function buildPath(values: number[], max: number, close: boolean): string {
  const n = values.length;
  if (n === 0) return '';
  const stepX = (W - PAD_X * 2) / Math.max(1, n - 1);
  const usableH = H - TOP - BOTTOM;
  const pts = values.map((v, i) => {
    const x = PAD_X + i * stepX;
    const y = TOP + usableH * (1 - (max ? v / max : 0));
    return [x, y] as const;
  });
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) d += ` L ${pts[i][0]} ${pts[i][1]}`;
  if (close) {
    d += ` L ${pts[n - 1][0]} ${H - BOTTOM} L ${pts[0][0]} ${H - BOTTOM} Z`;
  }
  return d;
}

export default function AreaChart({
  series,
  labels,
}: {
  series: Series[];
  labels: string[];
}) {
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const n = labels.length;
  const stepX = (W - PAD_X * 2) / Math.max(1, n - 1);
  const gridYs = [TOP + 5, TOP + (H - TOP - BOTTOM) / 2, H - BOTTOM];
  const primary = series[0];

  return (
    <svg className="dash-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img">
      <defs>
        <linearGradient id="dashArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={primary?.color ?? 'var(--purple-500)'} stopOpacity="0.35" />
          <stop offset="100%" stopColor={primary?.color ?? 'var(--purple-500)'} stopOpacity="0" />
        </linearGradient>
      </defs>

      {gridYs.map((y, i) => (
        <line key={i} x1="0" y1={y} x2={W} y2={y} stroke="rgba(43, 26, 78,0.08)" strokeDasharray="3 4" />
      ))}

      {primary && (
        <path d={buildPath(primary.values, max, true)} fill="url(#dashArea)" />
      )}

      {series.map((s, si) => (
        <path
          key={si}
          d={buildPath(s.values, max, false)}
          fill="none"
          stroke={s.color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={s.dashed ? '6 3' : undefined}
        />
      ))}

      {/* نقاط السلسلة الأساسية */}
      {primary &&
        primary.values.map((v, i) => {
          const x = PAD_X + i * stepX;
          const y = TOP + (H - TOP - BOTTOM) * (1 - (max ? v / max : 0));
          return <circle key={i} cx={x} cy={y} r="3.5" fill={primary.color} />;
        })}

      <g fontFamily="Qomra, Segoe UI, sans-serif" fontSize="11" fill="var(--gray-500)" textAnchor="middle">
        {labels.map((lab, i) => (
          <text key={i} x={PAD_X + i * stepX} y={H - 14}>
            {lab}
          </text>
        ))}
      </g>
    </svg>
  );
}
