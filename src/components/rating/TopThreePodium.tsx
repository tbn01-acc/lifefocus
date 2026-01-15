import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { UserAvatarWithFrame } from '@/components/rewards/UserAvatarWithFrame';
import { UserRewardItems } from '@/hooks/useUserRewardItems';

interface TopThreeUser {
  rank: number;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  value: number;
  is_current_user: boolean;
}

interface TopThreePodiumProps {
  users: TopThreeUser[];
  userRewards: Map<string, UserRewardItems>;
  onUserClick: (userId: string) => void;
  valueIcon: React.ReactNode;
}

export function TopThreePodium({ users, userRewards, onUserClick, valueIcon }: TopThreePodiumProps) {
  if (users.length === 0) return null;

  // Reorder to show: 2nd, 1st, 3rd
  const orderedUsers = [
    users.find(u => u.rank === 2),
    users.find(u => u.rank === 1),
    users.find(u => u.rank === 3),
  ].filter(Boolean) as TopThreeUser[];

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-500';
      case 2: return 'bg-gray-400';
      case 3: return 'bg-amber-600';
      default: return 'bg-muted';
    }
  };

  const getSize = (rank: number) => {
    return rank === 1 ? 'w-20 h-20' : 'w-14 h-14';
  };

  return (
    <div className="flex items-end justify-center gap-3 mb-6">
      {orderedUsers.map((user, index) => (
        <motion.div
          key={user.user_id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex flex-col items-center cursor-pointer"
          onClick={() => onUserClick(user.user_id)}
        >
          <div className="relative">
            {/* Avatar with rounded corners (square-ish) */}
            <div 
              className={`${getSize(user.rank)} rounded-xl overflow-hidden ring-2 ${
                user.is_current_user ? 'ring-primary' : 'ring-border'
              }`}
            >
              {user.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt={user.display_name || ''} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <User className={user.rank === 1 ? 'w-8 h-8' : 'w-5 h-5'} />
                </div>
              )}
            </div>
            
            {/* Rank badge at bottom center */}
            <div 
              className={`absolute -bottom-2 left-1/2 -translate-x-1/2 ${getRankColor(user.rank)} rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
                user.rank === 1 ? 'w-7 h-7 text-sm' : 'w-5 h-5 text-xs'
              }`}
            >
              {user.rank}
            </div>
          </div>
          
          {/* Name */}
          <p className={`mt-3 text-center truncate max-w-[80px] ${
            user.rank === 1 ? 'font-semibold text-sm' : 'text-xs text-muted-foreground'
          }`}>
            {user.display_name || 'Пользователь'}
          </p>
          
          {/* Value */}
          <div className={`flex items-center gap-1 ${
            user.rank === 1 ? 'text-base font-bold' : 'text-sm'
          }`}>
            {valueIcon}
            {user.value}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
