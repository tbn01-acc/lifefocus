import { useMemo } from 'react';
import { useSubscription } from './useSubscription';

export interface UsageLimits {
  habits: { current: number; max: number; canAdd: boolean };
  tasks: { current: number; max: number; canAdd: boolean };
  transactions: { current: number; max: number; canAdd: boolean };
}

const FREE_LIMITS = {
  habits: 3,
  tasks: 3,
  transactions: 15,
};

const PRO_LIMITS = {
  habits: Infinity,
  tasks: Infinity,
  transactions: Infinity,
};

export function useUsageLimits() {
  const { isProActive } = useSubscription();

  const limits = useMemo(() => isProActive ? PRO_LIMITS : FREE_LIMITS, [isProActive]);

  const checkLimit = (type: 'habits' | 'tasks' | 'transactions', currentCount: number): UsageLimits[typeof type] => {
    const max = limits[type];
    return {
      current: currentCount,
      max,
      canAdd: currentCount < max,
    };
  };

  const getHabitsLimit = (currentCount: number) => checkLimit('habits', currentCount);
  const getTasksLimit = (currentCount: number) => checkLimit('tasks', currentCount);
  const getTransactionsLimit = (currentCount: number) => checkLimit('transactions', currentCount);

  return {
    limits,
    isProActive,
    getHabitsLimit,
    getTasksLimit,
    getTransactionsLimit,
    checkLimit,
  };
}
