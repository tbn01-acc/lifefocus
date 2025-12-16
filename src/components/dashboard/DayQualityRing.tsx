import { motion } from 'framer-motion';

interface DayQualityRingProps {
  value: number; // 0-100
  size?: number;
}

function getQualityColor(value: number): string {
  if (value <= 20) return 'hsl(0, 70%, 50%)'; // red
  if (value <= 40) return 'hsl(30, 90%, 50%)'; // orange
  if (value <= 60) return 'hsl(50, 90%, 50%)'; // yellow
  if (value <= 80) return 'hsl(145, 70%, 45%)'; // green
  if (value <= 90) return 'hsl(200, 80%, 50%)'; // cyan
  if (value < 100) return 'hsl(220, 80%, 55%)'; // blue
  return 'hsl(262, 80%, 55%)'; // purple (100%)
}

export function DayQualityRing({ value, size = 56 }: DayQualityRingProps) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = getQualityColor(value);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="progress-ring"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-foreground">{value}</span>
      </div>
    </div>
  );
}
