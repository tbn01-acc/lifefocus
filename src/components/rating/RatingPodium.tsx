import React from 'react';
import { Star, Heart, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserRewardItems } from '@/hooks/useUserRewardItems';

interface PodiumUser {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_stars: number;
  likes_count?: number;
  referrals_count?: number;
  rank: number;
}

interface RatingPodiumProps {
  users: PodiumUser[];
  userRewards: Map<string, UserRewardItems>;
  type: 'stars' | 'likes' | 'referrals';
  isRussian: boolean;
  onUserClick: (userId: string) => void;
}

export function RatingPodium({ users, userRewards, type, isRussian, onUserClick }: RatingPodiumProps) {
  const top3 = users.slice(0, 3);
  
  // Reorder for podium: [2nd, 1st, 3rd]
  const podiumOrder = top3.length >= 3 
    ? [top3[1], top3[0], top3[2]]
    : top3;

  const getValue = (user: PodiumUser) => {
    switch (type) {
      case 'likes':
        return user.likes_count ?? 0;
      case 'referrals':
        return user.referrals_count ?? 0;
      default:
        return user.total_stars;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'likes':
        return <Heart className="h-3 w-3 fill-pink-500 text-pink-500" />;
      case 'referrals':
        return <Users className="h-3 w-3 text-blue-500" />;
      default:
        return <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-500 text-black';
      case 2: return 'bg-gray-400 text-black';
      case 3: return 'bg-amber-600 text-white';
      default: return 'bg-muted text-foreground';
    }
  };

  // Size for avatars: 1st place is 1.5x bigger
  const getAvatarSize = (rank: number) => {
    if (rank === 1) return 'w-24 h-24'; // 96px
    return 'w-16 h-16'; // 64px
  };

  const getBadgeSize = (rank: number) => {
    if (rank === 1) return 'w-8 h-8 text-sm';
    return 'w-6 h-6 text-xs';
  };

  if (top3.length === 0) return null;

  return (
    <div className="mb-6">
      {/* Top 3 - Aligned to bottom */}
      <div className="flex items-end justify-center gap-4 mb-4">
        {podiumOrder.map((user, index) => {
          if (!user) return null;
          const actualRank = user.rank;
          
          return (
            <motion.div
              key={user.user_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center cursor-pointer"
              onClick={() => onUserClick(user.user_id)}
            >
              {/* Square Avatar with rounded corners */}
              <div className="relative">
                <Avatar className={`${getAvatarSize(actualRank)} rounded-xl`}>
                  <AvatarImage 
                    src={user.avatar_url || undefined} 
                    alt={user.display_name}
                    className="object-cover rounded-xl"
                  />
                  <AvatarFallback className="rounded-xl bg-muted text-muted-foreground text-lg">
                    {user.display_name?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                
                {/* Rank badge - centered at bottom edge */}
                <div 
                  className={`absolute left-1/2 -translate-x-1/2 -bottom-3 ${getBadgeSize(actualRank)} rounded-full flex items-center justify-center font-bold ${getRankBadgeColor(actualRank)} shadow-lg`}
                >
                  {actualRank}
                </div>
              </div>

              {/* Name */}
              <p className="text-xs font-medium text-center max-w-[80px] truncate mt-4 mb-1">
                {user.display_name}
              </p>

              {/* Value */}
              <div className="flex items-center gap-1 text-sm font-semibold">
                {getIcon()}
                {getValue(user).toLocaleString()}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
