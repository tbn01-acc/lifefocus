import { AlertTriangle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TelegramBlockedScreenProps {
  message?: string;
  onRetry?: () => void;
}

export function TelegramBlockedScreen({ 
  message = 'Для работы приложения необходимо разрешить отправку сообщений',
  onRetry 
}: TelegramBlockedScreenProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // Reload the page to re-trigger permission request
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">Требуется разрешение</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{message}</p>
          
          <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Зачем это нужно?</p>
                <p className="text-muted-foreground">
                  Приложение отправляет напоминания о привычках и задачах прямо в Telegram.
                </p>
              </div>
            </div>
          </div>

          <Button onClick={handleRetry} className="w-full">
            Попробовать снова
          </Button>
          
          <p className="text-xs text-muted-foreground">
            Вы можете изменить это в настройках Telegram в любое время
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default TelegramBlockedScreen;
