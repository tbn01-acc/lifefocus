import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Affiliate 2.0 Commission Structure
// Level 1 (1-50 paid referrals): 20% commission + milestone bonuses
// Level 2 (51+ paid referrals): 30% commission + milestone bonuses
// VIP (200+ paid referrals): One-time 5000 RUB bonus + individual terms

interface MilestoneBonus {
  threshold: number;
  bonus: number;
  achieved: boolean;
}

export interface AffiliateStats {
  totalReferrals: number;
  activeReferrals: number;
  paidReferrals: number;
  currentLevel: 1 | 2;
  commissionPercent: number;
  totalEarned: number;
  pendingBalance: number;
  withdrawnTotal: number;
  nextMilestone: MilestoneBonus | null;
  achievedMilestones: MilestoneBonus[];
  isVIP: boolean;
  vipBonusClaimed: boolean;
}

// Level 1 milestones (1-50 paid referrals)
const LEVEL_1_MILESTONES: MilestoneBonus[] = [
  { threshold: 10, bonus: 500, achieved: false },
  { threshold: 20, bonus: 500, achieved: false },
  { threshold: 30, bonus: 500, achieved: false },
  { threshold: 40, bonus: 500, achieved: false },
  { threshold: 50, bonus: 1000, achieved: false },
];

// Level 2 milestones (51+ paid referrals) - every 25 referrals
const getLevel2Milestones = (paidReferrals: number): MilestoneBonus[] => {
  const milestones: MilestoneBonus[] = [];
  let threshold = 75; // 50 + 25
  
  while (threshold <= paidReferrals + 25) {
    milestones.push({
      threshold,
      bonus: 1000,
      achieved: paidReferrals >= threshold
    });
    threshold += 25;
  }
  
  return milestones;
};

export function useAffiliateV2() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);

  const calculateStats = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch referrals
      const { data: referrals } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id);

      const totalReferrals = referrals?.length || 0;
      const activeReferrals = referrals?.filter(r => r.is_active).length || 0;
      const paidReferrals = referrals?.filter(r => r.referred_has_paid).length || 0;

      // Fetch wallet
      const { data: wallet } = await supabase
        .from('user_wallet')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Fetch earnings to check milestone bonuses claimed
      const { data: earnings } = await supabase
        .from('referral_earnings')
        .select('milestone_type, milestone_bonus_rub')
        .eq('referrer_id', user.id)
        .not('milestone_type', 'is', null);

      const claimedMilestones = new Set(
        earnings?.map(e => e.milestone_type) || []
      );

      // Determine level and commission
      const currentLevel = paidReferrals <= 50 ? 1 : 2;
      const commissionPercent = currentLevel === 1 ? 20 : 30;

      // Check VIP status
      const isVIP = paidReferrals >= 200;
      const vipBonusClaimed = claimedMilestones.has('vip_200');

      // Calculate achieved and pending milestones
      let allMilestones: MilestoneBonus[] = [];
      
      if (currentLevel === 1 || paidReferrals <= 50) {
        allMilestones = LEVEL_1_MILESTONES.map(m => ({
          ...m,
          achieved: paidReferrals >= m.threshold && claimedMilestones.has(`milestone_${m.threshold}`)
        }));
      }
      
      if (paidReferrals > 50) {
        allMilestones = [
          ...LEVEL_1_MILESTONES.map(m => ({ ...m, achieved: true })),
          ...getLevel2Milestones(paidReferrals).map(m => ({
            ...m,
            achieved: claimedMilestones.has(`milestone_${m.threshold}`)
          }))
        ];
      }

      const achievedMilestones = allMilestones.filter(m => m.achieved);
      const unachievedMilestones = allMilestones.filter(m => !m.achieved && paidReferrals >= m.threshold);
      const nextMilestone = allMilestones.find(m => !m.achieved && paidReferrals < m.threshold) || null;

      setStats({
        totalReferrals,
        activeReferrals,
        paidReferrals,
        currentLevel: currentLevel as 1 | 2,
        commissionPercent,
        totalEarned: Number(wallet?.total_earned_rub || 0),
        pendingBalance: Number(wallet?.balance_rub || 0),
        withdrawnTotal: Number(wallet?.total_withdrawn_rub || 0),
        nextMilestone,
        achievedMilestones,
        isVIP,
        vipBonusClaimed
      });
    } catch (err) {
      console.error('Error calculating affiliate stats:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  const getProgressToNextMilestone = useCallback(() => {
    if (!stats || !stats.nextMilestone) return { progress: 100, remaining: 0 };
    
    const prevThreshold = stats.achievedMilestones.length > 0
      ? stats.achievedMilestones[stats.achievedMilestones.length - 1].threshold
      : 0;
    
    const range = stats.nextMilestone.threshold - prevThreshold;
    const current = stats.paidReferrals - prevThreshold;
    
    return {
      progress: Math.min(100, (current / range) * 100),
      remaining: stats.nextMilestone.threshold - stats.paidReferrals
    };
  }, [stats]);

  const getConversionBonus = useCallback((amountRub: number) => {
    // 1:1.5 conversion when paying for subscription or gift code
    return amountRub * 1.5;
  }, []);

  const calculatePotentialEarnings = useCallback((
    referralCount: number,
    avgPaymentRub: number,
    paymentsPerYear: number
  ) => {
    // Calculate based on progressive commissions
    let totalEarnings = 0;
    let milestoneBonus = 0;

    for (let i = 1; i <= referralCount; i++) {
      const commission = i <= 50 ? 0.20 : 0.30;
      totalEarnings += avgPaymentRub * commission * paymentsPerYear;

      // Add milestone bonuses
      if (i === 10 || i === 20 || i === 30 || i === 40) {
        milestoneBonus += 500;
      } else if (i === 50) {
        milestoneBonus += 1000;
      } else if (i > 50 && i % 25 === 0) {
        milestoneBonus += 1000;
      }
    }

    // VIP bonus
    if (referralCount >= 200) {
      milestoneBonus += 5000;
    }

    return {
      commissions: totalEarnings,
      milestones: milestoneBonus,
      total: totalEarnings + milestoneBonus
    };
  }, []);

  return {
    stats,
    loading,
    getProgressToNextMilestone,
    getConversionBonus,
    calculatePotentialEarnings,
    refetch: calculateStats
  };
}
