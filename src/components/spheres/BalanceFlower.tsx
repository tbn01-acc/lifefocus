import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getPersonalSpheres, 
  getSocialSpheres,
  getSphereName,
  SphereIndex,
  Sphere,
} from '@/types/sphere';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';

interface BalanceFlowerProps {
  sphereIndices: SphereIndex[];
  lifeIndex: number;
}

export function BalanceFlower({ sphereIndices, lifeIndex }: BalanceFlowerProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  const personalSpheres = getPersonalSpheres();
  const socialSpheres = getSocialSpheres();

  // SVG dimensions
  const size = 320;
  const center = size / 2;
  const maxRadius = 110;
  const minRadius = 40;

  const handlePetalClick = (sphere: Sphere) => {
    navigate(`/sphere/${sphere.key}`);
  };

  // Create petal-like path radiating from center
  const createPetalPath = (
    angleStart: number, 
    angleEnd: number,
    radius: number
  ): string => {
    const startRad = (angleStart * Math.PI) / 180;
    const endRad = (angleEnd * Math.PI) / 180;
    const midRad = ((angleStart + angleEnd) / 2 * Math.PI) / 180;
    
    // Tip of the petal
    const tipX = center + radius * Math.cos(midRad);
    const tipY = center + radius * Math.sin(midRad);
    
    // Base points near center
    const baseRadius = 50;
    const baseX1 = center + baseRadius * Math.cos(startRad);
    const baseY1 = center + baseRadius * Math.sin(startRad);
    const baseX2 = center + baseRadius * Math.cos(endRad);
    const baseY2 = center + baseRadius * Math.sin(endRad);
    
    // Control points for smooth curves
    const controlRadius = radius * 0.7;
    const cp1X = center + controlRadius * Math.cos(startRad + 0.15);
    const cp1Y = center + controlRadius * Math.sin(startRad + 0.15);
    const cp2X = center + controlRadius * Math.cos(endRad - 0.15);
    const cp2Y = center + controlRadius * Math.sin(endRad - 0.15);
    
    return `
      M ${baseX1} ${baseY1}
      Q ${cp1X} ${cp1Y} ${tipX} ${tipY}
      Q ${cp2X} ${cp2Y} ${baseX2} ${baseY2}
      Q ${center} ${center} ${baseX1} ${baseY1}
      Z
    `;
  };

  const petals = useMemo(() => {
    const result: Array<{
      sphere: Sphere;
      path: string;
      index: number;
      labelX: number;
      labelY: number;
    }> = [];

    // 8 petals: 4 personal on left, 4 social on right
    // Angles: start from top and go clockwise
    // Personal (left side): 135°, 180°, 225°, 270° -> adjusted for visual balance
    // Social (right side): 45°, 0°, 315°, 270°
    
    // Left side petals (Personal) - from top-left going down
    const leftAngles = [
      { start: 112, end: 158 },  // Body
      { start: 158, end: 202 },  // Mind  
      { start: 202, end: 248 },  // Spirit
      { start: 248, end: 292 },  // Rest
    ];
    
    // Right side petals (Social) - from top-right going down
    const rightAngles = [
      { start: 68, end: 22 },    // Work
      { start: 22, end: -22 },   // Money
      { start: -22, end: -68 },  // Family
      { start: -68, end: -112 }, // Social
    ];

    personalSpheres.forEach((sphere, i) => {
      const sphereIndex = sphereIndices.find(s => s.sphereId === sphere.id);
      const indexValue = sphereIndex?.index || 0;
      const radius = minRadius + ((indexValue / 100) * (maxRadius - minRadius));
      const angles = leftAngles[i];
      const midAngle = (angles.start + angles.end) / 2;
      const midRad = (midAngle * Math.PI) / 180;
      const labelRadius = radius + 25;
      
      result.push({
        sphere,
        path: createPetalPath(angles.start, angles.end, radius),
        index: indexValue,
        labelX: center + labelRadius * Math.cos(midRad),
        labelY: center + labelRadius * Math.sin(midRad),
      });
    });

    socialSpheres.forEach((sphere, i) => {
      const sphereIndex = sphereIndices.find(s => s.sphereId === sphere.id);
      const indexValue = sphereIndex?.index || 0;
      const radius = minRadius + ((indexValue / 100) * (maxRadius - minRadius));
      const angles = rightAngles[i];
      // Handle negative angles for proper mid calculation
      const midAngle = (angles.start + angles.end) / 2;
      const midRad = (midAngle * Math.PI) / 180;
      const labelRadius = radius + 25;
      
      result.push({
        sphere,
        path: createPetalPath(angles.end, angles.start, radius),
        index: indexValue,
        labelX: center + labelRadius * Math.cos(midRad),
        labelY: center + labelRadius * Math.sin(midRad),
      });
    });

    return result;
  }, [sphereIndices, personalSpheres, socialSpheres]);

  return (
    <div className="relative w-full max-w-[320px] mx-auto">
      <svg 
        viewBox={`0 0 ${size} ${size}`} 
        className="w-full h-auto"
      >
        {/* Petals */}
        {petals.map((petal, i) => (
          <motion.g
            key={petal.sphere.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            onClick={() => handlePetalClick(petal.sphere)}
            className="cursor-pointer"
            style={{ transformOrigin: `${center}px ${center}px` }}
          >
            <path
              d={petal.path}
              fill={petal.sphere.color}
              fillOpacity={0.75 + (petal.index / 100) * 0.25}
              className="transition-all duration-300 hover:brightness-110"
              filter="url(#petalShadow)"
            />
            {/* Index value on petal */}
            <text
              x={petal.labelX}
              y={petal.labelY - 8}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="18"
              fontWeight="bold"
              className="fill-foreground pointer-events-none"
            >
              {Math.round(petal.index / 10)}
            </text>
            {/* Sphere name */}
            <text
              x={petal.labelX}
              y={petal.labelY + 10}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="9"
              className="fill-foreground/70 pointer-events-none"
            >
              {getSphereName(petal.sphere, language).slice(0, 10)}
            </text>
          </motion.g>
        ))}

        {/* Center circle with Life Index */}
        <motion.circle
          cx={center}
          cy={center}
          r={48}
          fill="hsl(var(--background))"
          stroke="hsl(var(--border))"
          strokeWidth="2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          filter="url(#centerShadow)"
        />
        
        {/* Gradient overlay for center */}
        <defs>
          <radialGradient id="centerGradient" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="hsl(280, 70%, 80%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(280, 70%, 50%)" stopOpacity="0.1" />
          </radialGradient>
          <filter id="petalShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2"/>
          </filter>
          <filter id="centerShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.15"/>
          </filter>
        </defs>
        
        <circle
          cx={center}
          cy={center}
          r={46}
          fill="url(#centerGradient)"
          className="pointer-events-none"
        />
        
        <motion.text
          x={center}
          y={center - 6}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-foreground font-bold"
          fontSize="32"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          {Math.round(lifeIndex / 10)}
        </motion.text>
        
        <motion.text
          x={center}
          y={center + 18}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-muted-foreground"
          fontSize="10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {language === 'ru' ? 'из 10' : language === 'es' ? 'de 10' : 'of 10'}
        </motion.text>
      </svg>
    </div>
  );
}