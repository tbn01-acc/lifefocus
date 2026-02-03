import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useUnifiedAuth = () => {
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const runAuth = async () => {
      // Check if running in Telegram WebApp context
      const telegram = (window as any).Telegram;
      const isTelegramWebApp = telegram?.WebApp?.initData;

      if (!isTelegramWebApp) {
        // Regular browser / PWA - use standard Supabase auth
        setIsLoading(false);
        return;
      }

      const WebApp = telegram.WebApp;
      WebApp.ready?.();
      
      // Check message write access
      const hasAccess = WebApp.initDataUnsafe?.user?.allows_write_to_pm;
      
      const login = async () => {
        try {
          const { data } = await supabase.functions.invoke('telegram-auth', {
            body: { initData: WebApp.initData }
          });
          if (data?.access_token) {
            await supabase.auth.setSession({ 
              access_token: data.access_token, 
              refresh_token: data.refresh_token 
            });
          }
        } catch (e) {
          console.error("Auth error", e);
        } finally {
          setIsLoading(false);
        }
      };

      if (!hasAccess && WebApp.requestWriteAccess) {
        WebApp.requestWriteAccess((allowed: boolean) => {
          if (allowed) {
            setIsAccessDenied(false);
            login();
          } else {
            setIsAccessDenied(true);
            setIsLoading(false);
          }
        });
      } else {
        login();
      }
    };

    runAuth();
  }, []);

  return { isAccessDenied, isLoading };
};