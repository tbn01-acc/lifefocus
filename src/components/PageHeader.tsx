import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/contexts/LanguageContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ShareButtons } from '@/components/ShareButtons';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PageHeaderProps {
  showTitle?: boolean;
  icon?: React.ReactNode;
  iconBgClass?: string;
  title?: string;
  subtitle?: React.ReactNode;
  rightAction?: React.ReactNode;
}

export function PageHeader({ showTitle = false, icon, iconBgClass, title, subtitle, rightAction }: PageHeaderProps) {
  const { t } = useTranslation();
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return t('goodNight');
    if (hour < 12) return t('goodMorning');
    if (hour < 18) return t('goodAfternoon');
    return t('goodEvening');
  };

  const userName = profile?.display_name || user?.email?.split('@')[0] || t('guest');

  return (
    <div className="mb-6">
      {/* Controls Row - Top */}
      <div className="flex items-center justify-between mb-3">
        <ShareButtons />
        <div className="flex items-center gap-1">
          <LanguageSelector />
          <ThemeToggle />
        </div>
      </div>

      {/* Greeting with Avatar */}
      <div className="flex items-center gap-3 mb-4">
        <button 
          onClick={() => navigate('/profile')}
          className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full"
        >
          <Avatar className="w-12 h-12 border-2 border-primary/20 hover:border-primary/50 transition-colors cursor-pointer">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {(profile?.display_name || user?.email || 'G')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </button>
        <p className="text-lg font-medium text-foreground">
          {getGreeting()}, {userName}!
        </p>
      </div>

      {/* Optional Page Title with Icon */}
      {showTitle && icon && title && (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBgClass || ''}`}>
            {icon}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
            {subtitle && <div className="text-sm text-muted-foreground">{subtitle}</div>}
          </div>
          {rightAction}
        </div>
      )}
    </div>
  );
}