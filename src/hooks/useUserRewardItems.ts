import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserRewardItems {
  frames: string[];
  badges: string[];
  avatars: string[];
  icons: string[];
  activeFrame: string | null;
  activeBadges: string[];
}

export function useUserRewardItems(userId?: string) {
  const [items, setItems] = useState<UserRewardItems>({
    frames: [],
    badges: [],
    avatars: [],
    icons: [],
    activeFrame: null,
    activeBadges: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('purchased_rewards')
        .select('reward_id, is_used, rewards_shop!inner(reward_type, reward_value)')
        .eq('user_id', userId);

      if (data) {
        const frames: string[] = [];
        const badges: string[] = [];
        const avatars: string[] = [];
        const icons: string[] = [];
        let activeFrame: string | null = null;
        const activeBadges: string[] = [];

        data.forEach((pr: any) => {
          const rewardType = pr.rewards_shop?.reward_type;
          const rewardValue = pr.rewards_shop?.reward_value as Record<string, string>;
          
          if (rewardType === 'frame' && rewardValue?.frame_id) {
            frames.push(rewardValue.frame_id);
            // If marked as "used", it's the active one
            if (pr.is_used) {
              activeFrame = rewardValue.frame_id;
            }
          } else if (rewardType === 'badge' && rewardValue?.badge_id) {
            badges.push(rewardValue.badge_id);
            // If used, add to active badges
            if (pr.is_used) {
              activeBadges.push(rewardValue.badge_id);
            }
          } else if (rewardType === 'avatar' && rewardValue?.avatar_id) {
            avatars.push(rewardValue.avatar_id);
          } else if (rewardType === 'icon' && rewardValue?.icon_id) {
            icons.push(rewardValue.icon_id);
          }
        });

        setItems({ frames, badges, avatars, icons, activeFrame, activeBadges });
      }
    } catch (err) {
      console.error('Error fetching user reward items:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { items, loading, refetch: fetchItems };
}

// Cache for multiple users' reward items (for leaderboard)
const userRewardsCache = new Map<string, UserRewardItems>();

export async function fetchUserRewardItemsBatch(userIds: string[]): Promise<Map<string, UserRewardItems>> {
  const results = new Map<string, UserRewardItems>();
  
  // Filter out already cached users
  const uncachedIds = userIds.filter(id => !userRewardsCache.has(id));
  
  // Return cached results for already fetched users
  userIds.forEach(id => {
    if (userRewardsCache.has(id)) {
      results.set(id, userRewardsCache.get(id)!);
    }
  });

  if (uncachedIds.length === 0) {
    return results;
  }

  try {
    const { data } = await supabase
      .from('purchased_rewards')
      .select('user_id, reward_id, is_used, rewards_shop!inner(reward_type, reward_value)')
      .in('user_id', uncachedIds);

    // Initialize empty items for all uncached users
    uncachedIds.forEach(id => {
      const empty: UserRewardItems = {
        frames: [],
        badges: [],
        avatars: [],
        icons: [],
        activeFrame: null,
        activeBadges: [],
      };
      results.set(id, empty);
      userRewardsCache.set(id, empty);
    });

    if (data) {
      // Group by user_id
      const byUser: Record<string, typeof data> = {};
      data.forEach(item => {
        if (!byUser[item.user_id]) byUser[item.user_id] = [];
        byUser[item.user_id].push(item);
      });

      // Process each user's items
      Object.entries(byUser).forEach(([userId, items]) => {
        const userItems: UserRewardItems = {
          frames: [],
          badges: [],
          avatars: [],
          icons: [],
          activeFrame: null,
          activeBadges: [],
        };

        items.forEach((pr: any) => {
          const rewardType = pr.rewards_shop?.reward_type;
          const rewardValue = pr.rewards_shop?.reward_value as Record<string, string>;
          
          if (rewardType === 'frame' && rewardValue?.frame_id) {
            userItems.frames.push(rewardValue.frame_id);
            if (pr.is_used) {
              userItems.activeFrame = rewardValue.frame_id;
            }
          } else if (rewardType === 'badge' && rewardValue?.badge_id) {
            userItems.badges.push(rewardValue.badge_id);
            if (pr.is_used) {
              userItems.activeBadges.push(rewardValue.badge_id);
            }
          } else if (rewardType === 'avatar' && rewardValue?.avatar_id) {
            userItems.avatars.push(rewardValue.avatar_id);
          } else if (rewardType === 'icon' && rewardValue?.icon_id) {
            userItems.icons.push(rewardValue.icon_id);
          }
        });

        results.set(userId, userItems);
        userRewardsCache.set(userId, userItems);
      });
    }
  } catch (err) {
    console.error('Error fetching batch user reward items:', err);
  }

  return results;
}
