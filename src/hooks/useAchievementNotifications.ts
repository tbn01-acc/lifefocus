import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { useTranslation } from '@/contexts/LanguageContext';

interface AchievementNotificationsOptions {
  starsEarned?: number;
  tasksCompleted?: number;
  habitsCompleted?: number;
  currentStreak?: number;
  totalStars?: number;
}

// Milestones for different types
const TASK_MILESTONES = [5, 10, 25, 50, 100, 250, 500, 1000];
const HABIT_MILESTONES = [7, 14, 30, 60, 100, 180, 365];
const STAR_MILESTONES = [50, 100, 250, 500, 1000, 2500, 5000, 10000];
const STREAK_MILESTONES = [3, 7, 14, 21, 30, 60, 90, 180, 365];

export function useAchievementNotifications() {
  const { language } = useTranslation();
  const isRussian = language === 'ru';
  
  // Track last shown values to prevent duplicate notifications
  const lastShownRef = useRef<{
    tasks: number;
    habits: number;
    stars: number;
    streak: number;
  }>({
    tasks: 0,
    habits: 0,
    stars: 0,
    streak: 0
  });

  const triggerCelebration = useCallback((intensity: 'small' | 'medium' | 'large' = 'medium') => {
    const configs = {
      small: { particleCount: 30, spread: 50 },
      medium: { particleCount: 80, spread: 70 },
      large: { particleCount: 150, spread: 100 }
    };
    
    confetti({
      ...configs[intensity],
      origin: { y: 0.6 },
      colors: ['#fbbf24', '#f59e0b', '#d97706', '#22c55e', '#3b82f6']
    });
  }, []);

  const checkTaskMilestone = useCallback((count: number) => {
    const prevCount = lastShownRef.current.tasks;
    
    for (const milestone of TASK_MILESTONES) {
      if (count >= milestone && prevCount < milestone) {
        lastShownRef.current.tasks = count;
        
        toast.success(
          isRussian ? `🎯 ${milestone} задач выполнено!` : `🎯 ${milestone} tasks completed!`,
          {
            description: isRussian 
              ? 'Продолжай в том же духе!' 
              : 'Keep up the great work!',
            duration: 5000
          }
        );
        
        triggerCelebration(milestone >= 100 ? 'large' : milestone >= 25 ? 'medium' : 'small');
        return true;
      }
    }
    
    lastShownRef.current.tasks = count;
    return false;
  }, [isRussian, triggerCelebration]);

  const checkHabitMilestone = useCallback((count: number) => {
    const prevCount = lastShownRef.current.habits;
    
    for (const milestone of HABIT_MILESTONES) {
      if (count >= milestone && prevCount < milestone) {
        lastShownRef.current.habits = count;
        
        toast.success(
          isRussian ? `✨ ${milestone} привычек выполнено!` : `✨ ${milestone} habits completed!`,
          {
            description: isRussian 
              ? 'Ты формируешь отличные привычки!' 
              : 'You\'re building great habits!',
            duration: 5000
          }
        );
        
        triggerCelebration(milestone >= 100 ? 'large' : milestone >= 30 ? 'medium' : 'small');
        return true;
      }
    }
    
    lastShownRef.current.habits = count;
    return false;
  }, [isRussian, triggerCelebration]);

  const checkStarMilestone = useCallback((count: number) => {
    const prevCount = lastShownRef.current.stars;
    
    for (const milestone of STAR_MILESTONES) {
      if (count >= milestone && prevCount < milestone) {
        lastShownRef.current.stars = count;
        
        toast.success(
          isRussian ? `⭐ ${milestone} звёзд заработано!` : `⭐ ${milestone} stars earned!`,
          {
            description: isRussian 
              ? 'Потрать их в магазине наград!' 
              : 'Spend them in the rewards shop!',
            duration: 5000
          }
        );
        
        triggerCelebration(milestone >= 1000 ? 'large' : milestone >= 250 ? 'medium' : 'small');
        return true;
      }
    }
    
    lastShownRef.current.stars = count;
    return false;
  }, [isRussian, triggerCelebration]);

  const checkStreakMilestone = useCallback((days: number) => {
    const prevDays = lastShownRef.current.streak;
    
    for (const milestone of STREAK_MILESTONES) {
      if (days >= milestone && prevDays < milestone) {
        lastShownRef.current.streak = days;
        
        toast.success(
          isRussian ? `🔥 ${milestone} дней подряд!` : `🔥 ${milestone} day streak!`,
          {
            description: isRussian 
              ? 'Невероятная последовательность!' 
              : 'Incredible consistency!',
            duration: 5000
          }
        );
        
        triggerCelebration(days >= 60 ? 'large' : days >= 14 ? 'medium' : 'small');
        return true;
      }
    }
    
    lastShownRef.current.streak = days;
    return false;
  }, [isRussian, triggerCelebration]);

  const notifyStarEarned = useCallback((amount: number, reason?: string) => {
    toast.success(`+${amount} ⭐`, {
      description: reason || (isRussian ? 'Звёзды получены' : 'Stars earned'),
      duration: 3000
    });
  }, [isRussian]);

  const notifyRewardPurchased = useCallback((rewardName: string) => {
    toast.success(
      isRussian ? '🎁 Награда получена!' : '🎁 Reward unlocked!',
      {
        description: rewardName,
        duration: 4000
      }
    );
    triggerCelebration('medium');
  }, [isRussian, triggerCelebration]);

  const notifyLevelUp = useCallback((newLevel: number) => {
    toast.success(
      isRussian ? `🏆 Уровень ${newLevel}!` : `🏆 Level ${newLevel}!`,
      {
        description: isRussian ? 'Ты достиг нового уровня!' : 'You reached a new level!',
        duration: 5000
      }
    );
    triggerCelebration('large');
  }, [isRussian, triggerCelebration]);

  return {
    checkTaskMilestone,
    checkHabitMilestone,
    checkStarMilestone,
    checkStreakMilestone,
    notifyStarEarned,
    notifyRewardPurchased,
    notifyLevelUp,
    triggerCelebration
  };
}
