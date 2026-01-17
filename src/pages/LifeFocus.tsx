import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BalanceFlower } from '@/components/spheres/BalanceFlower';

import { MindfulnessMetric } from '@/components/spheres/MindfulnessMetric';
import { useSpheres } from '@/hooks/useSpheres';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { LifeIndexData, SPHERES, getSphereName, Sphere } from '@/types/sphere';
import { Skeleton } from '@/components/ui/skeleton';
import { AppHeader } from '@/components/AppHeader';
import { format } from 'date-fns';

// Sphere Card Component
interface SphereCardProps {
  sphere: Sphere;
  indexValue: number;
  delay: number;
  language: 'ru' | 'en' | 'es';
  onClick: () => void;
}

function SphereCard({ sphere, indexValue, delay, language, onClick }: SphereCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card 
        className="p-3 cursor-pointer hover:shadow-md transition-shadow"
        onClick={onClick}
      >
        <div className="flex items-center gap-2 mb-2">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
            style={{ backgroundColor: `${sphere.color}20` }}
          >
            {sphere.icon}
          </div>
          <p className="font-medium text-sm truncate flex-1">
            {getSphereName(sphere, language)}
          </p>
          <span className="text-sm font-bold">
            {Math.round(indexValue / 10)}/10
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
            <motion.div 
              className="h-full rounded-full"
              style={{ backgroundColor: sphere.color }}
              initial={{ width: 0 }}
              animate={{ width: `${indexValue}%` }}
              transition={{ duration: 0.5, delay: delay + 0.1 }}
            />
          </div>
          {/* Dot indicators */}
          <div className="flex gap-0.5 ml-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: i < Math.ceil(indexValue / 20) 
                    ? sphere.color 
                    : 'hsl(var(--muted))',
                }}
              />
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function LifeFocus() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { fetchLifeIndexData, loading, spheres } = useSpheres();
  const [data, setData] = useState<LifeIndexData | null>(null);

  const labels = {
    title: {
      ru: 'Фокус жизни',
      en: 'Life Focus',
      es: 'Enfoque de vida',
    },
    subtitle: {
      ru: 'Баланс 8 сфер жизни',
      en: 'Balance of 8 life spheres',
      es: 'Equilibrio de 8 esferas de vida',
    },
    refresh: {
      ru: 'Обновить',
      en: 'Refresh',
      es: 'Actualizar',
    },
    sphereDetails: {
      ru: 'Детали сфер',
      en: 'Sphere Details',
      es: 'Detalles de esferas',
    },
    noData: {
      ru: 'Начните добавлять цели, задачи и привычки',
      en: 'Start adding goals, tasks and habits',
      es: 'Comienza a añadir metas, tareas y hábitos',
    },
  };

  // Save life index to history
  const saveLifeIndexHistory = useCallback(async (lifeData: LifeIndexData) => {
    if (!user || lifeData.lifeIndex === 0) return;

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Build sphere indices object
      const sphereIndicesObj: Record<string, number> = {};
      lifeData.sphereIndices.forEach(si => {
        sphereIndicesObj[si.sphereKey] = si.index;
      });

      // Upsert to handle one record per day
      const { error } = await supabase
        .from('life_index_history')
        .upsert({
          user_id: user.id,
          life_index: lifeData.lifeIndex,
          personal_energy: lifeData.personalEnergy,
          external_success: lifeData.externalSuccess,
          mindfulness_level: lifeData.mindfulnessLevel,
          sphere_indices: sphereIndicesObj,
          recorded_at: today,
        }, {
          onConflict: 'user_id,recorded_at',
        });

      if (error) {
        console.error('Error saving life index history:', error);
      }
    } catch (err) {
      console.error('Error saving life index history:', err);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const result = await fetchLifeIndexData();
    setData(result);
    
    // Save to history when data is loaded
    if (result) {
      saveLifeIndexHistory(result);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader />
        <div className="container max-w-md mx-auto px-4 py-6 space-y-6">
          <h1 className="text-2xl font-bold">{labels.title[language]}</h1>
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />

      <div className="container max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Header with title and refresh */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{labels.title[language]}</h1>
              <p className="text-sm text-muted-foreground">{labels.subtitle[language]}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        {/* Balance Flower - Full Width */}
        <Card className="p-4">
          <p className="text-sm text-muted-foreground text-center mb-2">
            {labels.subtitle[language]}
          </p>
          
          <BalanceFlower 
            sphereIndices={data?.sphereIndices || []}
            lifeIndex={data?.lifeIndex || 0}
          />
        </Card>

        {/* Mindfulness Metric */}
        <MindfulnessMetric value={data?.mindfulnessLevel || 0} />

        {/* Sphere List - Two columns: Personal | Social */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">
            {labels.sphereDetails[language]}
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Left Column - Personal Spheres */}
            <div className="space-y-3">
              {SPHERES.filter(s => s.group_type === 'personal').map((sphere, index) => {
                const sphereIndex = data?.sphereIndices.find(s => s.sphereId === sphere.id);
                const indexValue = sphereIndex?.index || 0;
                
                return (
                  <SphereCard 
                    key={sphere.id}
                    sphere={sphere}
                    indexValue={indexValue}
                    delay={index * 0.05}
                    language={language}
                    onClick={() => navigate(`/sphere/${sphere.key}`)}
                  />
                );
              })}
            </div>
            
            {/* Right Column - Social Spheres */}
            <div className="space-y-3">
              {SPHERES.filter(s => s.group_type === 'social').map((sphere, index) => {
                const sphereIndex = data?.sphereIndices.find(s => s.sphereId === sphere.id);
                const indexValue = sphereIndex?.index || 0;
                
                return (
                  <SphereCard 
                    key={sphere.id}
                    sphere={sphere}
                    indexValue={indexValue}
                    delay={index * 0.05 + 0.2}
                    language={language}
                    onClick={() => navigate(`/sphere/${sphere.key}`)}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Empty state hint */}
        {data?.lifeIndex === 0 && (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">
              {labels.noData[language]}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
