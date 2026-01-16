import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BalanceFlower } from '@/components/spheres/BalanceFlower';
import { EnergyGauge } from '@/components/spheres/EnergyGauge';
import { MindfulnessMetric } from '@/components/spheres/MindfulnessMetric';
import { useSpheres } from '@/hooks/useSpheres';
import { useLanguage } from '@/contexts/LanguageContext';
import { LifeIndexData, SPHERES, getSphereName } from '@/types/sphere';
import { Skeleton } from '@/components/ui/skeleton';
import { AppHeader } from '@/components/AppHeader';

export default function LifeFocus() {
  const navigate = useNavigate();
  const { language } = useLanguage();
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const result = await fetchLifeIndexData();
    setData(result);
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
          <div>
            <h1 className="text-2xl font-bold">{labels.title[language]}</h1>
            <p className="text-sm text-muted-foreground">{labels.subtitle[language]}</p>
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
        {/* Balance Flower with Gauges */}
        <Card className="p-6">
          <p className="text-sm text-muted-foreground text-center mb-4">
            {labels.subtitle[language]}
          </p>
          
          <div className="flex items-center justify-between gap-4">
            {/* Left Gauge - Personal Energy */}
            <EnergyGauge 
              value={data?.personalEnergy || 0} 
              type="personal" 
            />
            
            {/* Center - Balance Flower */}
            <div className="flex-1">
              <BalanceFlower 
                sphereIndices={data?.sphereIndices || []}
                lifeIndex={data?.lifeIndex || 0}
              />
            </div>
            
            {/* Right Gauge - External Success */}
            <EnergyGauge 
              value={data?.externalSuccess || 0} 
              type="social" 
            />
          </div>
        </Card>

        {/* Mindfulness Metric */}
        <MindfulnessMetric value={data?.mindfulnessLevel || 0} />

        {/* Sphere List */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">
            {labels.sphereDetails[language]}
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            {SPHERES.filter(s => s.group_type !== 'system').map((sphere, index) => {
              const sphereIndex = data?.sphereIndices.find(s => s.sphereId === sphere.id);
              const indexValue = sphereIndex?.index || 0;
              
              return (
                <motion.div
                  key={sphere.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/sphere/${sphere.key}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                        style={{ backgroundColor: `${sphere.color}20` }}
                      >
                        {sphere.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {getSphereName(sphere, language)}
                        </p>
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden"
                          >
                            <div 
                              className="h-full rounded-full transition-all duration-500"
                              style={{ 
                                width: `${indexValue}%`,
                                backgroundColor: sphere.color,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-muted-foreground">
                            {indexValue}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
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
