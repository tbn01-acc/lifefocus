import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getPersonalSpheres, 
  getSocialSpheres,
  getSphereName,
  Sphere,
  SphereIndex,
} from '@/types/sphere';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTasks } from '@/hooks/useTasks';
import { useHabits } from '@/hooks/useHabits';
import { useSubscription } from '@/hooks/useSubscription';
import { format, subDays, subMonths } from 'date-fns';
import { ru, es, enUS } from 'date-fns/locale';
import { Lock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface BalanceFlowerProps {
  sphereIndices: SphereIndex[];
  lifeIndex: number;
}

type ColorScheme = 'default' | 'pastel' | 'neon';

// Color scheme configurations
const colorSchemes: Record<ColorScheme, (hex: string, hsl: { h: number; s: number; l: number }) => { 
  fill: string; 
  stroke: string;
  gradientStart: string;
  gradientMid: string;
  gradientEnd: string;
}> = {
  default: (hex, hsl) => ({
    fill: hex,
    stroke: hex,
    gradientStart: `hsl(${hsl.h}, ${Math.max(hsl.s - 20, 30)}%, ${Math.min(hsl.l + 20, 85)}%)`,
    gradientMid: hex,
    gradientEnd: `hsl(${hsl.h}, ${Math.min(hsl.s + 40, 100)}%, ${Math.max(hsl.l - 15, 30)}%)`,
  }),
  pastel: (hex, hsl) => ({
    fill: `hsl(${hsl.h}, ${Math.max(hsl.s - 30, 25)}%, ${Math.min(hsl.l + 25, 90)}%)`,
    stroke: `hsl(${hsl.h}, ${Math.max(hsl.s - 20, 35)}%, ${Math.min(hsl.l + 15, 80)}%)`,
    gradientStart: `hsl(${hsl.h}, ${Math.max(hsl.s - 40, 20)}%, 92%)`,
    gradientMid: `hsl(${hsl.h}, ${Math.max(hsl.s - 25, 30)}%, ${Math.min(hsl.l + 20, 85)}%)`,
    gradientEnd: `hsl(${hsl.h}, ${Math.max(hsl.s - 15, 40)}%, ${Math.min(hsl.l + 10, 75)}%)`,
  }),
  neon: (hex, hsl) => ({
    fill: `hsl(${hsl.h}, 100%, 55%)`,
    stroke: `hsl(${hsl.h}, 100%, 60%)`,
    gradientStart: `hsl(${hsl.h}, 100%, 70%)`,
    gradientMid: `hsl(${hsl.h}, 100%, 55%)`,
    gradientEnd: `hsl(${hsl.h}, 100%, 40%)`,
  }),
};

// Helper to convert hex color to HSL for glow effects
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  // Handle HSL format
  if (hex.startsWith('hsl')) {
    const match = hex.match(/hsl\((\d+),\s*(\d+)%?,\s*(\d+)%?\)/);
    if (match) {
      return { h: parseInt(match[1]), s: parseInt(match[2]), l: parseInt(match[3]) };
    }
  }
  
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 50, l: 50 };
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// Life Index Progress Chart Component
function LifeIndexProgressChart({
  lifeIndex,
  language,
}: {
  lifeIndex: number;
  language: 'ru' | 'en' | 'es';
}) {
  const [period, setPeriod] = useState<'month' | 'year'>('month');
  
  // Generate mock history data (will be replaced with real data when DB table is created)
  const historyData = useMemo(() => {
    const data: Array<{ date: string; value: number; label: string }> = [];
    const now = new Date();
    const locale = language === 'ru' ? ru : language === 'es' ? es : enUS;
    
    if (period === 'month') {
      // Last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = subDays(now, i);
        // Simulate some variation around current value
        const variation = Math.sin(i * 0.3) * 15 + Math.random() * 10 - 5;
        const value = Math.max(0, Math.min(100, lifeIndex + variation - (29 - i) * 0.3));
        data.push({
          date: format(date, 'yyyy-MM-dd'),
          value: Math.round(value),
          label: format(date, 'd MMM', { locale }),
        });
      }
    } else {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = subMonths(now, i);
        const variation = Math.sin(i * 0.5) * 20 + Math.random() * 10 - 5;
        const value = Math.max(0, Math.min(100, lifeIndex + variation - (11 - i) * 0.8));
        data.push({
          date: format(date, 'yyyy-MM'),
          value: Math.round(value),
          label: format(date, 'MMM', { locale }),
        });
      }
    }
    return data;
  }, [period, lifeIndex, language]);

  // Calculate trend
  const trend = useMemo(() => {
    if (historyData.length < 2) return 0;
    const recent = historyData.slice(-5).reduce((sum, d) => sum + d.value, 0) / 5;
    const older = historyData.slice(0, 5).reduce((sum, d) => sum + d.value, 0) / 5;
    return recent - older;
  }, [historyData]);

  const labels = {
    ru: { month: 'Месяц', year: 'Год', progress: 'Динамика' },
    en: { month: 'Month', year: 'Year', progress: 'Progress' },
    es: { month: 'Mes', year: 'Año', progress: 'Progreso' },
  };
  const t = labels[language] || labels.en;

  return (
    <div className="w-full mt-4 p-3 bg-card/50 rounded-xl border border-border/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{t.progress}</span>
          {trend > 3 && <TrendingUp className="w-4 h-4 text-green-500" />}
          {trend < -3 && <TrendingDown className="w-4 h-4 text-red-500" />}
          {Math.abs(trend) <= 3 && <Minus className="w-4 h-4 text-muted-foreground" />}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('month')}
            className={`text-xs px-3 py-1 rounded-full transition-all ${
              period === 'month'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {t.month}
          </button>
          <button
            onClick={() => setPeriod('year')}
            className={`text-xs px-3 py-1 rounded-full transition-all ${
              period === 'year'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {t.year}
          </button>
        </div>
      </div>
      
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={historyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="label" 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              interval={period === 'month' ? 6 : 1}
            />
            <YAxis 
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              tickCount={3}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#progressGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Balance Scales Widget Component with swing animation
function BalanceScalesWidget({ 
  personalValue, 
  socialValue, 
  language 
}: { 
  personalValue: number; 
  socialValue: number; 
  language: 'ru' | 'en' | 'es';
}) {
  const diff = personalValue - socialValue;
  // Calculate tilt angle (max 18 degrees)
  const maxTilt = 18;
  const tiltAngle = Math.abs(diff) < 5 ? 0 : Math.min(Math.abs(diff) / 100 * maxTilt * 2, maxTilt) * (diff > 0 ? -1 : 1);
  
  const labels = {
    ru: { personal: 'Личное', social: 'Социальное' },
    en: { personal: 'Personal', social: 'Social' },
    es: { personal: 'Personal', social: 'Social' },
  };
  const t = labels[language] || labels.en;

  return (
    <div className="w-full max-w-sm mx-auto mt-4">
      <svg viewBox="0 0 280 140" className="w-full h-auto">
        <defs>
          {/* Warm gradient for Personal */}
          <linearGradient id="warmGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFA07A" />
            <stop offset="50%" stopColor="#FF6B6B" />
            <stop offset="100%" stopColor="#E55039" />
          </linearGradient>
          {/* Cold gradient for Social */}
          <linearGradient id="coldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#74B9FF" />
            <stop offset="50%" stopColor="#0984E3" />
            <stop offset="100%" stopColor="#0652DD" />
          </linearGradient>
          {/* Metal gradient for beam */}
          <linearGradient id="metalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#A0A0A0" />
            <stop offset="50%" stopColor="#707070" />
            <stop offset="100%" stopColor="#505050" />
          </linearGradient>
        </defs>

        {/* Stand base */}
        <path 
          d="M 120 130 L 160 130 L 155 125 L 125 125 Z" 
          fill="url(#metalGradient)"
        />
        
        {/* Stand pillar */}
        <rect x="136" y="70" width="8" height="55" fill="url(#metalGradient)" rx="1" />
        
        {/* Fulcrum triangle */}
        <path d="M 140 70 L 130 80 L 150 80 Z" fill="url(#metalGradient)" />
        
        {/* Pivot point */}
        <circle cx="140" cy="68" r="5" fill="#606060" stroke="#404040" strokeWidth="1" />
        
        {/* Indicator needle with swing animation */}
        <motion.g
          initial={{ rotate: 30 }}
          animate={{ rotate: tiltAngle }}
          transition={{ 
            type: 'spring', 
            stiffness: 40, 
            damping: 8,
            mass: 1.5
          }}
          style={{ transformOrigin: '140px 68px' }}
        >
          <line x1="140" y1="68" x2="140" y2="45" stroke="#303030" strokeWidth="2" />
          <circle cx="140" cy="43" r="3" fill="#404040" />
        </motion.g>
        
        {/* Balance beam (коромысло) with swing animation */}
        <motion.g
          initial={{ rotate: 30 }}
          animate={{ rotate: tiltAngle }}
          transition={{ 
            type: 'spring', 
            stiffness: 40, 
            damping: 8,
            mass: 1.5
          }}
          style={{ transformOrigin: '140px 68px' }}
        >
          {/* Beam */}
          <rect x="30" y="65" width="220" height="6" rx="2" fill="url(#metalGradient)" />
          
          {/* Left chain */}
          <line x1="50" y1="71" x2="50" y2="95" stroke="#707070" strokeWidth="2" />
          
          {/* Right chain */}
          <line x1="230" y1="71" x2="230" y2="95" stroke="#707070" strokeWidth="2" />
          
          {/* Left pan */}
          <ellipse cx="50" cy="98" rx="35" ry="8" fill="#808080" />
          
          {/* Right pan */}
          <ellipse cx="230" cy="98" rx="35" ry="8" fill="#808080" />
          
          {/* Left weight (гиря) - classic weight shape */}
          <g>
            <path 
              d="M 35 75 L 35 93 Q 35 98 50 98 Q 65 98 65 93 L 65 75 Q 65 70 50 70 Q 35 70 35 75 Z"
              fill="url(#warmGradient)"
              stroke="#C0392B"
              strokeWidth="1"
            />
            {/* Weight fill indicator */}
            <clipPath id="leftWeightClip">
              <path d="M 36 75 L 36 93 Q 36 97 50 97 Q 64 97 64 93 L 64 75 Q 64 71 50 71 Q 36 71 36 75 Z" />
            </clipPath>
            <rect 
              x="36" 
              y={75 + (22 * (1 - personalValue / 100))} 
              width="28" 
              height={22 * (personalValue / 100)}
              fill="rgba(255,255,255,0.3)"
              clipPath="url(#leftWeightClip)"
            />
            {/* Percentage text */}
            <text 
              x="50" 
              y="86" 
              textAnchor="middle" 
              fontSize="11" 
              fontWeight="bold"
              fill="white"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
            >
              {Math.round(personalValue)}%
            </text>
          </g>
          
          {/* Right weight (гиря) */}
          <g>
            <path 
              d="M 215 75 L 215 93 Q 215 98 230 98 Q 245 98 245 93 L 245 75 Q 245 70 230 70 Q 215 70 215 75 Z"
              fill="url(#coldGradient)"
              stroke="#2980B9"
              strokeWidth="1"
            />
            {/* Weight fill indicator */}
            <clipPath id="rightWeightClip">
              <path d="M 216 75 L 216 93 Q 216 97 230 97 Q 244 97 244 93 L 244 75 Q 244 71 230 71 Q 216 71 216 75 Z" />
            </clipPath>
            <rect 
              x="216" 
              y={75 + (22 * (1 - socialValue / 100))} 
              width="28" 
              height={22 * (socialValue / 100)}
              fill="rgba(255,255,255,0.3)"
              clipPath="url(#rightWeightClip)"
            />
            {/* Percentage text */}
            <text 
              x="230" 
              y="86" 
              textAnchor="middle" 
              fontSize="11" 
              fontWeight="bold"
              fill="white"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
            >
              {Math.round(socialValue)}%
            </text>
          </g>
        </motion.g>
        
        {/* Labels below pans - fixed position */}
        <text x="50" y="120" textAnchor="middle" fontSize="10" className="fill-muted-foreground">
          {t.personal}
        </text>
        <text x="230" y="120" textAnchor="middle" fontSize="10" className="fill-muted-foreground">
          {t.social}
        </text>
      </svg>
    </div>
  );
}

// Spider/Radar Chart Component
function SpiderChart({ 
  sphereIndices, 
  lifeIndex, 
  allSpheres,
  language,
  onPetalClick,
  getSphereStats
}: {
  sphereIndices: SphereIndex[];
  lifeIndex: number;
  allSpheres: Sphere[];
  language: 'ru' | 'en' | 'es';
  onPetalClick: (sphere: Sphere) => void;
  getSphereStats: (sphereId: number) => { taskCount: number; lastActivity: string | null };
}) {
  const size = 500;
  const center = size / 2;
  const maxRadius = 180;
  const levels = 5;

  // Reorder spheres: Personal on left (top-left to bottom-left), Social on right (top-right to bottom-right)
  const personalSpheres = getPersonalSpheres();
  const socialSpheres = getSocialSpheres();
  
  // Order: Personal spheres in left quadrants (starting from top-left going down)
  // Social spheres in right quadrants (starting from top-right going down)
  const orderedSpheres = [
    personalSpheres[0], // Top-left quadrant
    personalSpheres[1], // Upper-left
    personalSpheres[2], // Lower-left
    personalSpheres[3], // Bottom-left quadrant
    socialSpheres[3],   // Bottom-right quadrant
    socialSpheres[2],   // Lower-right
    socialSpheres[1],   // Upper-right
    socialSpheres[0],   // Top-right quadrant
  ].filter(Boolean);

  // Calculate points for radar chart
  const points = useMemo(() => {
    return orderedSpheres.map((sphere, i) => {
      const sphereIndex = sphereIndices.find(s => s.sphereId === sphere.id);
      const indexValue = sphereIndex?.index || 0;
      const angle = (i * 360 / orderedSpheres.length) - 90; // Start from top
      const angleRad = (angle * Math.PI) / 180;
      const radius = (indexValue / 100) * maxRadius;
      
      return {
        sphere,
        x: center + radius * Math.cos(angleRad),
        y: center + radius * Math.sin(angleRad),
        labelX: center + (maxRadius + 50) * Math.cos(angleRad),
        labelY: center + (maxRadius + 50) * Math.sin(angleRad),
        index: indexValue,
        angle,
        hsl: hexToHsl(sphere.color),
      };
    });
  }, [sphereIndices, orderedSpheres]);

  // Create polygon path
  const polygonPath = points.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ') + ' Z';

  return (
    <TooltipProvider delayDuration={200}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto">
        <defs>
          <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
          </radialGradient>
          <filter id="radarGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feFlood floodColor="hsl(var(--primary))" floodOpacity="0.5" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid levels */}
        {[...Array(levels)].map((_, i) => {
          const r = ((i + 1) / levels) * maxRadius;
          return (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={r}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="1"
              strokeOpacity="0.3"
            />
          );
        })}

        {/* Axis lines */}
        {orderedSpheres.map((sphere, i) => {
          const angle = (i * 360 / orderedSpheres.length) - 90;
          const angleRad = (angle * Math.PI) / 180;
          return (
            <line
              key={sphere.id}
              x1={center}
              y1={center}
              x2={center + maxRadius * Math.cos(angleRad)}
              y2={center + maxRadius * Math.sin(angleRad)}
              stroke="hsl(var(--border))"
              strokeWidth="1"
              strokeOpacity="0.3"
            />
          );
        })}

        {/* Filled polygon */}
        <motion.path
          d={polygonPath}
          fill="url(#radarFill)"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          filter="url(#radarGlow)"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ transformOrigin: `${center}px ${center}px` }}
        />

        {/* Data points */}
        {points.map((point, i) => {
          const stats = getSphereStats(point.sphere.id);
          return (
            <Tooltip key={point.sphere.id}>
              <TooltipTrigger asChild>
                <motion.g
                  onClick={() => onPetalClick(point.sphere)}
                  className="cursor-pointer"
                  whileHover={{ scale: 1.2 }}
                >
                  <motion.circle
                    cx={point.x}
                    cy={point.y}
                    r={10}
                    fill={point.sphere.color}
                    stroke="white"
                    strokeWidth="2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.05 + 0.3 }}
                    style={{ transformOrigin: `${point.x}px ${point.y}px` }}
                  />
                </motion.g>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-popover border-border shadow-lg">
                <div className="p-2 space-y-1 text-sm">
                  <div className="font-semibold" style={{ color: point.sphere.color }}>
                    {getSphereName(point.sphere, language)}
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">
                      {language === 'ru' ? 'Индекс' : language === 'es' ? 'Índice' : 'Index'}:
                    </span>
                    <span className="font-medium">{Math.round(point.index)} / 100</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">
                      {language === 'ru' ? 'Задач' : language === 'es' ? 'Tareas' : 'Tasks'}:
                    </span>
                    <span className="font-medium">{stats.taskCount}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">
                      {language === 'ru' ? 'Активность' : language === 'es' ? 'Actividad' : 'Activity'}:
                    </span>
                    <span className="font-medium">{stats.lastActivity || '-'}</span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* Labels - font size 16px */}
        {points.map((point) => (
          <text
            key={`label-${point.sphere.id}`}
            x={point.labelX}
            y={point.labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="16"
            fontWeight="500"
            className="fill-foreground/80 pointer-events-none"
          >
            {getSphereName(point.sphere, language)}
          </text>
        ))}

        {/* Center value */}
        <circle
          cx={center}
          cy={center}
          r={40}
          fill="hsl(var(--card))"
          stroke="hsl(var(--border))"
          strokeWidth="2"
        />
        <text
          x={center}
          y={center - 3}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="28"
          fontWeight="bold"
          className="fill-foreground"
        >
          {Math.round(lifeIndex / 10)}
        </text>
        <text
          x={center}
          y={center + 16}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="10"
          className="fill-muted-foreground"
        >
          {language === 'ru' ? 'из 10' : language === 'es' ? 'de 10' : 'of 10'}
        </text>
      </svg>
    </TooltipProvider>
  );
}

export function BalanceFlower({ sphereIndices, lifeIndex }: BalanceFlowerProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { tasks } = useTasks();
  const { habits } = useHabits();
  const { isProActive } = useSubscription();
  const [viewMode, setViewMode] = useState<'flower' | 'spider'>('flower');
  const [hoveredPetal, setHoveredPetal] = useState<number | null>(null);
  const [colorScheme, setColorScheme] = useState<ColorScheme>('default');
  
  const personalSpheres = getPersonalSpheres();
  const socialSpheres = getSocialSpheres();
  
  // Reorder: Personal on left hemisphere (top-left to bottom-left), Social on right (top-right to bottom-right)
  // Angles: Personal spheres at 135°, 157.5°, 202.5°, 225° (left side)
  // Social spheres at 315°, 337.5°, 22.5°, 45° (right side)
  const orderedSpheres = [
    { sphere: personalSpheres[0], baseAngle: 135 },   // Body - upper left
    { sphere: personalSpheres[1], baseAngle: 157.5 }, // Mind - left
    { sphere: personalSpheres[2], baseAngle: 202.5 }, // Spirit - left
    { sphere: personalSpheres[3], baseAngle: 225 },   // Rest - lower left
    { sphere: socialSpheres[0], baseAngle: 315 },     // Work - lower right
    { sphere: socialSpheres[1], baseAngle: 337.5 },   // Money - right
    { sphere: socialSpheres[2], baseAngle: 22.5 },    // Family - right
    { sphere: socialSpheres[3], baseAngle: 45 },      // Social - upper right
  ].filter(item => item.sphere);

  // Calculate averages for balance scales
  const personalAvg = useMemo(() => {
    const personal = personalSpheres.map(s => sphereIndices.find(si => si.sphereId === s.id)?.index || 0);
    return personal.reduce((a, b) => a + b, 0) / personal.length;
  }, [sphereIndices, personalSpheres]);

  const socialAvg = useMemo(() => {
    const social = socialSpheres.map(s => sphereIndices.find(si => si.sphereId === s.id)?.index || 0);
    return social.reduce((a, b) => a + b, 0) / social.length;
  }, [sphereIndices, socialSpheres]);

  // SVG dimensions - full width for larger display
  const size = 500;
  const center = size / 2;
  const maxRadius = 190;
  const minRadius = 35;
  const centerRadius = 55;
  const labelRadius = maxRadius + 45; // For external labels

  const handlePetalClick = (sphere: Sphere) => {
    navigate(`/sphere/${sphere.key}`);
  };

  const handleColorSchemeChange = (scheme: ColorScheme) => {
    if (!isProActive && scheme !== 'default') {
      navigate('/upgrade');
      return;
    }
    setColorScheme(scheme);
  };

  // Get sphere stats (task count and last activity)
  const getSphereStats = (sphereId: number) => {
    // Filter by sphere_id from Supabase (stored in the data)
    const sphereTasks = tasks.filter(t => (t as any).sphere_id === sphereId && !t.archivedAt);
    const sphereHabits = habits.filter(h => (h as any).sphere_id === sphereId && !h.archivedAt);
    
    const taskCount = sphereTasks.length + sphereHabits.length;
    
    // Find last activity from completed dates
    let lastActivityDate: Date | null = null;
    
    sphereHabits.forEach(habit => {
      if (habit.completedDates.length > 0) {
        const lastCompleted = habit.completedDates.sort().reverse()[0];
        const date = new Date(lastCompleted);
        if (!lastActivityDate || date > lastActivityDate) {
          lastActivityDate = date;
        }
      }
    });
    
    let lastActivity: string | null = null;
    if (lastActivityDate) {
      const locale = language === 'ru' ? ru : language === 'es' ? es : enUS;
      lastActivity = format(lastActivityDate, 'dd MMM', { locale });
    }
    
    return { taskCount, lastActivity };
  };

  // Create rounded trapezoid petal path - parallel edges, very rounded outer corners
  const createPetalPath = (
    angle: number,
    radius: number
  ): string => {
    const angleRad = (angle * Math.PI) / 180;
    
    // Petal angular width (22.5 degrees for 8 petals with minimal gaps)
    const halfAngle = 10; // degrees - wider for less gaps
    const innerHalfAngle = 5; // narrower at base
    
    // Radii
    const innerR = centerRadius + 12;
    const outerR = radius;
    
    // Corner radius for rounding
    const cornerRadius = 18;
    
    // Calculate corner points
    const angle1 = angle - halfAngle;
    const angle2 = angle + halfAngle;
    const innerAngle1 = angle - innerHalfAngle;
    const innerAngle2 = angle + innerHalfAngle;
    
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    
    // Outer corners (need rounding)
    const outerLeft = {
      x: center + outerR * Math.cos(toRad(angle1)),
      y: center + outerR * Math.sin(toRad(angle1))
    };
    const outerRight = {
      x: center + outerR * Math.cos(toRad(angle2)),
      y: center + outerR * Math.sin(toRad(angle2))
    };
    
    // Inner corners (slight rounding)
    const innerLeft = {
      x: center + innerR * Math.cos(toRad(innerAngle1)),
      y: center + innerR * Math.sin(toRad(innerAngle1))
    };
    const innerRight = {
      x: center + innerR * Math.cos(toRad(innerAngle2)),
      y: center + innerR * Math.sin(toRad(innerAngle2))
    };
    
    // Outer arc control point (further out for rounded appearance)
    const outerMidR = outerR + cornerRadius;
    const outerMid = {
      x: center + outerMidR * Math.cos(angleRad),
      y: center + outerMidR * Math.sin(angleRad)
    };
    
    // Inner arc control (closer to center)
    const innerMidR = innerR - 5;
    const innerMid = {
      x: center + innerMidR * Math.cos(angleRad),
      y: center + innerMidR * Math.sin(angleRad)
    };
    
    return `
      M ${innerLeft.x} ${innerLeft.y}
      L ${outerLeft.x} ${outerLeft.y}
      Q ${outerMid.x} ${outerMid.y} ${outerRight.x} ${outerRight.y}
      L ${innerRight.x} ${innerRight.y}
      Q ${innerMid.x} ${innerMid.y} ${innerLeft.x} ${innerLeft.y}
      Z
    `;
  };

  const petals = useMemo(() => {
    const result: Array<{
      sphere: Sphere;
      path: string;
      maxPath: string;
      index: number;
      angle: number;
      radius: number;
      tipX: number;
      tipY: number;
      maxTipX: number;
      maxTipY: number;
      labelX: number;
      labelY: number;
      hsl: { h: number; s: number; l: number };
      needsPulse: boolean;
      colors: ReturnType<typeof colorSchemes['default']>;
    }> = [];

    orderedSpheres.forEach(({ sphere, baseAngle }) => {
      const sphereIndex = sphereIndices.find(s => s.sphereId === sphere.id);
      const indexValue = sphereIndex?.index || 0;
      const radius = minRadius + ((indexValue / 100) * (maxRadius - minRadius));
      const angle = baseAngle;
      const angleRad = (angle * Math.PI) / 180;
      const hsl = hexToHsl(sphere.color);
      const colors = colorSchemes[colorScheme](sphere.color, hsl);
      
      result.push({
        sphere,
        path: createPetalPath(angle, radius),
        maxPath: createPetalPath(angle, maxRadius),
        index: indexValue,
        angle,
        radius,
        tipX: center + (radius - 25) * Math.cos(angleRad),
        tipY: center + (radius - 25) * Math.sin(angleRad),
        maxTipX: center + (maxRadius - 20) * Math.cos(angleRad),
        maxTipY: center + (maxRadius - 20) * Math.sin(angleRad),
        labelX: center + labelRadius * Math.cos(angleRad),
        labelY: center + labelRadius * Math.sin(angleRad),
        hsl,
        needsPulse: indexValue < 30,
        colors,
      });
    });

    return result;
  }, [sphereIndices, orderedSpheres, colorScheme, labelRadius]);

  const getTooltipContent = (petal: typeof petals[0]) => {
    const stats = getSphereStats(petal.sphere.id);
    const labels = {
      ru: {
        index: 'Индекс',
        tasks: 'Задач',
        lastActivity: 'Активность',
        of: 'из 100',
      },
      en: {
        index: 'Index',
        tasks: 'Tasks',
        lastActivity: 'Activity',
        of: 'of 100',
      },
      es: {
        index: 'Índice',
        tasks: 'Tareas',
        lastActivity: 'Actividad',
        of: 'de 100',
      },
    };
    const t = labels[language] || labels.en;
    
    return (
      <div className="p-2 space-y-1 text-sm">
        <div className="font-semibold" style={{ color: petal.sphere.color }}>
          {getSphereName(petal.sphere, language)}
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">{t.index}:</span>
          <span className="font-medium">{Math.round(petal.index)} {t.of}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">{t.tasks}:</span>
          <span className="font-medium">{stats.taskCount}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">{t.lastActivity}:</span>
          <span className="font-medium">{stats.lastActivity || '-'}</span>
        </div>
      </div>
    );
  };

  const schemeLabels = {
    ru: { default: 'Обычная', pastel: 'Пастель', neon: 'Неон' },
    en: { default: 'Default', pastel: 'Pastel', neon: 'Neon' },
    es: { default: 'Normal', pastel: 'Pastel', neon: 'Neón' },
  };
  const sl = schemeLabels[language] || schemeLabels.en;

  const viewLabels = {
    ru: { flower: 'Цветок', radar: 'Радар' },
    en: { flower: 'Flower', radar: 'Radar' },
    es: { flower: 'Flor', radar: 'Radar' },
  };
  const vl = viewLabels[language] || viewLabels.en;

  return (
    <div className="relative w-full mx-auto">
      {/* View Toggle - simple text links */}
      <div className="flex justify-center gap-6 mb-3">
        <button
          onClick={() => setViewMode('flower')}
          className={`text-sm font-medium transition-all ${
            viewMode === 'flower' 
              ? 'text-foreground border-b-2 border-primary pb-0.5' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {vl.flower}
        </button>
        <button
          onClick={() => setViewMode('spider')}
          className={`text-sm font-medium transition-all ${
            viewMode === 'spider' 
              ? 'text-foreground border-b-2 border-primary pb-0.5' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {vl.radar}
        </button>
      </div>

      {/* Color Scheme Selector */}
      {viewMode === 'flower' && (
        <div className="flex justify-center gap-2 mb-3">
          {(['default', 'pastel', 'neon'] as ColorScheme[]).map((scheme) => (
            <button
              key={scheme}
              onClick={() => handleColorSchemeChange(scheme)}
              className={`text-xs px-3 py-1 rounded-full transition-all flex items-center gap-1 ${
                colorScheme === scheme 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {sl[scheme]}
              {!isProActive && scheme !== 'default' && (
                <Lock className="w-3 h-3" />
              )}
            </button>
          ))}
        </div>
      )}

      {viewMode === 'spider' ? (
        <SpiderChart 
          sphereIndices={sphereIndices}
          lifeIndex={lifeIndex}
          allSpheres={orderedSpheres.map(o => o.sphere)}
          language={language}
          onPetalClick={handlePetalClick}
          getSphereStats={getSphereStats}
        />
      ) : (
        <TooltipProvider delayDuration={200}>
          <div className="px-0">
            <svg 
              viewBox={`-70 -50 ${size + 140} ${size + 80}`} 
              className="w-full h-auto"
              style={{ overflow: 'visible' }}
            >
              {/* Filters and Gradients */}
              <defs>
                {/* Glow filters for each petal */}
                {petals.map((petal, i) => (
                  <filter 
                    key={`glow-${i}`}
                    id={`petalGlow-${i}`} 
                    x="-100%" 
                    y="-100%" 
                    width="300%" 
                    height="300%"
                  >
                    <feGaussianBlur stdDeviation={colorScheme === 'neon' ? 12 : 8} result="blur" />
                    <feFlood floodColor={petal.colors.fill} floodOpacity={colorScheme === 'neon' ? 0.9 : 0.7} result="color" />
                    <feComposite in="color" in2="blur" operator="in" result="glow" />
                    <feMerge>
                      <feMergeNode in="glow" />
                      <feMergeNode in="glow" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                ))}
                
                {/* Radial gradients for 3D volumetric effect */}
                {petals.map((petal, i) => (
                  <radialGradient 
                    key={`grad-${i}`}
                    id={`petalGradient-${i}`}
                    cx="0%"
                    cy="50%"
                    r="100%"
                    fx="0%"
                    fy="50%"
                  >
                    <stop 
                      offset="0%" 
                      stopColor={petal.colors.gradientStart}
                      stopOpacity="0.6" 
                    />
                    <stop 
                      offset="40%" 
                      stopColor={petal.colors.gradientMid} 
                      stopOpacity="0.75" 
                    />
                    <stop 
                      offset="80%" 
                      stopColor={petal.colors.gradientEnd}
                      stopOpacity="0.95" 
                    />
                    <stop 
                      offset="100%" 
                      stopColor={petal.colors.gradientEnd}
                      stopOpacity="1" 
                    />
                  </radialGradient>
                ))}
                
                {/* Center glow with pulse */}
                <filter id="centerGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="10" result="blur" />
                  <feFlood floodColor="hsl(var(--primary))" floodOpacity="0.5" result="color" />
                  <feComposite in="color" in2="blur" operator="in" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                
                {/* Glass effect for center */}
                <radialGradient id="centerGlass" cx="30%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="hsl(var(--card))" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="hsl(var(--background))" stopOpacity="0.85" />
                </radialGradient>
              </defs>

              {/* Background petals (max size, pale) */}
              {petals.map((petal, i) => (
                <path
                  key={`bg-${petal.sphere.id}`}
                  d={petal.maxPath}
                  fill={petal.colors.fill}
                  fillOpacity="0.08"
                  stroke={petal.colors.stroke}
                  strokeWidth="1"
                  strokeOpacity="0.15"
                  strokeDasharray="6 3"
                />
              ))}

              {/* Active Petals with rotation animation */}
              <motion.g
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{ transformOrigin: `${center}px ${center}px` }}
              >
                {petals.map((petal, i) => (
                  <Tooltip key={petal.sphere.id}>
                    <TooltipTrigger asChild>
                      <motion.g
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ 
                          scale: 1, 
                          opacity: 1,
                        }}
                        transition={{ delay: 0.3 + i * 0.08, duration: 0.5, type: 'spring' }}
                        onClick={() => handlePetalClick(petal.sphere)}
                        onMouseEnter={() => setHoveredPetal(i)}
                        onMouseLeave={() => setHoveredPetal(null)}
                        className="cursor-pointer"
                        style={{ transformOrigin: `${center}px ${center}px` }}
                        whileHover={{ scale: 1.08, filter: 'brightness(1.25)' }}
                        whileTap={{ scale: 0.98 }}
                      >
                      {/* Petal shape with glow and gradient */}
                      <motion.path
                        d={petal.path}
                        fill={`url(#petalGradient-${i})`}
                        stroke={petal.colors.stroke}
                        strokeWidth="2"
                        strokeOpacity="0.8"
                        filter={`url(#petalGlow-${i})`}
                        className="transition-all duration-300"
                        animate={petal.needsPulse ? {
                          opacity: [0.7, 1, 0.7],
                          scale: [1, 1.02, 1],
                        } : {}}
                        transition={petal.needsPulse ? {
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        } : {}}
                      />
                      
                      {/* Index value at tip */}
                      <text
                        x={petal.tipX}
                        y={petal.tipY - 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="16"
                        fontWeight="bold"
                        className="fill-foreground pointer-events-none drop-shadow-md"
                      >
                        {Math.round(petal.index / 10)}
                      </text>
                    </motion.g>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-popover border-border shadow-lg">
                    {getTooltipContent(petal)}
                  </TooltipContent>
                </Tooltip>
              ))}
              </motion.g>

              {/* External sphere labels around the flower - font size 16px */}
              {petals.map((petal) => (
                <text
                  key={`flower-label-${petal.sphere.id}`}
                  x={petal.labelX}
                  y={petal.labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="16"
                  fontWeight="500"
                  className="fill-foreground/70 pointer-events-none"
                >
                  {getSphereName(petal.sphere, language)}
                </text>
              ))}

              {/* Pulsating center ring */}
              <motion.circle
                cx={center}
                cy={center}
                r={centerRadius + 8}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                strokeOpacity="0.3"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ 
                  scale: [1, 1.15, 1], 
                  opacity: [0.3, 0.6, 0.3] 
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  delay: 1
                }}
              />

              {/* Center circle with Life Index */}
              <motion.circle
                cx={center}
                cy={center}
                r={centerRadius}
                fill="url(#centerGlass)"
                stroke="hsl(var(--border))"
                strokeWidth="2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
                filter="url(#centerGlow)"
              />
              
              {/* Life Index value */}
              <motion.text
                x={center}
                y={center - 5}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground font-bold"
                fontSize="32"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, type: 'spring' }}
              >
                {Math.round(lifeIndex / 10)}
              </motion.text>
              
              {/* "of 10" label */}
              <motion.text
                x={center}
                y={center + 18}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted-foreground"
                fontSize="11"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                {language === 'ru' ? 'из 10' : language === 'es' ? 'de 10' : 'of 10'}
              </motion.text>
            </svg>
          </div>
        </TooltipProvider>
      )}

      {/* Balance Scales Widget */}
      <BalanceScalesWidget 
        personalValue={personalAvg} 
        socialValue={socialAvg} 
        language={language} 
      />

      {/* Life Index Progress Chart */}
      <LifeIndexProgressChart 
        lifeIndex={lifeIndex}
        language={language}
      />
    </div>
  );
}
