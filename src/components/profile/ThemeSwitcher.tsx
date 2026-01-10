import { useState } from 'react';
import { Palette, RotateCcw, Check, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';
import { useCustomTheme, CUSTOM_THEMES } from '@/hooks/useCustomTheme';
import { useTheme } from '@/hooks/useTheme';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function ThemeSwitcher() {
  const { language } = useTranslation();
  const isRussian = language === 'ru';
  const { theme, toggleTheme } = useTheme();
  const { 
    activeThemeId, 
    ownedThemes, 
    themes, 
    applyTheme, 
    resetTheme, 
    isThemeOwned 
  } = useCustomTheme();
  
  const [showDialog, setShowDialog] = useState(false);

  const handleResetTheme = () => {
    resetTheme();
    toast.success(isRussian ? 'Тема сброшена' : 'Theme reset');
  };

  const handleApplyTheme = (themeId: string) => {
    const success = applyTheme(themeId);
    if (success) {
      toast.success(isRussian ? 'Тема применена!' : 'Theme applied!');
      setShowDialog(false);
    } else {
      toast.error(isRussian ? 'У вас нет этой темы' : "You don't own this theme");
    }
  };

  const currentTheme = themes.find(t => t.id === activeThemeId);
  const ownedThemesList = themes.filter(t => isThemeOwned(t.id));

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Palette className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            {isRussian ? 'Оформление' : 'Appearance'}
          </h2>
        </div>

        <Card>
          <CardContent className="p-0">
            {/* Current Theme Display */}
            <button
              onClick={() => ownedThemesList.length > 0 && setShowDialog(true)}
              className="w-full flex items-center justify-between p-4 border-b border-border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-lg"
                  style={{
                    background: currentTheme 
                      ? `hsl(${currentTheme.cssVariables['--primary']})`
                      : 'hsl(var(--primary))'
                  }}
                />
                <div className="text-left">
                  <span className="text-sm font-medium block">
                    {isRussian ? 'Текущая тема' : 'Current Theme'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {currentTheme ? currentTheme.name : (isRussian ? 'Стандартная' : 'Default')}
                  </span>
                </div>
              </div>
              {ownedThemesList.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {ownedThemesList.length} {isRussian ? 'тем' : 'themes'}
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </button>

            {/* Dark/Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between p-4 border-b border-border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  theme === 'dark' ? 'bg-slate-800' : 'bg-amber-100'
                )}>
                  {theme === 'dark' ? '🌙' : '☀️'}
                </div>
                <span className="text-sm font-medium">
                  {isRussian ? 'Режим' : 'Mode'}: {theme === 'dark' ? (isRussian ? 'Тёмный' : 'Dark') : (isRussian ? 'Светлый' : 'Light')}
                </span>
              </div>
            </button>

            {/* Reset Theme Button */}
            {activeThemeId && (
              <Button
                variant="ghost"
                className="w-full justify-start p-4 h-auto rounded-none text-muted-foreground hover:text-foreground"
                onClick={handleResetTheme}
              >
                <RotateCcw className="w-4 h-4 mr-3" />
                {isRussian ? 'Сбросить тему' : 'Reset Theme'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Theme Selection Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isRussian ? 'Выберите тему' : 'Choose Theme'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-2 mt-4">
            {/* Default Theme Option */}
            <button
              onClick={() => {
                resetTheme();
                toast.success(isRussian ? 'Стандартная тема применена' : 'Default theme applied');
                setShowDialog(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg border transition-all",
                !activeThemeId 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              )}
            >
              <div 
                className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent"
              />
              <div className="flex-1 text-left">
                <p className="font-medium">{isRussian ? 'Стандартная' : 'Default'}</p>
                <p className="text-xs text-muted-foreground">
                  {isRussian ? 'Системная тема' : 'System theme'}
                </p>
              </div>
              {!activeThemeId && (
                <Check className="w-5 h-5 text-primary" />
              )}
            </button>

            {/* Owned Themes */}
            {ownedThemesList.map((themeItem) => (
              <button
                key={themeItem.id}
                onClick={() => handleApplyTheme(themeItem.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg border transition-all",
                  activeThemeId === themeItem.id 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50"
                )}
              >
                <div 
                  className="w-10 h-10 rounded-lg"
                  style={{
                    background: `linear-gradient(135deg, hsl(${themeItem.cssVariables['--primary']}), hsl(${themeItem.cssVariables['--accent']}))`
                  }}
                />
                <div className="flex-1 text-left">
                  <p className="font-medium">{themeItem.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {themeItem.isDark ? (isRussian ? 'Тёмная' : 'Dark') : (isRussian ? 'Светлая' : 'Light')}
                  </p>
                </div>
                {activeThemeId === themeItem.id && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </button>
            ))}

            {ownedThemesList.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <Palette className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {isRussian ? 'У вас пока нет купленных тем' : 'You have no purchased themes yet'}
                </p>
                <p className="text-xs mt-1">
                  {isRussian ? 'Купите темы в магазине наград' : 'Buy themes in the rewards shop'}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
