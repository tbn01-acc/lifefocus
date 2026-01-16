import React, { useMemo } from 'react';
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

export function BalanceFlower({ sphereIndices, lifeIndex }: BalanceFlowerProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  const personalSpheres = getPersonalSpheres();
  const socialSpheres = getSocialSpheres();

  // SVG dimensions - larger for better spacing
  const size = 360;
  const center = size / 2;
  const maxRadius = 140;
  const minRadius = 25;
  const centerRadius = 45;

  const handlePetalClick = (sphere: Sphere) => {
    navigate(`/sphere/${sphere.key}`);
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
    const baseR = centerRadius + 8;
    const baseX = center + baseR * Math.cos(angleRad);
    const baseY = center + baseR * Math.sin(angleRad);
    
    // Width of the petal at its widest point
    const petalWidth = 22 + (radius / maxRadius) * 12;
    const widthAngle = 90; // Perpendicular to the petal direction
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
    
    // Create smooth teardrop shape using bezier curves
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
      index: number;
      angle: number;
      radius: number;
      tipX: number;
      tipY: number;
      hsl: { h: number; s: number; l: number };
    }> = [];

    // Left hemisphere (Personal) - warm tones: Body, Mind, Spirit, Rest
    // Angles: 135°, 165°, 195°, 225° (from top-left going down-left)
    const leftAngles = [135, 165, 195, 225];
    
    // Right hemisphere (Social) - cool tones: Work, Money, Family, Connections
    // Angles: 45°, 15°, -15°, -45° (315°) (from top-right going down-right)
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
        index: indexValue,
        angle,
        radius,
        tipX: center + (radius - 15) * Math.cos(angleRad),
        tipY: center + (radius - 15) * Math.sin(angleRad),
        hsl,
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
        index: indexValue,
        angle,
        radius,
        tipX: center + (radius - 15) * Math.cos(angleRad),
        tipY: center + (radius - 15) * Math.sin(angleRad),
        hsl,
      });
    });

    return result;
  }, [sphereIndices, personalSpheres, socialSpheres]);

  return (
    <div className="relative w-full mx-auto">
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
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feFlood floodColor={petal.sphere.color} floodOpacity="0.6" result="color" />
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
                stopOpacity="0.3" 
              />
              <stop 
                offset="60%" 
                stopColor={petal.sphere.color} 
                stopOpacity="0.6" 
              />
              <stop 
                offset="100%" 
                stopColor={`hsl(${petal.hsl.h}, ${Math.min(petal.hsl.s + 20, 100)}%, ${Math.min(petal.hsl.l + 10, 70)}%)`}
                stopOpacity="0.9" 
              />
            </linearGradient>
          ))}
          
          {/* Center glow */}
          <filter id="centerGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feFlood floodColor="hsl(var(--primary))" floodOpacity="0.4" result="color" />
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

        {/* Petals */}
        {petals.map((petal, i) => (
          <motion.g
            key={petal.sphere.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.08, duration: 0.5, type: 'spring' }}
            onClick={() => handlePetalClick(petal.sphere)}
            className="cursor-pointer"
            style={{ transformOrigin: `${center}px ${center}px` }}
            whileHover={{ scale: 1.08, filter: 'brightness(1.2)' }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Petal shape with glow and gradient */}
            <path
              d={petal.path}
              fill={`url(#petalGradient-${i})`}
              stroke={petal.sphere.color}
              strokeWidth="1.5"
              strokeOpacity="0.7"
              filter={`url(#petalGlow-${i})`}
              className="transition-all duration-300"
            />
            
            {/* Index value at tip */}
            <text
              x={petal.tipX}
              y={petal.tipY - 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="14"
              fontWeight="bold"
              className="fill-foreground pointer-events-none drop-shadow-sm"
            >
              {Math.round(petal.index / 10)}
            </text>
            
            {/* Sphere name below index */}
            <text
              x={petal.tipX}
              y={petal.tipY + 12}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="8"
              className="fill-foreground/80 pointer-events-none"
            >
              {getSphereName(petal.sphere, language).slice(0, 8)}
            </text>
          </motion.g>
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
          y={center - 4}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-foreground font-bold"
          fontSize="28"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, type: 'spring' }}
        >
          {Math.round(lifeIndex / 10)}
        </motion.text>
        
        {/* "of 10" label */}
        <motion.text
          x={center}
          y={center + 16}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-muted-foreground"
          fontSize="10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          {language === 'ru' ? 'из 10' : language === 'es' ? 'de 10' : 'of 10'}
        </motion.text>
      </svg>
    </div>
  );
}
