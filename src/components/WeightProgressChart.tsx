import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ChevronDown } from 'lucide-react';
import { useFitness } from '@/hooks/useFitness';
import { useTranslation } from '@/contexts/LanguageContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface WeightProgressChartProps {
  period?: number; // days
}

export function WeightProgressChart({ period = 30 }: WeightProgressChartProps) {
  const { t } = useTranslation();
  const { exerciseLogs, workouts } = useFitness();
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Get unique exercises with weight data
  const exercisesWithWeights = useMemo(() => {
    const exerciseMap = new Map<string, { id: string; name: string; workoutName: string }>();
    
    exerciseLogs.forEach(log => {
      const hasWeight = log.sets.some(s => s.weight && s.weight > 0);
      if (hasWeight && !exerciseMap.has(log.exerciseName)) {
        exerciseMap.set(log.exerciseName, {
          id: log.exerciseId,
          name: log.exerciseName,
          workoutName: log.workoutName,
        });
      }
    });
    
    return Array.from(exerciseMap.values());
  }, [exerciseLogs]);

  // Get chart data for selected exercise
  const chartData = useMemo(() => {
    if (!selectedExercise) return [];

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const relevantLogs = exerciseLogs
      .filter(log => {
        const logDate = new Date(log.date);
        return log.exerciseName === selectedExercise && 
               logDate >= startDate && 
               logDate <= endDate;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return relevantLogs.map(log => {
      const completedSets = log.sets.filter(s => s.completed && s.weight);
      const maxWeight = completedSets.length > 0 
        ? Math.max(...completedSets.map(s => s.weight || 0))
        : 0;
      const avgWeight = completedSets.length > 0
        ? completedSets.reduce((sum, s) => sum + (s.weight || 0), 0) / completedSets.length
        : 0;
      const totalVolume = completedSets.reduce((sum, s) => sum + (s.weight || 0) * s.reps, 0);

      return {
        date: format(new Date(log.date), 'd MMM', { locale: ru }),
        fullDate: log.date,
        maxWeight: Math.round(maxWeight * 10) / 10,
        avgWeight: Math.round(avgWeight * 10) / 10,
        volume: Math.round(totalVolume),
        sets: completedSets.length,
      };
    });
  }, [exerciseLogs, selectedExercise, period]);

  // Calculate progress
  const progress = useMemo(() => {
    if (chartData.length < 2) return null;
    
    const first = chartData[0];
    const last = chartData[chartData.length - 1];
    const weightChange = last.maxWeight - first.maxWeight;
    const percentChange = first.maxWeight > 0 
      ? ((weightChange / first.maxWeight) * 100).toFixed(1)
      : '0';

    return {
      weightChange,
      percentChange,
      isPositive: weightChange > 0,
    };
  }, [chartData]);

  if (exercisesWithWeights.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-4 border border-border">
        <div className="text-center py-8">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{t('noWeightData')}</p>
          <p className="text-xs text-muted-foreground/70 mt-1">{t('startLoggingWeights')}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-4 border border-border"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-fitness" />
          {t('weightProgress')}
        </h3>
        {progress && (
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            progress.isPositive ? "bg-green-500/20 text-green-600" : "bg-red-500/20 text-red-600"
          )}>
            {progress.isPositive ? '+' : ''}{progress.weightChange} кг ({progress.percentChange}%)
          </span>
        )}
      </div>

      {/* Exercise Selector */}
      <div className="relative mb-4">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between p-3 bg-muted rounded-xl text-sm"
        >
          <span className={selectedExercise ? "text-foreground" : "text-muted-foreground"}>
            {selectedExercise || t('selectExercise')}
          </span>
          <ChevronDown className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            isDropdownOpen && "rotate-180"
          )} />
        </button>

        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto"
          >
            {exercisesWithWeights.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => {
                  setSelectedExercise(exercise.name);
                  setIsDropdownOpen(false);
                }}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors",
                  selectedExercise === exercise.name && "bg-fitness/10 text-fitness"
                )}
              >
                <div className="font-medium">{exercise.name}</div>
                <div className="text-xs text-muted-foreground">{exercise.workoutName}</div>
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Chart */}
      {selectedExercise && chartData.length > 0 ? (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    maxWeight: t('maxWeight'),
                    avgWeight: t('avgWeight'),
                    volume: t('totalVolume'),
                  };
                  return [
                    name === 'volume' ? `${value} кг` : `${value} кг`,
                    labels[name] || name
                  ];
                }}
              />
              <Line 
                type="monotone" 
                dataKey="maxWeight" 
                stroke="hsl(262, 80%, 55%)" 
                strokeWidth={2}
                dot={{ fill: 'hsl(262, 80%, 55%)', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="avgWeight" 
                stroke="hsl(168, 80%, 40%)" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : selectedExercise ? (
        <div className="h-48 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">{t('noDataForExercise')}</p>
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">{t('selectExerciseToSeeProgress')}</p>
        </div>
      )}

      {/* Legend */}
      {selectedExercise && chartData.length > 0 && (
        <div className="flex justify-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-fitness rounded" />
            <span className="text-xs text-muted-foreground">{t('maxWeight')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-[hsl(168,80%,40%)] rounded" style={{ borderStyle: 'dashed' }} />
            <span className="text-xs text-muted-foreground">{t('avgWeight')}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
