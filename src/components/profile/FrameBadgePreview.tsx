import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AVATAR_FRAMES } from '@/components/rewards/UserAvatarWithFrame';
import { USER_BADGES } from '@/components/rewards/UserBadges';

interface FrameBadgePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  avatarUrl?: string | null;
  displayName?: string | null;
  previewFrameId?: string | null;
  previewBadgeIds?: string[];
  isRussian?: boolean;
}

export function FrameBadgePreview({
  open,
  onOpenChange,
  avatarUrl,
  displayName,
  previewFrameId,
  previewBadgeIds = [],
  isRussian = true,
}: FrameBadgePreviewProps) {
  const frame = previewFrameId ? AVATAR_FRAMES[previewFrameId] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[300px]">
        <DialogHeader>
          <DialogTitle className="text-center">
            {isRussian ? 'Предпросмотр' : 'Preview'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-6">
          {/* Avatar with frame */}
          <div className="relative">
            <Avatar 
              className={cn(
                "w-24 h-24 transition-all",
                frame?.className,
                frame?.animationClass
              )}
            >
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="text-2xl">
                {displayName?.[0]?.toUpperCase() || <User className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Display name */}
          <p className="font-semibold text-lg">{displayName || 'User'}</p>

          {/* Badges */}
          {previewBadgeIds.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap justify-center">
              {previewBadgeIds.map((badgeId) => {
                const badge = USER_BADGES[badgeId];
                if (!badge) return null;
                return (
                  <Badge
                    key={badgeId}
                    variant="outline"
                    className={cn("px-2 py-1", badge.className)}
                  >
                    <span className="mr-1">{badge.emoji}</span>
                    {badge.name}
                  </Badge>
                );
              })}
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            {isRussian 
              ? 'Так будет выглядеть ваш профиль в рейтинге и ленте'
              : 'This is how your profile will appear in ratings and feed'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
