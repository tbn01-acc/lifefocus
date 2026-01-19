import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface BackupData {
  version: string;
  createdAt: string;
  data: {
    tasks: any[];
    habits: any[];
    transactions: any[];
    categories: any[];
    tags: any[];
    timeEntries: any[];
    notes: any[];
    checklists: any[];
    counters: any[];
    pomodoroSessions: any[];
    settings: Record<string, any>;
  };
}

const BACKUP_VERSION = '2.0.0';

// All storage keys for data
const DATA_KEYS = [
  'habitflow_tasks',
  'habitflow_habits',
  'habitflow_finance',
  'habitflow_transactions',
  'habitflow_time_entries',
  'habitflow_notes',
  'habitflow_checklists',
  'habitflow_counters',
  'habitflow_pomodoro_sessions',
  'habitflow_task_categories',
  'habitflow_habit_categories',
  'habitflow_task_tags',
];

// All storage keys for settings
const SETTINGS_KEYS = [
  'habitflow_widget_settings',
  'habitflow_theme_settings',
  'habitflow_celebration_settings',
  'habitflow_notification_settings',
  'habitflow_general_settings',
  'habitflow_dashboard_layout',
  'celebration_settings',
  'widget_settings',
  'theme',
  'cachingEnabled',
  'habitflow_first_day_of_week',
  'habitflow_language',
  'habitflow_date_format',
  'habitflow_time_format',
  'habitflow_currency',
  'habitflow_auto_archive',
];

export function useLocalBackup() {
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const collectLocalData = useCallback(() => {
    const data: BackupData['data'] = {
      tasks: [],
      habits: [],
      transactions: [],
      categories: [],
      tags: [],
      timeEntries: [],
      notes: [],
      checklists: [],
      counters: [],
      pomodoroSessions: [],
      settings: {}
    };

    // Collect data
    DATA_KEYS.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          const parsed = JSON.parse(value);
          if (key === 'habitflow_tasks') {
            data.tasks = parsed;
          } else if (key === 'habitflow_habits') {
            data.habits = parsed;
          } else if (key === 'habitflow_finance' || key === 'habitflow_transactions') {
            data.transactions = parsed;
          } else if (key === 'habitflow_time_entries') {
            data.timeEntries = parsed;
          } else if (key === 'habitflow_notes') {
            data.notes = parsed;
          } else if (key === 'habitflow_checklists') {
            data.checklists = parsed;
          } else if (key === 'habitflow_counters') {
            data.counters = parsed;
          } else if (key === 'habitflow_pomodoro_sessions') {
            data.pomodoroSessions = parsed;
          } else if (key.includes('categories')) {
            data.categories = [...data.categories, ...parsed];
          } else if (key.includes('tags')) {
            data.tags = parsed;
          }
        } catch {
          // Skip invalid data
        }
      }
    });

    // Collect settings
    SETTINGS_KEYS.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          data.settings[key] = JSON.parse(value);
        } catch {
          data.settings[key] = value;
        }
      }
    });

    return data;
  }, []);

  const createBackup = useCallback(async () => {
    setIsCreating(true);
    try {
      const data = collectLocalData();
      
      const backup: BackupData = {
        version: BACKUP_VERSION,
        createdAt: new Date().toISOString(),
        data
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `top-focus-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Резервная копия успешно создана');
      return true;
    } catch (error) {
      console.error('Backup creation failed:', error);
      toast.error('Ошибка при создании резервной копии');
      return false;
    } finally {
      setIsCreating(false);
    }
  }, [collectLocalData]);

  const restoreBackup = useCallback(async (file: File) => {
    setIsRestoring(true);
    try {
      const text = await file.text();
      const backup: BackupData = JSON.parse(text);

      if (!backup.version || !backup.data) {
        throw new Error('Invalid backup file format');
      }

      // Restore data
      if (backup.data.tasks?.length) {
        localStorage.setItem('habitflow_tasks', JSON.stringify(backup.data.tasks));
      }
      if (backup.data.habits?.length) {
        localStorage.setItem('habitflow_habits', JSON.stringify(backup.data.habits));
      }
      if (backup.data.transactions?.length) {
        localStorage.setItem('habitflow_finance', JSON.stringify(backup.data.transactions));
      }
      if (backup.data.timeEntries?.length) {
        localStorage.setItem('habitflow_time_entries', JSON.stringify(backup.data.timeEntries));
      }
      if (backup.data.notes?.length) {
        localStorage.setItem('habitflow_notes', JSON.stringify(backup.data.notes));
      }
      if (backup.data.checklists?.length) {
        localStorage.setItem('habitflow_checklists', JSON.stringify(backup.data.checklists));
      }
      if (backup.data.counters?.length) {
        localStorage.setItem('habitflow_counters', JSON.stringify(backup.data.counters));
      }
      if (backup.data.pomodoroSessions?.length) {
        localStorage.setItem('habitflow_pomodoro_sessions', JSON.stringify(backup.data.pomodoroSessions));
      }
      if (backup.data.categories?.length) {
        localStorage.setItem('habitflow_task_categories', JSON.stringify(backup.data.categories));
      }
      if (backup.data.tags?.length) {
        localStorage.setItem('habitflow_task_tags', JSON.stringify(backup.data.tags));
      }
      
      // Restore ALL settings
      if (backup.data.settings) {
        Object.entries(backup.data.settings).forEach(([key, value]) => {
          if (typeof value === 'string') {
            localStorage.setItem(key, value);
          } else {
            localStorage.setItem(key, JSON.stringify(value));
          }
        });
      }

      toast.success('Резервная копия успешно восстановлена. Перезагружаем...');
      
      // Trigger data changed event
      window.dispatchEvent(new Event('habitflow-data-changed'));
      
      // Reload the page to apply changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);

      return true;
    } catch (error) {
      console.error('Backup restoration failed:', error);
      toast.error('Ошибка при восстановлении резервной копии');
      return false;
    } finally {
      setIsRestoring(false);
    }
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      restoreBackup(file);
    }
  }, [restoreBackup]);

  return {
    createBackup,
    restoreBackup,
    handleFileSelect,
    isCreating,
    isRestoring
  };
}
