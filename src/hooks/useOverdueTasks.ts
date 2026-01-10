import { useState, useEffect, useCallback } from 'react';
import { Task } from '@/types/task';
import { format, isAfter, isBefore, startOfDay, parseISO } from 'date-fns';

export interface OverdueTask extends Task {
  isOverdue: boolean;
  originalDueDate: string;
  daysOverdue: number;
}

export function useOverdueTasks(tasks: Task[], updateTask: (id: string, updates: Partial<Task>) => void) {
  const [hasCheckedToday, setHasCheckedToday] = useState(false);
  const [overdueNotifications, setOverdueNotifications] = useState<string[]>([]);

  const checkAndMarkOverdueTasks = useCallback(() => {
    const today = startOfDay(new Date());
    const todayStr = format(today, 'yyyy-MM-dd');
    
    const lastChecked = localStorage.getItem('overdueTasksLastChecked');
    if (lastChecked === todayStr) {
      setHasCheckedToday(true);
      return [];
    }
    
    const newOverdueTasks: Task[] = [];
    
    tasks.forEach(task => {
      if (!task.completed && task.status !== 'done') {
        const dueDate = parseISO(task.dueDate);
        const startOfDueDate = startOfDay(dueDate);
        
        if (isBefore(startOfDueDate, today)) {
          // Task is overdue - move to today
          updateTask(task.id, {
            dueDate: todayStr,
            notes: task.notes 
              ? `${task.notes}\n\n⚡ Просрочено: было запланировано на ${task.dueDate}`
              : `⚡ Просрочено: было запланировано на ${task.dueDate}`
          });
          newOverdueTasks.push(task);
        }
      }
    });
    
    localStorage.setItem('overdueTasksLastChecked', todayStr);
    setHasCheckedToday(true);
    setOverdueNotifications(newOverdueTasks.map(t => t.id));
    
    return newOverdueTasks;
  }, [tasks, updateTask]);

  useEffect(() => {
    if (!hasCheckedToday && tasks.length > 0) {
      const timer = setTimeout(() => {
        checkAndMarkOverdueTasks();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hasCheckedToday, tasks, checkAndMarkOverdueTasks]);

  const isTaskOverdue = useCallback((task: Task) => {
    if (task.completed || task.status === 'done') return false;
    const today = startOfDay(new Date());
    const dueDate = startOfDay(parseISO(task.dueDate));
    return isBefore(dueDate, today);
  }, []);

  const getOverdueInfo = useCallback((task: Task) => {
    if (!isTaskOverdue(task)) return null;
    
    const today = startOfDay(new Date());
    const dueDate = startOfDay(parseISO(task.dueDate));
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      daysOverdue,
      originalDueDate: task.dueDate
    };
  }, [isTaskOverdue]);

  const wasRecentlyMarkedOverdue = useCallback((taskId: string) => {
    return overdueNotifications.includes(taskId);
  }, [overdueNotifications]);

  const clearOverdueNotification = useCallback((taskId: string) => {
    setOverdueNotifications(prev => prev.filter(id => id !== taskId));
  }, []);

  return {
    checkAndMarkOverdueTasks,
    isTaskOverdue,
    getOverdueInfo,
    wasRecentlyMarkedOverdue,
    clearOverdueNotification,
    overdueNotifications
  };
}
