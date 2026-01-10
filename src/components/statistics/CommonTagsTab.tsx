import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Tag, Clock, TrendingUp, Zap, Target, BarChart3 } from 'lucide-react';
import { useUserTags } from '@/hooks/useUserTags';
import { useTimeTracker } from '@/hooks/useTimeTracker';
import { useHabits } from '@/hooks/useHabits';
import { useTasks } from '@/hooks/useTasks';
import { useFinance } from '@/hooks/useFinance';
import { useTranslation } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

export function CommonTagsTab() {
  const { t, language } = useTranslation();
  const { tags } = useUserTags();
  const { entries: timeEntries } = useTimeTracker();
  const { habits } = useHabits();
  const { tasks } = useTasks();
  const { transactions } = useFinance();
  const isRussian = language === 'ru';

  // Calculate statistics for each tag
  const tagStats = useMemo(() => {
    return tags.map(tag => {
      // Tasks with this tag
      const taggedTasks = tasks.filter(t => t.tagIds?.includes(tag.id));
      const completedTasks = taggedTasks.filter(t => t.completed);
      
      // Habits with this tag
      const taggedHabits = habits.filter(h => h.tagIds?.includes(tag.id));
      
      // Transactions with this tag
      const taggedTransactions = transactions.filter(t => t.tagIds?.includes(tag.id));
      const totalIncome = taggedTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = taggedTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      // Time spent on tasks with this tag
      const timeSpent = timeEntries
        .filter(e => {
          const task = tasks.find(t => t.id === e.taskId);
          return task?.tagIds?.includes(tag.id);
        })
        .reduce((sum, e) => sum + e.duration, 0);

      return {
        ...tag,
        tasksCount: taggedTasks.length,
        completedTasks: completedTasks.length,
        habitsCount: taggedHabits.length,
        transactionsCount: taggedTransactions.length,
        totalIncome,
        totalExpense,
        timeSpentMinutes: Math.round(timeSpent / 60),
        completionRate: taggedTasks.length > 0 
          ? Math.round((completedTasks.length / taggedTasks.length) * 100) 
          : 0
      };
    });
  }, [tags, tasks, habits, transactions, timeEntries]);

  // Chart data
  const chartData = useMemo(() => {
    return tagStats.map(tag => ({
      name: tag.name.length > 10 ? tag.name.slice(0, 10) + '...' : tag.name,
      tasks: tag.tasksCount,
      completed: tag.completedTasks,
      time: tag.timeSpentMinutes,
      color: tag.color
    }));
  }, [tagStats]);

  // Pie chart data for time distribution
  const timeDistributionData = useMemo(() => {
    return tagStats
      .filter(tag => tag.timeSpentMinutes > 0)
      .map(tag => ({
        name: tag.name,
        value: tag.timeSpentMinutes,
        color: tag.color
      }));
  }, [tagStats]);

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}м`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}ч ${mins}м` : `${hours}ч`;
  };

  if (tags.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Tag className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          {isRussian ? 'Нет общих тегов' : 'No common tags'}
        </h3>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          {isRussian 
            ? 'Создайте общие теги в настройках профиля для отслеживания статистики' 
            : 'Create common tags in profile settings to track statistics'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  {isRussian ? 'Всего тегов' : 'Total tags'}
                </span>
              </div>
              <div className="text-2xl font-bold text-foreground">{tags.length}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  {isRussian ? 'Общее время' : 'Total time'}
                </span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {formatTime(tagStats.reduce((sum, t) => sum + t.timeSpentMinutes, 0))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tasks per Tag Chart */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                {isRussian ? 'Задачи по тегам' : 'Tasks by tags'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="completed" name={isRussian ? 'Выполнено' : 'Completed'} fill="hsl(var(--primary))" radius={4} />
                    <Bar dataKey="tasks" name={isRussian ? 'Всего' : 'Total'} fill="hsl(var(--muted))" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Time Distribution Pie Chart */}
      {timeDistributionData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {isRussian ? 'Распределение времени' : 'Time distribution'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={timeDistributionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {timeDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatTime(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Individual Tag Stats */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          {isRussian ? 'Детальная статистика' : 'Detailed statistics'}
        </h3>
        {tagStats.map((tag, index) => (
          <motion.div
            key={tag.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: tag.color + '20' }}
                  >
                    <Tag className="w-5 h-5" style={{ color: tag.color }} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{tag.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {tag.completionRate}% {isRussian ? 'выполнено' : 'completed'}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted/50 rounded-lg p-2">
                    <div className="text-lg font-semibold text-foreground">{tag.tasksCount}</div>
                    <div className="text-xs text-muted-foreground">{isRussian ? 'Задач' : 'Tasks'}</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <div className="text-lg font-semibold text-foreground">{tag.habitsCount}</div>
                    <div className="text-xs text-muted-foreground">{isRussian ? 'Привычек' : 'Habits'}</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <div className="text-lg font-semibold text-foreground">{formatTime(tag.timeSpentMinutes)}</div>
                    <div className="text-xs text-muted-foreground">{isRussian ? 'Время' : 'Time'}</div>
                  </div>
                </div>

                {(tag.totalIncome > 0 || tag.totalExpense > 0) && (
                  <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-2">
                    <div className="text-center">
                      <div className="text-sm font-medium text-green-500">+{tag.totalIncome.toLocaleString()} ₽</div>
                      <div className="text-xs text-muted-foreground">{isRussian ? 'Доходы' : 'Income'}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-red-500">-{tag.totalExpense.toLocaleString()} ₽</div>
                      <div className="text-xs text-muted-foreground">{isRussian ? 'Расходы' : 'Expenses'}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
