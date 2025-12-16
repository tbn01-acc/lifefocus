import { Target, CheckSquare, Wallet, Dumbbell, Sparkles } from 'lucide-react';
import { useHabits, getTodayString } from '@/hooks/useHabits';
import { useTasks } from '@/hooks/useTasks';
import { useFinance } from '@/hooks/useFinance';
import { useFitness } from '@/hooks/useFitness';
import { useTranslation } from '@/contexts/LanguageContext';
import { ProgressBar } from '@/components/dashboard/ProgressBar';
import { TodoSection } from '@/components/dashboard/TodoSection';
import { PageHeader } from '@/components/PageHeader';
import { DayQualityRing } from '@/components/dashboard/DayQualityRing';

export default function Dashboard() {
  const { habits, toggleHabitCompletion } = useHabits();
  const { tasks, toggleTaskCompletion, getTodayTasks } = useTasks();
  const { transactions, toggleTransactionCompletion, getTodayTransactions } = useFinance();
  const { getTodayExercises, toggleExerciseCompletion } = useFitness();
  const { t, language } = useTranslation();

  const today = getTodayString();
  const dayOfWeek = new Date().getDay();

  // Habits for today
  const todayHabits = habits.filter(h => h.targetDays.includes(dayOfWeek));
  const completedHabits = todayHabits.filter(h => h.completedDates.includes(today));

  // Tasks for today
  const todayTasks = getTodayTasks();
  const completedTasks = todayTasks.filter(t => t.completed);

  // Transactions for today
  const todayTransactions = getTodayTransactions();
  const completedTransactions = todayTransactions.filter(t => t.completed);

  // Exercises for today
  const todayExercises = getTodayExercises();
  const completedExercises = todayExercises.filter(e => e.completed);

  // Calculate Day Quality (0-100)
  const totalItems = todayHabits.length + todayTasks.length + todayTransactions.length + todayExercises.length;
  const completedItems = completedHabits.length + completedTasks.length + completedTransactions.length + completedExercises.length;
  const dayQuality = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Format date
  const formattedDate = new Date().toLocaleDateString(
    language === 'ru' ? 'ru-RU' : language === 'es' ? 'es-ES' : 'en-US',
    { day: 'numeric', month: 'long', weekday: 'long' }
  );

  // Colors for modules
  const colors = {
    habits: 'hsl(var(--habit))',
    tasks: 'hsl(var(--task))',
    finance: 'hsl(var(--finance))',
    fitness: 'hsl(var(--fitness))',
  };

  const isLoading = false;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse-soft">
          <Sparkles className="w-12 h-12 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <PageHeader />

        {/* Section: Сегодня with Day Quality Ring */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('today')}</h1>
            <p className="text-sm text-muted-foreground capitalize">{formattedDate}</p>
          </div>
          <DayQualityRing value={dayQuality} />
        </div>

        {/* Section: Выполнено */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">{t('completed')}:</h2>
          <div className="bg-card rounded-2xl p-4 shadow-card border border-border">
            <ProgressBar
              icon={<Target className="w-4 h-4" />}
              completed={completedHabits.length}
              total={todayHabits.length}
              label={t('habitsLabel')}
              color={colors.habits}
            />
            <ProgressBar
              icon={<CheckSquare className="w-4 h-4" />}
              completed={completedTasks.length}
              total={todayTasks.length}
              label={t('tasksLabel')}
              color={colors.tasks}
            />
            <ProgressBar
              icon={<Wallet className="w-4 h-4" />}
              completed={completedTransactions.length}
              total={todayTransactions.length}
              label={t('operationsLabel')}
              color={colors.finance}
            />
            <ProgressBar
              icon={<Dumbbell className="w-4 h-4" />}
              completed={completedExercises.length}
              total={todayExercises.length}
              label={t('exercisesLabel')}
              color={colors.fitness}
            />
          </div>
        </div>

        {/* Section: Сделать */}
        <h2 className="text-sm font-medium text-muted-foreground mb-3">{t('toDo')}:</h2>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <TodoSection
            title={t('habits')}
            items={todayHabits.map(h => ({
              id: h.id,
              name: h.name,
              icon: h.icon,
              completed: h.completedDates.includes(today),
            }))}
            color={colors.habits}
            icon={<Target className="w-4 h-4" />}
            onToggle={(id) => toggleHabitCompletion(id, today)}
          />
          
          <TodoSection
            title={t('tasks')}
            items={todayTasks.map(t => ({
              id: t.id,
              name: t.name,
              icon: t.icon,
              completed: t.completed,
            }))}
            color={colors.tasks}
            icon={<CheckSquare className="w-4 h-4" />}
            onToggle={toggleTaskCompletion}
          />
          
          <TodoSection
            title={t('finance')}
            items={todayTransactions.map(t => ({
              id: t.id,
              name: `${t.type === 'income' ? '+' : '-'}${t.amount}₽ ${t.name}`,
              completed: t.completed,
            }))}
            color={colors.finance}
            icon={<Wallet className="w-4 h-4" />}
            onToggle={toggleTransactionCompletion}
          />
          
          <TodoSection
            title={t('fitness')}
            items={todayExercises.map(e => ({
              id: `${e.workoutId}-${e.id}`,
              name: e.name,
              completed: e.completed,
            }))}
            color={colors.fitness}
            icon={<Dumbbell className="w-4 h-4" />}
            onToggle={(id) => {
              const [workoutId, exerciseId] = id.split('-');
              toggleExerciseCompletion(workoutId, exerciseId, today);
            }}
            emptyMessage={t('recoveryDay')}
          />
        </div>
      </div>
    </div>
  );
}
