import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useTeamRole() {
  const { user } = useAuth();
  const [isTeam, setIsTeam] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkTeamRole = async () => {
      if (!user) {
        setIsTeam(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'team')
          .single();

        setIsTeam(!!data && !error);
      } catch {
        setIsTeam(false);
      } finally {
        setLoading(false);
      }
    };

    checkTeamRole();
  }, [user]);

  const assignTeamRole = useCallback(async (userId: string) => {
    try {
      // Assign team role
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: 'team',
        }, { onConflict: 'user_id,role' });

      if (roleError) throw roleError;

      // Grant PRO subscription
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan: 'pro',
          period: 'lifetime',
          started_at: new Date().toISOString(),
          expires_at: null, // Lifetime
          bonus_days: 0,
        }, { onConflict: 'user_id' });

      if (subError) throw subError;

      return true;
    } catch (e) {
      console.error('Error assigning team role:', e);
      return false;
    }
  }, []);

  const removeTeamRole = useCallback(async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'team');

      if (error) throw error;

      // Downgrade to free plan
      await supabase
        .from('subscriptions')
        .update({ plan: 'free', period: null, expires_at: new Date().toISOString() })
        .eq('user_id', userId);

      return true;
    } catch (e) {
      console.error('Error removing team role:', e);
      return false;
    }
  }, []);

  return {
    isTeam,
    loading,
    assignTeamRole,
    removeTeamRole,
  };
}
