import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, Target } from 'lucide-react';
import { useHabits } from '@/hooks/useHabits';
import { Habit } from '@/types/habit';
import { HabitCard } from '@/components/HabitCard';
import { HabitDialog } from '@/components/HabitDialog';
import { PageHeader } from '@/components/PageHeader';
import { ViewTabs, ViewType } from '@/components/ViewTabs';
import { CalendarView } from '@/components/CalendarView';
import { ProgressView } from '@/components/ProgressView';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/contexts/LanguageContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface HabitsProps {
  openDialog?: boolean;
  onDialogClose?: () => void;
}

export default function Habits({ openDialog, onDialogClose }: HabitsProps) {
  const { habits, isLoading, addHabit, updateHabit, deleteHabit, toggleHabitCompletion } = useHabits();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deleteConfirmHabit, setDeleteConfirmHabit] = useState<Habit | null>(null);
  const [activeView, setActiveView] = useState<ViewType>('habits');
  const { t } = useTranslation();

  const handleSaveHabit = (habitData: Omit<Habit, 'id' | 'createdAt' | 'completedDates' | 'streak'>) => {
    if (editingHabit) {
      updateHabit(editingHabit.id, habitData);
    } else {
      addHabit(habitData);
    }
    setEditingHabit(null);
    setDialogOpen(false);
    onDialogClose?.();
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setDialogOpen(true);
  };

  const handleDeleteHabit = (habit: Habit) => {
    setDeleteConfirmHabit(habit);
  };

  const confirmDelete = () => {
    if (deleteConfirmHabit) {
      deleteHabit(deleteConfirmHabit.id);
      setDeleteConfirmHabit(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse-soft">
          <Sparkles className="w-12 h-12 text-habit" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <PageHeader
          icon={<Target className="w-5 h-5 text-habit" />}
          iconBgClass="bg-habit/20"
          title={t('myHabits')}
          subtitle={`${habits.length} ${t('habits').toLowerCase()}`}
        />

        {/* View Tabs */}
        <div className="mt-6">
          <ViewTabs value={activeView} onValueChange={setActiveView} />
        </div>

        {/* Content based on active view */}
        <div className="mt-6">
          <AnimatePresence mode="wait">
            {activeView === 'habits' && (
              <motion.div
                key="habits"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <AnimatePresence mode="popLayout">
                  {habits.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-12"
                    >
                      <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-habit/20 to-habit/10 flex items-center justify-center">
                        <Target className="w-10 h-10 text-habit" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        {t('startBuilding')}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
                        {t('createFirst')}
                      </p>
                      <Button 
                        onClick={() => setDialogOpen(true)}
                        className="bg-habit text-white hover:bg-habit/90"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {t('createHabit')}
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="space-y-3">
                      {habits.map((habit, index) => (
                        <HabitCard
                          key={habit.id}
                          habit={habit}
                          index={index}
                          onToggle={(date) => toggleHabitCompletion(habit.id, date)}
                          onEdit={() => handleEditHabit(habit)}
                          onDelete={() => handleDeleteHabit(habit)}
                        />
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {activeView === 'calendar' && (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <CalendarView 
                  habits={habits} 
                  onToggle={toggleHabitCompletion}
                  initialPeriod="7"
                />
              </motion.div>
            )}

            {activeView === 'progress' && (
              <motion.div
                key="progress"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <ProgressView habits={habits} initialPeriod="7" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* FAB */}
      {habits.length > 0 && activeView === 'habits' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="fixed bottom-24 right-6"
        >
          <Button
            onClick={() => {
              setEditingHabit(null);
              setDialogOpen(true);
            }}
            size="lg"
            className="w-14 h-14 rounded-full bg-habit hover:bg-habit/90 shadow-lg p-0"
          >
            <Plus className="w-6 h-6 text-white" />
          </Button>
        </motion.div>
      )}

      {/* Dialogs */}
      <HabitDialog
        open={dialogOpen || !!openDialog}
        onClose={() => {
          setDialogOpen(false);
          setEditingHabit(null);
          onDialogClose?.();
        }}
        onSave={handleSaveHabit}
        habit={editingHabit}
      />

      <AlertDialog open={!!deleteConfirmHabit} onOpenChange={() => setDeleteConfirmHabit(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteHabit')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
