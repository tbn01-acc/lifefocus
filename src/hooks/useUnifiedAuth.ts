import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { supabase } from '../lib/supabase';

export const useUnifiedAuth = () => {
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const runAuth = async () => {
      if (!WebApp.initData) { // Обычный браузер / PWA
        setIsLoading(false);
        return;
      }

      WebApp.ready();
      
      // Проверка прав на сообщения (условие 1.1 + доп. требование)
      const checkAccess = () => {
        const hasAccess = WebApp.initDataUnsafe?.user?.allows_write_to_pm;
        if (!hasAccess) {
          WebApp.requestWriteAccess((allowed) => {
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

      const login = async () => {
        try {
          const { data } = await supabase.functions.invoke('telegram-auth', {
            body: { initData: WebApp.initData }
          });
          if (data?.access_token) {
            await supabase.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token });
          }
        } catch (e) {
          console.error("Auth error", e);
        } finally {
          setIsLoading(false);
        }
      };

      checkAccess();
    };

    runAuth();
  }, []);

  return { isAccessDenied, isLoading };
};
