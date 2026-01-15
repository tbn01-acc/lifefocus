import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format, startOfMonth, startOfYear } from 'date-fns';

export type LeaderboardType = 'stars' | 'likes' | 'activity';
export type LeaderboardPeriod = 'today' | 'month' | 'year' | 'all';

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  value: number;
  is_current_user: boolean;
}

export function useLeaderboardAggregates() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<LeaderboardPeriod>('all');
  const [type, setType] = useState<LeaderboardType>('stars');

  const getPeriodKey = useCallback((periodType: LeaderboardPeriod): string => {
    const now = new Date();
    switch (periodType) {
      case 'today':
        return format(now, 'yyyy-MM-dd');
      case 'month':
        return format(startOfMonth(now), 'yyyy-MM');
      case 'year':
        return format(startOfYear(now), 'yyyy');
      case 'all':
      default:
        return 'all';
    }
  }, []);

  const getValueColumn = useCallback((leaderboardType: LeaderboardType): string => {
    switch (leaderboardType) {
      case 'likes':
        return 'total_likes';
      case 'activity':
        return 'total_activity_score';
      case 'stars':
      default:
        return 'total_stars';
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);

    try {
      const periodKey = getPeriodKey(period);
      const valueColumn = getValueColumn(type);

      // For 'all' period, we can use the user_stars table directly for stars
      if (period === 'all' && type === 'stars') {
        const { data: starsData, error: starsError } = await supabase
          .from('user_stars')
          .select('user_id, total_stars')
          .order('total_stars', { ascending: false })
          .limit(100);

        if (starsError) throw starsError;

        if (!starsData || starsData.length === 0) {
          setLeaderboard([]);
          setLoading(false);
          return;
        }

        // Get profiles
        const userIds = starsData.map(s => s.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url, is_banned')
          .in('user_id', userIds);

        const profilesMap = (profilesData || []).reduce((acc, p) => {
          acc[p.user_id] = p;
          return acc;
        }, {} as Record<string, any>);

        const leaderboardData: LeaderboardEntry[] = starsData
          .filter(s => {
            const profile = profilesMap[s.user_id];
            return profile && !profile.is_banned;
          })
          .slice(0, 100)
          .map((s, index) => {
            const profile = profilesMap[s.user_id] || {};
            return {
              rank: index + 1,
              user_id: s.user_id,
              display_name: profile.display_name || 'Пользователь',
              avatar_url: profile.avatar_url,
              value: s.total_stars,
              is_current_user: user?.id === s.user_id
            };
          });

        setLeaderboard(leaderboardData);

        // Check current user rank
        if (user) {
          const currentInTop = leaderboardData.find(u => u.user_id === user.id);
          if (currentInTop) {
            setCurrentUserRank(currentInTop);
          } else {
            // Fetch user's rank
            const { data: userStars } = await supabase
              .from('user_stars')
              .select('total_stars')
              .eq('user_id', user.id)
              .single();

            if (userStars) {
              const { count } = await supabase
                .from('user_stars')
                .select('*', { count: 'exact', head: true })
                .gt('total_stars', userStars.total_stars);

              const { data: userProfile } = await supabase
                .from('profiles')
                .select('display_name, avatar_url')
                .eq('user_id', user.id)
                .single();

              setCurrentUserRank({
                rank: (count || 0) + 1,
                user_id: user.id,
                display_name: userProfile?.display_name || 'Вы',
                avatar_url: userProfile?.avatar_url,
                value: userStars.total_stars,
                is_current_user: true
              });
            }
          }
        }
      } else {
        // Use leaderboard_aggregates for period-specific data
        const { data: aggregates, error } = await supabase
          .from('leaderboard_aggregates')
          .select('*')
          .eq('period_type', period)
          .eq('period_key', periodKey)
          .order(valueColumn, { ascending: false })
          .limit(100);

        if (error) throw error;

        if (!aggregates || aggregates.length === 0) {
          setLeaderboard([]);
          setCurrentUserRank(null);
          setLoading(false);
          return;
        }

        const userIds = aggregates.map(a => a.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url, is_banned')
          .in('user_id', userIds);

        const profilesMap = (profilesData || []).reduce((acc, p) => {
          acc[p.user_id] = p;
          return acc;
        }, {} as Record<string, any>);

        const leaderboardData: LeaderboardEntry[] = aggregates
          .filter(a => {
            const profile = profilesMap[a.user_id];
            return profile && !profile.is_banned;
          })
          .map((a, index) => {
            const profile = profilesMap[a.user_id] || {};
            return {
              rank: index + 1,
              user_id: a.user_id,
              display_name: profile.display_name || 'Пользователь',
              avatar_url: profile.avatar_url,
              value: (a as any)[valueColumn] || 0,
              is_current_user: user?.id === a.user_id
            };
          });

        setLeaderboard(leaderboardData);

        // Check current user rank
        if (user) {
          const currentInTop = leaderboardData.find(u => u.user_id === user.id);
          setCurrentUserRank(currentInTop || null);
        }
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, [user, period, type, getPeriodKey, getValueColumn]);

  // Update user's aggregate when activity happens
  const updateUserAggregate = useCallback(async (
    incrementType: 'stars' | 'likes' | 'habits' | 'tasks',
    amount: number = 1
  ) => {
    if (!user) return;

    const now = new Date();
    const periods: { type: LeaderboardPeriod; key: string }[] = [
      { type: 'today', key: format(now, 'yyyy-MM-dd') },
      { type: 'month', key: format(startOfMonth(now), 'yyyy-MM') },
      { type: 'year', key: format(startOfYear(now), 'yyyy') },
      { type: 'all', key: 'all' },
    ];

    for (const p of periods) {
      const updateData: Record<string, any> = {};
      
      switch (incrementType) {
        case 'stars':
          updateData.total_stars = amount;
          updateData.total_activity_score = amount;
          break;
        case 'likes':
          updateData.total_likes = amount;
          updateData.total_activity_score = amount;
          break;
        case 'habits':
          updateData.habits_completed = amount;
          updateData.total_activity_score = amount * 2;
          break;
        case 'tasks':
          updateData.tasks_completed = amount;
          updateData.total_activity_score = amount * 2;
          break;
      }

      // Upsert with increment
      const { data: existing } = await supabase
        .from('leaderboard_aggregates')
        .select('*')
        .eq('user_id', user.id)
        .eq('period_type', p.type)
        .eq('period_key', p.key)
        .single();

      if (existing) {
        const updates: Record<string, number> = {};
        for (const [key, val] of Object.entries(updateData)) {
          updates[key] = ((existing as any)[key] || 0) + val;
        }
        
        await supabase
          .from('leaderboard_aggregates')
          .update(updates)
          .eq('id', existing.id);
      } else {
        await supabase
          .from('leaderboard_aggregates')
          .insert({
            user_id: user.id,
            period_type: p.type,
            period_key: p.key,
            ...updateData,
          });
      }
    }
  }, [user]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    leaderboard,
    currentUserRank,
    loading,
    period,
    setPeriod,
    type,
    setType,
    refetch: fetchLeaderboard,
    updateUserAggregate,
  };
}
