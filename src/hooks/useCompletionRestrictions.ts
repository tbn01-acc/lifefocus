import { useCallback } from 'react';
import { format, parseISO, isBefore, isAfter, startOfDay, subDays } from 'date-fns';
import { toast } from 'sonner';

export interface CompletionRestrictions {
  canComplete: boolean;
  reason?: string;
  isVerified: boolean;
}

export function useCompletionRestrictions() {
  /**
   * Check if a date can be marked as complete
   * Rules:
   * - Cannot mark future dates (beyond today)
   * - Can mark today and up to 2 days in the past
   * - Past completions (not today) are unverified and don't count for stars/streak
   */
  const checkCompletionDate = useCallback((date: string): CompletionRestrictions => {
    const today = startOfDay(new Date());
    const targetDate = startOfDay(parseISO(date));
    const twoDaysAgo = startOfDay(subDays(today, 2));

    // Cannot complete in the future
    if (isAfter(targetDate, today)) {
      return {
        canComplete: false,
        reason: 'Нельзя отмечать события в будущем',
        isVerified: false
      };
    }

    // Today's completions are verified
    if (format(targetDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return {
        canComplete: true,
        isVerified: true
      };
    }

    // Can complete up to 2 days in the past, but unverified
    if (isBefore(targetDate, twoDaysAgo)) {
      return {
        canComplete: false,
        reason: 'Можно отмечать выполнение только за последние 2 дня',
        isVerified: false
      };
    }

    // Past completion (1-2 days ago) - allowed but unverified
    return {
      canComplete: true,
      isVerified: false
    };
  }, []);

  const validateAndComplete = useCallback((
    date: string, 
    onComplete: () => void,
    showToast: boolean = true
  ): boolean => {
    const restrictions = checkCompletionDate(date);

    if (!restrictions.canComplete) {
      if (showToast && restrictions.reason) {
        toast.error(restrictions.reason);
      }
      return false;
    }

    if (!restrictions.isVerified && showToast) {
      toast.info('Отметка за прошлые дни не учитывается в бонусах и серии');
    }

    onComplete();
    return true;
  }, [checkCompletionDate]);

  return {
    checkCompletionDate,
    validateAndComplete
  };
}
