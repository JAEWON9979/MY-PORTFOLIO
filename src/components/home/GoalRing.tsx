interface GoalRingProps {
  rate: number;
  size?: number;
}

export default function GoalRing({ rate, size = 112 }: GoalRingProps) {
  const r = 36;
  const cx = 50;
  const cy = 50;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(Math.max(rate, 0), 100);
  const offset = circumference * (1 - clamped / 100);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="shrink-0"
      aria-label={`달성률 ${clamped}%`}
    >
      {/* track */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#f4f4f5"
        strokeWidth="12"
      />
      {/* progress arc */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#18181b"
        strokeWidth="12"
        strokeDasharray={String(circumference)}
        strokeDashoffset={String(offset)}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      {/* center label */}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="20"
        fontWeight="700"
        fill="#18181b"
      >
        {clamped}%
      </text>
    </svg>
  );
}
