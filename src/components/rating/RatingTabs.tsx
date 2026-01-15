import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type RatingType = 'stars' | 'likes' | 'referrals';
export type RatingPeriod = 'today' | 'month' | 'year' | 'all';

interface RatingTabsProps {
  type: RatingType;
  onTypeChange: (type: RatingType) => void;
  period: RatingPeriod;
  onPeriodChange: (period: RatingPeriod) => void;
  isRussian: boolean;
}

export function RatingTabs({ type, onTypeChange, period, onPeriodChange, isRussian }: RatingTabsProps) {
  return (
    <div className="space-y-3">
      {/* Type tabs - Stars/Referrals */}
      <Tabs value={type} onValueChange={(v) => onTypeChange(v as RatingType)}>
        <TabsList className="grid w-full grid-cols-2 h-10 bg-muted/50">
          <TabsTrigger value="stars" className="text-sm gap-2 data-[state=active]:bg-background">
            {isRussian ? 'По звёздам' : 'By stars'}
          </TabsTrigger>
          <TabsTrigger value="referrals" className="text-sm gap-2 data-[state=active]:bg-background">
            {isRussian ? 'По рефералам' : 'By referrals'}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Period tabs - Today, Month, Year, All time */}
      <div className="flex gap-2 border-b border-border overflow-x-auto">
        {([
          { value: 'today', labelRu: 'Сегодня', labelEn: 'Today' },
          { value: 'month', labelRu: 'Месяц', labelEn: 'Month' },
          { value: 'year', labelRu: 'Год', labelEn: 'Year' },
          { value: 'all', labelRu: 'Всё время', labelEn: 'All time' },
        ] as const).map((p) => (
          <button
            key={p.value}
            onClick={() => onPeriodChange(p.value)}
            className={`pb-2 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
              period === p.value
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {isRussian ? p.labelRu : p.labelEn}
          </button>
        ))}
      </div>
    </div>
  );
}
