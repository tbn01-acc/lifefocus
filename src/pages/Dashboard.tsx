import { Target, CheckSquare, Wallet, Dumbbell } from 'lucide-react';
import { useHabits, getTodayString } from '@/hooks/useHabits';
import { useTasks } from '@/hooks/useTasks';
import { useFinance } from '@/hooks/useFinance';
import { useFitness } from '@/hooks/useFitness';
import { useTranslation } from '@/contexts/LanguageContext';
import { DayCard } from '@/components/dashboard/DayCard';
import { TodoSection } from '@/components/dashboard/TodoSection';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ShareButtons } from '@/components/ShareButtons';
import { Sparkles } from 'lucide-react';

export default function Dashboard() {
  const { habits, toggleHabitCompletion } = useHabits();
  const { tasks, toggleTaskCompletion, getTodayTasks } = useTasks();
  const { transactions, toggleTransactionCompletion, getTodayTransactions, getTodayBalance } = useFinance();
  const { getTodayExercises, toggleExerciseCompletion } = useFitness();
  const { t } = useTranslation();

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
  const todayBalance = getTodayBalance();

  // Exercises for today
  const todayExercises = getTodayExercises();
  const completedExercises = todayExercises.filter(e => e.completed);

  // Colors for modules (using CSS variables)
  const colors = {
    habits: 'hsl(var(--habit))',
    tasks: 'hsl(var(--task))',
    finance: 'hsl(var(--finance))',
    fitness: 'hsl(var(--fitness))',
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return t('goodNight');
    if (hour < 12) return t('goodMorning');
    if (hour < 18) return t('goodAfternoon');
    return t('goodEvening');
  };

  const dateString = new Date().toLocaleDateString('ru-RU', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

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
        <div className="mb-6">
          {/* Greeting and Controls Row */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-lg font-medium text-foreground">{getGreeting()}</p>
              <p className="text-sm text-muted-foreground capitalize">{dateString}</p>
            </div>
            <div className="flex items-center gap-1">
              <LanguageSelector />
              <ThemeToggle />
            </div>
          </div>

          {/* Share Buttons */}
          <div className="mb-4">
            <ShareButtons />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-foreground">{t('yourDay')}</h1>
        </div>

        {/* Day Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <DayCard
            title={t('habitsDone')}
            completed={completedHabits.length}
            total={todayHabits.length}
            color={colors.habits}
            icon={<Target className="w-5 h-5" />}
          />
          <DayCard
            title={t('tasksDone')}
            completed={completedTasks.length}
            total={todayTasks.length}
            color={colors.tasks}
            icon={<CheckSquare className="w-5 h-5" />}
          />
          <DayCard
            title={t('financeBalance')}
            completed={completedTransactions.length}
            total={todayTransactions.length}
            color={colors.finance}
            icon={<Wallet className="w-5 h-5" />}
            isBalance
            balanceValue={todayBalance}
          />
          <DayCard
            title={t('exercisesDone')}
            completed={completedExercises.length}
            total={todayExercises.length}
            color={colors.fitness}
            icon={<Dumbbell className="w-5 h-5" />}
          />
        </div>

        {/* To Do Today */}
        <h2 className="text-lg font-semibold text-foreground mb-4">{t('todoToday')}</h2>
        
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
