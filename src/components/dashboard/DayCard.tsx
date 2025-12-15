import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DayCardProps {
  title: string;
  completed: number;
  total: number;
  color: string;
  icon: React.ReactNode;
  isBalance?: boolean;
  balanceValue?: number;
}

export function DayCard({ title, completed, total, color, icon, isBalance, balanceValue }: DayCardProps) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl p-4 shadow-card transition-all hover:shadow-lg",
        "border border-border/50"
      )}
      style={{ backgroundColor: `${color}20` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}30` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
        
        {/* Progress Ring */}
        <div className="relative w-12 h-12">
          <svg className="w-12 h-12 progress-ring" viewBox="0 0 48 48">
            <circle
              cx="24"
              cy="24"
              r={radius}
              fill="none"
              stroke="hsl(var(--background))"
              strokeWidth="4"
              opacity="0.5"
            />
            <circle
              cx="24"
              cy="24"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500"
            />
          </svg>
          <span 
            className="absolute inset-0 flex items-center justify-center text-xs font-semibold"
            style={{ color }}
          >
            {Math.round(percentage)}%
          </span>
        </div>
      </div>

      <h3 className="text-sm font-medium mb-1" style={{ color }}>{title}</h3>
      
      {isBalance ? (
        <p 
          className="text-xl font-bold"
          style={{ color: balanceValue && balanceValue >= 0 ? 'hsl(145, 70%, 35%)' : 'hsl(0, 70%, 45%)' }}
        >
          {balanceValue && balanceValue >= 0 ? '+' : ''}{balanceValue?.toLocaleString() || 0} ₽
        </p>
      ) : (
        <p className="text-xl font-bold" style={{ color }}>
          {completed}/{total}
        </p>
      )}
    </motion.div>
  );
}
