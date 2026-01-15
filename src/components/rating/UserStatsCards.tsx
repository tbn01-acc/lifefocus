import React from 'react';
import { Star, ChevronRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

interface UserStatsCardsProps {
  userStars: number;
  userRank: number | null;
  isRussian: boolean;
}

export function UserStatsCards({ userStars, userRank, isRussian }: UserStatsCardsProps) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-3 gap-2 mb-6">
      {/* Balance Card */}
      <Card 
        className="cursor-pointer hover:bg-accent/50 transition-colors border-yellow-500/30"
        onClick={() => navigate('/star-history')}
      >
        <CardContent className="p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
          </div>
          <p className="text-sm font-bold text-yellow-500">{userStars}</p>
          <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5 whitespace-nowrap">
            {isRussian ? 'Баланс' : 'Balance'}
            <ChevronRight className="h-2.5 w-2.5" />
          </p>
        </CardContent>
      </Card>

      {/* Rank Card */}
      <Card className="border-muted">
        <CardContent className="p-2 text-center">
          <p className="text-sm font-bold mt-1">#{userRank || '—'}</p>
          <p className="text-[10px] text-muted-foreground whitespace-nowrap">
            {isRussian ? 'Позиция' : 'Position'}
          </p>
        </CardContent>
      </Card>

      {/* Earn Card - navigates to Star Program */}
      <Card 
        className="cursor-pointer hover:bg-accent/50 transition-colors border-yellow-500/30"
        onClick={() => navigate('/achievements?tab=star-program')}
      >
        <CardContent className="p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Sparkles className="h-3 w-3 text-yellow-500" />
          </div>
          <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5 whitespace-nowrap">
            {isRussian ? 'Заработать' : 'Earn'}
            <ChevronRight className="h-2.5 w-2.5" />
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
