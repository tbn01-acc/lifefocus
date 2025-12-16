import { useEffect, useRef } from 'react';
import { Task } from '@/types/task';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/contexts/LanguageContext';

export function useTaskNotifications(tasks: Task[]) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const hasShownRef = useRef(false);

  useEffect(() => {
    // Only show notifications once per session
    if (hasShownRef.current || tasks.length === 0) return;

    const today = new Date().toISOString().split('T')[0];
    
    // Find overdue tasks
    const overdueTasks = tasks.filter(task => 
      !task.completed && 
      task.dueDate < today
    );

    // Find high priority tasks due today
    const highPriorityToday = tasks.filter(task =>
      !task.completed &&
      task.priority === 'high' &&
      task.dueDate === today
    );

    // Show notifications with delay between them
    let delay = 500;

    if (overdueTasks.length > 0) {
      setTimeout(() => {
        toast({
          title: `⚠️ ${t('overdueTasksNotification')}`,
          description: `${overdueTasks.length} ${t('overdue').toLowerCase()}`,
          variant: 'destructive',
        });
      }, delay);
      delay += 1500;
    }

    if (highPriorityToday.length > 0) {
      setTimeout(() => {
        toast({
          title: `🔥 ${t('highPriorityNotification')}`,
          description: `${highPriorityToday.length} ${t('priorityHigh').toLowerCase()}`,
        });
      }, delay);
    }

    hasShownRef.current = true;
  }, [tasks, toast, t]);
}
