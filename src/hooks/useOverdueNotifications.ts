import { useEffect, useRef } from 'react';
import { Task } from '@/types/task';
import { toast } from 'sonner';
import { format, isBefore, startOfDay, parseISO } from 'date-fns';

const NOTIFICATION_KEY = 'overdueTasksNotifiedToday';

export function useOverdueNotifications(tasks: Task[]) {
  const hasNotifiedRef = useRef(false);

  useEffect(() => {
    if (hasNotifiedRef.current || tasks.length === 0) return;

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const lastNotified = localStorage.getItem(NOTIFICATION_KEY);
    
    if (lastNotified === todayStr) {
      hasNotifiedRef.current = true;
      return;
    }

    // Find overdue tasks
    const today = startOfDay(new Date());
    const overdueTasks = tasks.filter(task => {
      if (task.completed || task.status === 'done') return false;
      const dueDate = startOfDay(parseISO(task.dueDate));
      return isBefore(dueDate, today);
    });

    if (overdueTasks.length > 0) {
      // Show toast notification
      setTimeout(() => {
        toast.warning(
          `⚡ У вас ${overdueTasks.length} просроченных ${overdueTasks.length === 1 ? 'задача' : 'задач'}!`,
          {
            description: 'Не забудьте выполнить или перенести их.',
            duration: 5000,
            action: {
              label: 'Показать',
              onClick: () => {
                window.location.href = '/tasks';
              },
            },
          }
        );
      }, 1500);

      localStorage.setItem(NOTIFICATION_KEY, todayStr);
    }

    hasNotifiedRef.current = true;
  }, [tasks]);
}
