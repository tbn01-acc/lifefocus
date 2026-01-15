import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSubscription } from './useSubscription';
import { toast } from 'sonner';

interface CloudSettings {
  widget_settings: Record<string, any>;
  notification_settings: Record<string, any>;
  celebration_settings: Record<string, any>;
  theme_settings: Record<string, any>;
  dashboard_layout: Record<string, any>;
  general_settings: Record<string, any>;
  updated_at?: string;
}

const LOCAL_KEYS = {
  widgets: 'dashboard_widgets',
  notifications: 'notification_settings',
  celebrations: 'celebration_settings',
  theme: 'theme_settings',
  dashboard: 'dashboard_layout',
  general: 'general_settings',
};

export function useCloudSettings() {
  const { user } = useAuth();
  const { isProActive } = useSubscription();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Load settings from cloud for PRO users
  const loadFromCloud = useCallback(async () => {
    if (!user || !isProActive) return null;

    try {
      const { data, error } = await supabase
        .from('cloud_user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading cloud settings:', error);
        return null;
      }

      return data as CloudSettings | null;
    } catch (e) {
      console.error('Error loading cloud settings:', e);
      return null;
    }
  }, [user, isProActive]);

  // Save settings to cloud for PRO users
  const saveToCloud = useCallback(async () => {
    if (!user || !isProActive) {
      toast.error('Сохранение в облако доступно только для PRO пользователей');
      return false;
    }

    setIsSyncing(true);

    try {
      // Gather all local settings
      const settings: CloudSettings = {
        widget_settings: JSON.parse(localStorage.getItem(LOCAL_KEYS.widgets) || '{}'),
        notification_settings: JSON.parse(localStorage.getItem(LOCAL_KEYS.notifications) || '{}'),
        celebration_settings: JSON.parse(localStorage.getItem(LOCAL_KEYS.celebrations) || '{}'),
        theme_settings: JSON.parse(localStorage.getItem(LOCAL_KEYS.theme) || '{}'),
        dashboard_layout: JSON.parse(localStorage.getItem(LOCAL_KEYS.dashboard) || '{}'),
        general_settings: JSON.parse(localStorage.getItem(LOCAL_KEYS.general) || '{}'),
      };

      const { error } = await supabase
        .from('cloud_user_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setLastSyncTime(new Date().toISOString());
      toast.success('Настройки сохранены в облако');
      return true;
    } catch (e) {
      console.error('Error saving to cloud:', e);
      toast.error('Ошибка сохранения настроек');
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [user, isProActive]);

  // Restore settings from cloud
  const restoreFromCloud = useCallback(async () => {
    if (!user || !isProActive) {
      toast.error('Восстановление из облака доступно только для PRO пользователей');
      return false;
    }

    setIsSyncing(true);

    try {
      const cloudData = await loadFromCloud();
      
      if (!cloudData) {
        toast.info('Нет сохранённых настроек в облаке');
        return false;
      }

      // Restore to local storage
      if (cloudData.widget_settings && Object.keys(cloudData.widget_settings).length > 0) {
        localStorage.setItem(LOCAL_KEYS.widgets, JSON.stringify(cloudData.widget_settings));
      }
      if (cloudData.notification_settings && Object.keys(cloudData.notification_settings).length > 0) {
        localStorage.setItem(LOCAL_KEYS.notifications, JSON.stringify(cloudData.notification_settings));
      }
      if (cloudData.celebration_settings && Object.keys(cloudData.celebration_settings).length > 0) {
        localStorage.setItem(LOCAL_KEYS.celebrations, JSON.stringify(cloudData.celebration_settings));
      }
      if (cloudData.theme_settings && Object.keys(cloudData.theme_settings).length > 0) {
        localStorage.setItem(LOCAL_KEYS.theme, JSON.stringify(cloudData.theme_settings));
      }
      if (cloudData.dashboard_layout && Object.keys(cloudData.dashboard_layout).length > 0) {
        localStorage.setItem(LOCAL_KEYS.dashboard, JSON.stringify(cloudData.dashboard_layout));
      }
      if (cloudData.general_settings && Object.keys(cloudData.general_settings).length > 0) {
        localStorage.setItem(LOCAL_KEYS.general, JSON.stringify(cloudData.general_settings));
      }

      toast.success('Настройки восстановлены из облака');
      // Reload page to apply settings
      setTimeout(() => window.location.reload(), 1000);
      return true;
    } catch (e) {
      console.error('Error restoring from cloud:', e);
      toast.error('Ошибка восстановления настроек');
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [user, isProActive, loadFromCloud]);

  // Auto-sync on login for PRO users
  useEffect(() => {
    if (user && isProActive) {
      loadFromCloud().then(data => {
        if (data) {
          setLastSyncTime(data.updated_at || null);
        }
      });
    }
  }, [user?.id, isProActive]);

  return {
    isSyncing,
    lastSyncTime,
    saveToCloud,
    restoreFromCloud,
    loadFromCloud,
    isCloudEnabled: isProActive,
  };
}
