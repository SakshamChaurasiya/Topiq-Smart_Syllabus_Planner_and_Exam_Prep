// ProgressRing.jsx — SVG circular progress indicator
const ProgressRing = ({ percent = 0, size = 60, stroke = 5, color = 'var(--primary)', bg = 'var(--bg-elevated)' }) => {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text
        x="50%" y="50%"
        dominantBaseline="middle" textAnchor="middle"
        style={{ transform: 'rotate(90deg)', transformOrigin: 'center', fontSize: size / 5, fontWeight: 700, fill: 'var(--text-primary)' }}
      >
        {Math.round(percent)}%
      </text>
    </svg>
  );
};

export default ProgressRing;
