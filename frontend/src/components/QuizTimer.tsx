

interface QuizTimerProps {
  timeLeft: number;
  total: number;
  size?: number;
}

/**
 * QuizTimer — Circular SVG countdown arc
 * Colors: green → yellow → red based on time remaining
 */
export default function QuizTimer({ timeLeft, total, size = 56 }: QuizTimerProps) {
  const R = (size - 8) / 2;          // radius (leave 4px padding each side)
  const circumference = 2 * Math.PI * R;
  const ratio = Math.max(0, timeLeft / total);
  const offset = circumference * (1 - ratio);

  // Color transition: 60%+ = emerald, 30–60% = amber, <30% = red
  const color =
    ratio > 0.6 ? "#00C896"
    : ratio > 0.3 ? "#F5A623"
    : "#FF6B6B";

  const cx = size / 2;
  const cy = size / 2;

  return (
    <div
      title={`${timeLeft}s còn lại`}
      style={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width={size}
        height={size}
        style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}
      >
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={R}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={4}
        />
        {/* Progress arc */}
        <circle
          cx={cx}
          cy={cy}
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.4s ease" }}
        />
      </svg>
      {/* Number */}
      <span
        style={{
          fontFamily: "'Fraunces', serif",
          fontSize: size * 0.3,
          fontWeight: 700,
          color,
          lineHeight: 1,
          zIndex: 1,
          transition: "color 0.4s ease",
          letterSpacing: "-1px",
        }}
      >
        {timeLeft}
      </span>
    </div>
  );
}