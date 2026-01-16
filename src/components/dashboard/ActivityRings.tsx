import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface ActivityRingsProps {
  habitsProgress: number; // 0-100
  tasksProgress: number; // 0-100
  financeProgress: number; // 0-100
  size?: number;
}

export function ActivityRings({ 
  habitsProgress,
  tasksProgress,
  financeProgress,
  size = 84,
}: ActivityRingsProps) {
  const navigate = useNavigate();
  
  // Ring configuration (from outer to inner)
  const rings = [
    { progress: habitsProgress, color: 'hsl(var(--habit))', name: 'habits' },
    { progress: tasksProgress, color: 'hsl(var(--task))', name: 'tasks' },
    { progress: financeProgress, color: 'hsl(var(--finance))', name: 'finance' },
  ];
  
  const strokeWidth = 6;
  const gap = 2;
  const center = size / 2;
  
  return (
    <motion.button
      onClick={() => navigate('/life-focus')}
      className="relative flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
      style={{ width: size, height: size }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {rings.map((ring, index) => {
          // Calculate radius for each ring (outer to inner)
          const radius = (size / 2) - (strokeWidth / 2) - (index * (strokeWidth + gap));
          const circumference = 2 * Math.PI * radius;
          const progressDash = (ring.progress / 100) * circumference;
          
          return (
            <g key={ring.name}>
              {/* Background track */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth={strokeWidth}
                opacity={0.2}
              />
              
              {/* Progress arc */}
              <motion.circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={ring.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${progressDash} ${circumference}`}
                initial={{ strokeDasharray: `0 ${circumference}` }}
                animate={{ strokeDasharray: `${progressDash} ${circumference}` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.1 }}
              />
            </g>
          );
        })}
      </svg>
      
      {/* Center icon */}
      <motion.div 
        className="absolute flex items-center justify-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <span className="text-lg">🌸</span>
      </motion.div>
    </motion.button>
  );
}
