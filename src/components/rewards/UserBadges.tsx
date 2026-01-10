import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface UserBadge {
  id: string;
  emoji: string;
  name: string;
  className: string;
}

// Badge definitions
export const USER_BADGES: Record<string, UserBadge> = {
  star_badge: {
    id: 'star_badge',
    emoji: '⭐',
    name: 'Звезда',
    className: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  },
  fire_badge: {
    id: 'fire_badge',
    emoji: '🔥',
    name: 'В огне',
    className: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
  },
  diamond_badge: {
    id: 'diamond_badge',
    emoji: '💎',
    name: 'Бриллиант',
    className: 'bg-cyan-500/20 text-cyan-500 border-cyan-500/30',
  },
  crown_badge: {
    id: 'crown_badge',
    emoji: '👑',
    name: 'Корона',
    className: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
  },
};

interface UserBadgesProps {
  badgeIds: string[];
  maxDisplay?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function UserBadges({ 
  badgeIds, 
  maxDisplay = 3, 
  size = 'sm',
  className 
}: UserBadgesProps) {
  const displayBadges = badgeIds.slice(0, maxDisplay);
  const remainingCount = badgeIds.length - maxDisplay;

  if (displayBadges.length === 0) return null;

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-0.5", className)}>
        {displayBadges.map((badgeId) => {
          const badge = USER_BADGES[badgeId];
          if (!badge) return null;
          
          return (
            <Tooltip key={badgeId}>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className={cn(
                    "px-1 py-0 border",
                    size === 'sm' ? 'text-xs' : 'text-sm',
                    badge.className
                  )}
                >
                  {badge.emoji}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{badge.name}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
        
        {remainingCount > 0 && (
          <Badge variant="outline" className="px-1 py-0 text-xs">
            +{remainingCount}
          </Badge>
        )}
      </div>
    </TooltipProvider>
  );
}
