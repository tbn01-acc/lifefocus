import { Crown, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/contexts/LanguageContext';

interface LimitWarningProps {
  current: number;
  max: number;
  type: 'habits' | 'tasks' | 'transactions';
}

export function LimitWarning({ current, max, type }: LimitWarningProps) {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const isRussian = language === 'ru';

  const isAtLimit = current >= max;
  const isNearLimit = current >= max - 1 && current < max;

  if (!isAtLimit && !isNearLimit) return null;

  const typeLabels = {
    habits: isRussian ? 'привычек' : 'habits',
    tasks: isRussian ? 'задач' : 'tasks',
    transactions: isRussian ? 'операций' : 'transactions',
  };

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg mb-4 ${
      isAtLimit 
        ? 'bg-destructive/10 border border-destructive/30' 
        : 'bg-amber-500/10 border border-amber-500/30'
    }`}>
      <div className="flex items-center gap-2">
        <AlertTriangle className={`w-4 h-4 ${isAtLimit ? 'text-destructive' : 'text-amber-500'}`} />
        <span className={`text-sm ${isAtLimit ? 'text-destructive' : 'text-amber-500'}`}>
          {isAtLimit 
            ? (isRussian 
                ? `Достигнут лимит: ${current}/${max} ${typeLabels[type]}` 
                : `Limit reached: ${current}/${max} ${typeLabels[type]}`)
            : (isRussian 
                ? `Почти лимит: ${current}/${max} ${typeLabels[type]}` 
                : `Near limit: ${current}/${max} ${typeLabels[type]}`)}
        </span>
      </div>
      <Button 
        size="sm" 
        variant="outline"
        className="gap-1 text-xs border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
        onClick={() => navigate('/upgrade')}
      >
        <Crown className="w-3 h-3" />
        PRO
      </Button>
    </div>
  );
}

interface LimitBadgeProps {
  current: number;
  max: number;
}

export function LimitBadge({ current, max }: LimitBadgeProps) {
  const isAtLimit = current >= max;
  const isNearLimit = current >= max - 1;

  if (max === Infinity) return null;

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${
      isAtLimit 
        ? 'bg-destructive/20 text-destructive' 
        : isNearLimit 
          ? 'bg-amber-500/20 text-amber-500' 
          : 'bg-muted text-muted-foreground'
    }`}>
      {current}/{max}
    </span>
  );
}
