import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, Upload, Loader2, HardDrive, CloudOff } from 'lucide-react';
import { useLocalBackup } from '@/hooks/useLocalBackup';
import { useSubscription } from '@/hooks/useSubscription';
import { useTranslation } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function BackupSection() {
  const { language } = useTranslation();
  const { createBackup, handleFileSelect, isCreating, isRestoring } = useLocalBackup();
  const { isProActive } = useSubscription();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isRussian = language === 'ru';

  return (
    <div className="space-y-4">
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

      {/* Cloud Backup (PRO only) */}
      <Card className={!isProActive ? 'opacity-60' : ''}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              {isProActive ? (
                <CloudOff className="w-5 h-5 text-purple-500" />
              ) : (
                <CloudOff className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-foreground">
                  {isRussian ? 'Облачный бэкап' : 'Cloud Backup'}
                </h3>
                {!isProActive && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {isProActive 
                  ? (isRussian ? 'Автоматические бэкапы на 7 дней' : 'Automatic backups for 7 days')
                  : (isRussian ? 'Доступно только для PRO' : 'Available for PRO only')}
              </p>
            </div>
          </div>

          {isProActive ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {isRussian ? 'Последний бэкап:' : 'Last backup:'}
                </span>
                <span className="text-foreground">
                  {isRussian ? 'Сегодня, 12:00' : 'Today, 12:00 PM'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {isRussian ? 'Хранится копий:' : 'Stored copies:'}
                </span>
                <span className="text-foreground">7 / 7</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          ) : (
            <Button variant="outline" className="w-full" disabled>
              {isRussian ? 'Перейти на PRO' : 'Upgrade to PRO'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
