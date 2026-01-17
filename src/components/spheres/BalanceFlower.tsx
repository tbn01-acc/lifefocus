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
import { format } from 'date-fns';
import { ru, es, enUS } from 'date-fns/locale';
import { Lock } from 'lucide-react';

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

// Balance Scales Widget Component
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
        
        {/* Indicator needle */}
        <motion.g
          animate={{ rotate: tiltAngle }}
          transition={{ type: 'spring', stiffness: 60, damping: 15 }}
          style={{ transformOrigin: '140px 68px' }}
        >
          <line x1="140" y1="68" x2="140" y2="45" stroke="#303030" strokeWidth="2" />
          <circle cx="140" cy="43" r="3" fill="#404040" />
        </motion.g>
        
        {/* Balance beam (коромысло) */}
        <motion.g
          animate={{ rotate: tiltAngle }}
          transition={{ type: 'spring', stiffness: 60, damping: 15 }}
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
  const size = 420;
  const center = size / 2;
  const maxRadius = 170;
  const levels = 5;

  // Calculate points for radar chart
  const points = useMemo(() => {
    return allSpheres.map((sphere, i) => {
      const sphereIndex = sphereIndices.find(s => s.sphereId === sphere.id);
      const indexValue = sphereIndex?.index || 0;
      const angle = (i * 360 / allSpheres.length) - 90; // Start from top
      const angleRad = (angle * Math.PI) / 180;
      const radius = (indexValue / 100) * maxRadius;
      
      return {
        sphere,
        x: center + radius * Math.cos(angleRad),
        y: center + radius * Math.sin(angleRad),
        labelX: center + (maxRadius + 35) * Math.cos(angleRad),
        labelY: center + (maxRadius + 35) * Math.sin(angleRad),
        index: indexValue,
        angle,
        hsl: hexToHsl(sphere.color),
      };
    });
  }, [sphereIndices, allSpheres]);

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
        {allSpheres.map((sphere, i) => {
          const angle = (i * 360 / allSpheres.length) - 90;
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
                    r={8}
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

        {/* Labels */}
        {points.map((point) => (
          <text
            key={`label-${point.sphere.id}`}
            x={point.labelX}
            y={point.labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            className="fill-foreground/70 pointer-events-none"
          >
            {getSphereName(point.sphere, language).slice(0, 6)}
          </text>
        ))}

        {/* Center value */}
        <circle
          cx={center}
          cy={center}
          r={35}
          fill="hsl(var(--card))"
          stroke="hsl(var(--border))"
          strokeWidth="2"
        />
        <text
          x={center}
          y={center - 3}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="24"
          fontWeight="bold"
          className="fill-foreground"
        >
          {Math.round(lifeIndex / 10)}
        </text>
        <text
          x={center}
          y={center + 14}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="9"
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
  const allSpheres = [...personalSpheres, ...socialSpheres];

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
  const size = 420;
  const center = size / 2;
  const maxRadius = 175;
  const minRadius = 30;
  const centerRadius = 50;

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

  // Create rounded triangle petal path - with more rounded corners and smaller gaps
  const createPetalPath = (
    angle: number,
    radius: number
  ): string => {
    const angleRad = (angle * Math.PI) / 180;
    
    // Base starts near center - narrow at center
    const baseR = centerRadius + 8;
    const baseWidth = 14; // Wider base for smaller gaps
    
    // Tip is wide and rounded
    const tipWidth = 38 + (radius / maxRadius) * 20; // Wider tips
    
    // Perpendicular angle for width calculations
    const perpAngleRad = ((angle + 90) * Math.PI) / 180;
    const perpAngleRadNeg = ((angle - 90) * Math.PI) / 180;
    
    // Base points (wider, near center)
    const base1X = center + baseR * Math.cos(angleRad) + baseWidth * Math.cos(perpAngleRad);
    const base1Y = center + baseR * Math.sin(angleRad) + baseWidth * Math.sin(perpAngleRad);
    const base2X = center + baseR * Math.cos(angleRad) + baseWidth * Math.cos(perpAngleRadNeg);
    const base2Y = center + baseR * Math.sin(angleRad) + baseWidth * Math.sin(perpAngleRadNeg);
    
    // Tip points (wide, at outer edge)
    const tipCenterX = center + radius * Math.cos(angleRad);
    const tipCenterY = center + radius * Math.sin(angleRad);
    const tip1X = tipCenterX + tipWidth * Math.cos(perpAngleRad);
    const tip1Y = tipCenterY + tipWidth * Math.sin(perpAngleRad);
    const tip2X = tipCenterX + tipWidth * Math.cos(perpAngleRadNeg);
    const tip2Y = tipCenterY + tipWidth * Math.sin(perpAngleRadNeg);
    
    // Control points for smooth curved sides (more curvature for rounding)
    const ctrl1Radius = baseR + (radius - baseR) * 0.4;
    const ctrl1Width = baseWidth + (tipWidth - baseWidth) * 0.3;
    const ctrl1X = center + ctrl1Radius * Math.cos(angleRad) + ctrl1Width * Math.cos(perpAngleRad);
    const ctrl1Y = center + ctrl1Radius * Math.sin(angleRad) + ctrl1Width * Math.sin(perpAngleRad);
    const ctrl2X = center + ctrl1Radius * Math.cos(angleRad) + ctrl1Width * Math.cos(perpAngleRadNeg);
    const ctrl2Y = center + ctrl1Radius * Math.sin(angleRad) + ctrl1Width * Math.sin(perpAngleRadNeg);
    
    // Second control points closer to tip
    const ctrl3Radius = baseR + (radius - baseR) * 0.7;
    const ctrl3Width = baseWidth + (tipWidth - baseWidth) * 0.7;
    const ctrl3X = center + ctrl3Radius * Math.cos(angleRad) + ctrl3Width * Math.cos(perpAngleRad);
    const ctrl3Y = center + ctrl3Radius * Math.sin(angleRad) + ctrl3Width * Math.sin(perpAngleRad);
    const ctrl4X = center + ctrl3Radius * Math.cos(angleRad) + ctrl3Width * Math.cos(perpAngleRadNeg);
    const ctrl4Y = center + ctrl3Radius * Math.sin(angleRad) + ctrl3Width * Math.sin(perpAngleRadNeg);
    
    // Rounded tip arc control point (more pronounced rounding)
    const tipOuterR = radius + 18;
    const tipOuterX = center + tipOuterR * Math.cos(angleRad);
    const tipOuterY = center + tipOuterR * Math.sin(angleRad);
    
    // Base center for rounded base
    const baseCenterX = center + baseR * Math.cos(angleRad);
    const baseCenterY = center + baseR * Math.sin(angleRad);
    
    return `
      M ${base1X} ${base1Y}
      C ${ctrl1X} ${ctrl1Y} ${ctrl3X} ${ctrl3Y} ${tip1X} ${tip1Y}
      Q ${tipOuterX} ${tipOuterY} ${tip2X} ${tip2Y}
      C ${ctrl4X} ${ctrl4Y} ${ctrl2X} ${ctrl2Y} ${base2X} ${base2Y}
      Q ${baseCenterX} ${baseCenterY} ${base1X} ${base1Y}
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
      hsl: { h: number; s: number; l: number };
      needsPulse: boolean;
      colors: ReturnType<typeof colorSchemes['default']>;
    }> = [];

    // Distribute 8 petals evenly around the circle (45 degrees apart)
    const angleStep = 360 / allSpheres.length; // 45 degrees for 8 spheres
    
    allSpheres.forEach((sphere, i) => {
      const sphereIndex = sphereIndices.find(s => s.sphereId === sphere.id);
      const indexValue = sphereIndex?.index || 0;
      const radius = minRadius + ((indexValue / 100) * (maxRadius - minRadius));
      // Start from top (-90) and go clockwise
      const angle = -90 + (i * angleStep);
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
        tipX: center + (radius - 18) * Math.cos(angleRad),
        tipY: center + (radius - 18) * Math.sin(angleRad),
        maxTipX: center + (maxRadius - 18) * Math.cos(angleRad),
        maxTipY: center + (maxRadius - 18) * Math.sin(angleRad),
        hsl,
        needsPulse: indexValue < 30,
        colors,
      });
    });

    return result;
  }, [sphereIndices, allSpheres, colorScheme]);

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
          allSpheres={allSpheres}
          language={language}
          onPetalClick={handlePetalClick}
          getSphereStats={getSphereStats}
        />
      ) : (
        <TooltipProvider delayDuration={200}>
          <div className="px-2">
            <svg 
              viewBox={`0 0 ${size} ${size}`} 
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
                      
                      {/* Sphere name below index */}
                      <text
                        x={petal.tipX}
                        y={petal.tipY + 14}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="9"
                        className="fill-foreground/80 pointer-events-none"
                      >
                        {getSphereName(petal.sphere, language).slice(0, 8)}
                      </text>
                    </motion.g>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-popover border-border shadow-lg">
                    {getTooltipContent(petal)}
                  </TooltipContent>
                </Tooltip>
              ))}
              </motion.g>

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
    </div>
  );
}
