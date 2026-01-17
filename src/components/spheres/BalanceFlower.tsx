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
import { format } from 'date-fns';
import { ru, es, enUS } from 'date-fns/locale';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Flower2, Radar } from 'lucide-react';

interface BalanceFlowerProps {
  sphereIndices: SphereIndex[];
  lifeIndex: number;
}

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
  const [viewMode, setViewMode] = useState<'flower' | 'spider'>('flower');
  const [hoveredPetal, setHoveredPetal] = useState<number | null>(null);
  
  const personalSpheres = getPersonalSpheres();
  const socialSpheres = getSocialSpheres();
  const allSpheres = [...personalSpheres, ...socialSpheres];

  // SVG dimensions - full width for larger display
  const size = 420;
  const center = size / 2;
  const maxRadius = 175;
  const minRadius = 30;
  const centerRadius = 50;

  const handlePetalClick = (sphere: Sphere) => {
    navigate(`/sphere/${sphere.key}`);
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

  // Create teardrop/petal path - rounded drop shape
  const createPetalPath = (
    angle: number,
    radius: number
  ): string => {
    const angleRad = (angle * Math.PI) / 180;
    
    // Calculate tip position
    const tipX = center + radius * Math.cos(angleRad);
    const tipY = center + radius * Math.sin(angleRad);
    
    // Base radius - where petal starts from center
    const baseR = centerRadius + 10;
    const baseX = center + baseR * Math.cos(angleRad);
    const baseY = center + baseR * Math.sin(angleRad);
    
    // Width of the petal at its widest point
    const petalWidth = 26 + (radius / maxRadius) * 16;
    const widthAngle = 90;
    const perpAngleRad = ((angle + widthAngle) * Math.PI) / 180;
    const perpAngleRadNeg = ((angle - widthAngle) * Math.PI) / 180;
    
    // Midpoint of the petal (widest part)
    const midRadius = baseR + (radius - baseR) * 0.4;
    const midX = center + midRadius * Math.cos(angleRad);
    const midY = center + midRadius * Math.sin(angleRad);
    
    // Side points at the widest part
    const side1X = midX + petalWidth * Math.cos(perpAngleRad);
    const side1Y = midY + petalWidth * Math.sin(perpAngleRad);
    const side2X = midX + petalWidth * Math.cos(perpAngleRadNeg);
    const side2Y = midY + petalWidth * Math.sin(perpAngleRadNeg);
    
    return `
      M ${baseX} ${baseY}
      Q ${side1X} ${side1Y} ${tipX} ${tipY}
      Q ${side2X} ${side2Y} ${baseX} ${baseY}
      Z
    `;
  };

  const petals = useMemo(() => {
    const result: Array<{
      sphere: Sphere;
      path: string;
      maxPath: string; // Path at 100% for background
      index: number;
      angle: number;
      radius: number;
      tipX: number;
      tipY: number;
      maxTipX: number;
      maxTipY: number;
      hsl: { h: number; s: number; l: number };
      needsPulse: boolean;
    }> = [];

    // Left hemisphere (Personal) - warm tones
    const leftAngles = [135, 165, 195, 225];
    
    // Right hemisphere (Social) - cool tones
    const rightAngles = [45, 15, -15, -45];

    personalSpheres.forEach((sphere, i) => {
      const sphereIndex = sphereIndices.find(s => s.sphereId === sphere.id);
      const indexValue = sphereIndex?.index || 0;
      const radius = minRadius + ((indexValue / 100) * (maxRadius - minRadius));
      const angle = leftAngles[i];
      const angleRad = (angle * Math.PI) / 180;
      const hsl = hexToHsl(sphere.color);
      
      result.push({
        sphere,
        path: createPetalPath(angle, radius),
        maxPath: createPetalPath(angle, maxRadius), // 100% size path
        index: indexValue,
        angle,
        radius,
        tipX: center + (radius - 18) * Math.cos(angleRad),
        tipY: center + (radius - 18) * Math.sin(angleRad),
        maxTipX: center + (maxRadius - 18) * Math.cos(angleRad),
        maxTipY: center + (maxRadius - 18) * Math.sin(angleRad),
        hsl,
        needsPulse: indexValue < 30,
      });
    });

    socialSpheres.forEach((sphere, i) => {
      const sphereIndex = sphereIndices.find(s => s.sphereId === sphere.id);
      const indexValue = sphereIndex?.index || 0;
      const radius = minRadius + ((indexValue / 100) * (maxRadius - minRadius));
      const angle = rightAngles[i];
      const angleRad = (angle * Math.PI) / 180;
      const hsl = hexToHsl(sphere.color);
      
      result.push({
        sphere,
        path: createPetalPath(angle, radius),
        maxPath: createPetalPath(angle, maxRadius), // 100% size path
        index: indexValue,
        angle,
        radius,
        tipX: center + (radius - 18) * Math.cos(angleRad),
        tipY: center + (radius - 18) * Math.sin(angleRad),
        maxTipX: center + (maxRadius - 18) * Math.cos(angleRad),
        maxTipY: center + (maxRadius - 18) * Math.sin(angleRad),
        hsl,
        needsPulse: indexValue < 30,
      });
    });

    return result;
  }, [sphereIndices, personalSpheres, socialSpheres]);

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

  return (
    <div className="relative w-full mx-auto">
      {/* View Toggle */}
      <div className="flex justify-center mb-2">
        <ToggleGroup 
          type="single" 
          value={viewMode} 
          onValueChange={(v) => v && setViewMode(v as 'flower' | 'spider')}
          className="bg-muted/50 rounded-lg p-1"
        >
          <ToggleGroupItem value="flower" aria-label="Flower view" className="px-3 py-1.5 text-xs">
            <Flower2 className="w-4 h-4 mr-1" />
            {language === 'ru' ? 'Цветок' : language === 'es' ? 'Flor' : 'Flower'}
          </ToggleGroupItem>
          <ToggleGroupItem value="spider" aria-label="Spider view" className="px-3 py-1.5 text-xs">
            <Radar className="w-4 h-4 mr-1" />
            {language === 'ru' ? 'Радар' : 'Radar'}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

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
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feFlood floodColor={petal.sphere.color} floodOpacity="0.7" result="color" />
                    <feComposite in="color" in2="blur" operator="in" result="glow" />
                    <feMerge>
                      <feMergeNode in="glow" />
                      <feMergeNode in="glow" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                ))}
                
                {/* Gradients for glassmorphism effect */}
                {petals.map((petal, i) => (
                  <linearGradient 
                    key={`grad-${i}`}
                    id={`petalGradient-${i}`}
                    gradientUnits="userSpaceOnUse"
                    x1={center}
                    y1={center}
                    x2={petal.tipX}
                    y2={petal.tipY}
                  >
                    <stop 
                      offset="0%" 
                      stopColor={petal.sphere.color} 
                      stopOpacity="0.25" 
                    />
                    <stop 
                      offset="50%" 
                      stopColor={petal.sphere.color} 
                      stopOpacity="0.5" 
                    />
                    <stop 
                      offset="100%" 
                      stopColor={`hsl(${petal.hsl.h}, ${Math.min(petal.hsl.s + 25, 100)}%, ${Math.min(petal.hsl.l + 15, 75)}%)`}
                      stopOpacity="0.95" 
                    />
                  </linearGradient>
                ))}
                
                {/* Center glow */}
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
                  fill={petal.sphere.color}
                  fillOpacity="0.1"
                  stroke={petal.sphere.color}
                  strokeWidth="1"
                  strokeOpacity="0.2"
                  strokeDasharray="4 2"
                />
              ))}

              {/* Active Petals */}
              {petals.map((petal, i) => (
                <Tooltip key={petal.sphere.id}>
                  <TooltipTrigger asChild>
                    <motion.g
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: 1, 
                        opacity: 1,
                      }}
                      transition={{ delay: i * 0.08, duration: 0.5, type: 'spring' }}
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
                        stroke={petal.sphere.color}
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
    </div>
  );
}