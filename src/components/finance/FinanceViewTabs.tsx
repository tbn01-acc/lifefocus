import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/contexts/LanguageContext';

export type FinanceViewType = 'transactions' | 'calendar' | 'progress';

interface FinanceViewTabsProps {
  value: FinanceViewType;
  onValueChange: (value: FinanceViewType) => void;
}

export function FinanceViewTabs({ value, onValueChange }: FinanceViewTabsProps) {
  const { t } = useTranslation();

  return (
    <Tabs value={value} onValueChange={(v) => onValueChange(v as FinanceViewType)}>
      <TabsList className="grid w-full grid-cols-3 bg-muted/50">
        <TabsTrigger 
          value="transactions" 
          className="data-[state=active]:bg-finance data-[state=active]:text-white"
        >
          {t('transactions')}
        </TabsTrigger>
        <TabsTrigger 
          value="calendar" 
          className="data-[state=active]:bg-finance data-[state=active]:text-white"
        >
          {t('calendar')}
        </TabsTrigger>
        <TabsTrigger 
          value="progress" 
          className="data-[state=active]:bg-finance data-[state=active]:text-white"
        >
          {t('progress')}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
