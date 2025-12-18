import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Dumbbell, X } from 'lucide-react';
import { useFitness } from '@/hooks/useFitness';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { format, subDays, addDays, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';

interface WorkoutHistoryProps {
  open: boolean;
  onClose: () => void;
}

export function WorkoutHistory({ open, onClose }: WorkoutHistoryProps) {
  const { t } = useTranslation();
  const { exerciseLogs, workouts, exerciseCategories } = useFitness();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const logsForDate = useMemo(() => {
    return exerciseLogs.filter(log => log.date === dateStr);
  }, [exerciseLogs, dateStr]);

  // Group logs by workout
  const logsByWorkout = useMemo(() => {
    const grouped: Record<string, typeof logsForDate> = {};
    logsForDate.forEach(log => {
      if (!grouped[log.workoutId]) {
        grouped[log.workoutId] = [];
      }
      grouped[log.workoutId].push(log);
    });
    return grouped;
  }, [logsForDate]);

  const goToPreviousDay = () => setSelectedDate(prev => subDays(prev, 1));
  const goToNextDay = () => setSelectedDate(prev => addDays(prev, 1));
  const isToday = isSameDay(selectedDate, new Date());

  // Get last 7 days for quick navigation
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[5%] bottom-24 max-w-md mx-auto bg-card rounded-3xl p-6 shadow-lg z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-fitness" />
                <h2 className="text-xl font-semibold text-foreground">{t('workoutHistory')}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={goToPreviousDay}
                className="p-2 rounded-xl hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              </button>
              <span className="text-lg font-medium text-foreground">
                {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
              </span>
              <button
                onClick={goToNextDay}
                disabled={isToday}
                className={cn(
                  "p-2 rounded-xl hover:bg-muted transition-colors",
                  isToday && "opacity-30 cursor-not-allowed"
                )}
              >
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Quick Day Selection */}
            <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
              {last7Days.map((day) => {
                const isSelected = isSameDay(day, selectedDate);
                const dayLogs = exerciseLogs.filter(l => l.date === format(day, 'yyyy-MM-dd'));
                const hasActivity = dayLogs.length > 0;
                
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "flex-shrink-0 w-12 py-2 rounded-xl text-center transition-all",
                      isSelected
                        ? "bg-fitness text-white"
                        : hasActivity
                          ? "bg-fitness/20 text-fitness"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    <div className="text-xs">{format(day, 'EEE', { locale: ru })}</div>
                    <div className="text-sm font-medium">{format(day, 'd')}</div>
                  </button>
                );
              })}
            </div>

            {/* Logs Content */}
            <div className="flex-1 overflow-y-auto space-y-4">
              {logsForDate.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-fitness/10 flex items-center justify-center">
                    <Dumbbell className="w-8 h-8 text-fitness/50" />
                  </div>
                  <p className="text-muted-foreground">{t('noWorkoutsForDay')}</p>
                </div>
              ) : (
                Object.entries(logsByWorkout).map(([workoutId, logs]) => {
                  const workout = workouts.find(w => w.id === workoutId);
                  return (
                    <div key={workoutId} className="bg-muted/50 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">{workout?.icon || '🏋️'}</span>
                        <h3 className="font-medium text-foreground">{workout?.name || logs[0].workoutName}</h3>
                      </div>
                      
                      <div className="space-y-3">
                        {logs.map(log => {
                          const category = exerciseCategories.find(c => c.id === log.categoryId);
                          const completedSets = log.sets.filter(s => s.completed);
                          
                          return (
                            <div key={log.id} className="bg-background rounded-xl p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-foreground">{log.exerciseName}</span>
                                  {category && (
                                    <span 
                                      className="text-xs px-2 py-0.5 rounded-full text-white"
                                      style={{ backgroundColor: category.color }}
                                    >
                                      {category.name}
                                    </span>
                                  )}
                                </div>
                                <span className={cn(
                                  "text-xs px-2 py-0.5 rounded-full",
                                  log.status === 'completed' 
                                    ? "bg-fitness/20 text-fitness" 
                                    : log.status === 'in_progress'
                                      ? "bg-yellow-500/20 text-yellow-600"
                                      : "bg-muted text-muted-foreground"
                                )}>
                                  {log.status === 'completed' ? t('statusDone') : 
                                   log.status === 'in_progress' ? t('statusInProgress') : t('statusNotStarted')}
                                </span>
                              </div>
                              
                              {/* Sets Table */}
                              {completedSets.length > 0 && (
                                <div className="grid grid-cols-4 gap-1 text-xs">
                                  <div className="text-muted-foreground text-center">{t('set')}</div>
                                  <div className="text-muted-foreground text-center">{t('reps')}</div>
                                  <div className="text-muted-foreground text-center">{t('weight')}</div>
                                  <div className="text-muted-foreground text-center">{t('status')}</div>
                                  
                                  {completedSets.map((set, idx) => (
                                    <>
                                      <div key={`num-${idx}`} className="text-center text-foreground font-medium">{set.setNumber}</div>
                                      <div key={`reps-${idx}`} className="text-center text-foreground">{set.reps}</div>
                                      <div key={`weight-${idx}`} className="text-center text-foreground">{set.weight || '-'} кг</div>
                                      <div key={`status-${idx}`} className="text-center text-fitness">✓</div>
                                    </>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
