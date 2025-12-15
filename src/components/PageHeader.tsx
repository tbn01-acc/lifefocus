import { useTranslation } from '@/contexts/LanguageContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ShareButtons } from '@/components/ShareButtons';

interface PageHeaderProps {
  icon: React.ReactNode;
  iconBgClass: string;
  title: string;
  subtitle: string;
}

export function PageHeader({ icon, iconBgClass, title, subtitle }: PageHeaderProps) {
  const { t } = useTranslation();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return t('goodNight');
    if (hour < 12) return t('goodMorning');
    if (hour < 18) return t('goodAfternoon');
    return t('goodEvening');
  };

  const dateString = new Date().toLocaleDateString('ru-RU', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  return (
    <div className="mb-6">
      {/* Greeting and Controls Row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-lg font-medium text-foreground">{getGreeting()}</p>
          <p className="text-sm text-muted-foreground capitalize">{dateString}</p>
        </div>
        <div className="flex items-center gap-1">
          <LanguageSelector />
          <ThemeToggle />
        </div>
      </div>

      {/* Share Buttons */}
      <div className="mb-4">
        <ShareButtons />
      </div>

      {/* Page Title with Icon */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBgClass}`}>
          {icon}
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
