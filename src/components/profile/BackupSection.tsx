import { useRef } from 'react';
import { Download, Upload, Loader2, HardDrive, Cloud, RefreshCw } from 'lucide-react';
import { useLocalBackup } from '@/hooks/useLocalBackup';
import { useSubscription } from '@/hooks/useSubscription';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import { useTranslation } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function BackupSection() {
  const { language } = useTranslation();
  const { createBackup, handleFileSelect, isCreating, isRestoring } = useLocalBackup();
  const { isProActive } = useSubscription();
  const { syncAll, isSyncing, lastSyncTime } = useSupabaseSync();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isRussian = language === 'ru';
  const isPro = isProActive;

  const formatLastSync = () => {
    if (!lastSyncTime) return isRussian ? 'Никогда' : 'Never';
    const date = new Date(lastSyncTime);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return isRussian ? 'Только что' : 'Just now';
    if (diffMins < 60) return isRussian ? `${diffMins} мин. назад` : `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return isRussian ? `${diffHours} ч. назад` : `${diffHours}h ago`;
    
    return date.toLocaleDateString(isRussian ? 'ru-RU' : 'en-US', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  return (
    <div className="space-y-4">
      {/* Cloud Sync (PRO only) */}
      <Card className={!isPro ? 'opacity-60' : ''}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Cloud className={`w-5 h-5 ${isPro ? 'text-purple-500' : 'text-muted-foreground'}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-foreground">
                  {isRussian ? 'Облачная синхронизация' : 'Cloud Sync'}
                </h3>
                {!isPro && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {isPro 
                  ? (isRussian ? 'Синхронизация между устройствами' : 'Sync across devices')
                  : (isRussian ? 'Доступно только для PRO' : 'Available for PRO only')}
              </p>
            </div>
          </div>

          {isPro ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {isRussian ? 'Последняя синхронизация:' : 'Last sync:'}
                </span>
                <span className="text-foreground font-medium">
                  {formatLastSync()}
                </span>
              </div>
              
              <Button 
                onClick={() => syncAll(true)} 
                disabled={isSyncing}
                className="w-full gap-2"
                variant="outline"
              >
                {isSyncing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {isRussian ? 'Синхронизировать' : 'Sync now'}
              </Button>
            </div>
          ) : (
            <Button variant="outline" className="w-full" disabled>
              {isRussian ? 'Перейти на PRO' : 'Upgrade to PRO'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Local Backup */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground">
                {isRussian ? 'Локальный бэкап' : 'Local Backup'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isRussian ? 'Сохранить данные на устройство' : 'Save data to device'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={createBackup}
              disabled={isCreating}
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isRussian ? 'Создать' : 'Create'}
            </Button>
            
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={isRestoring}
            >
              {isRestoring ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isRussian ? 'Восстановить' : 'Restore'}
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
