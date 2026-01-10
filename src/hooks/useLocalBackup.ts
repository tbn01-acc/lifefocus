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
    settings: any;
  };
}

const BACKUP_VERSION = '1.0.0';

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
      settings: {}
    };

    // Collect all localStorage data
    const storageKeys = [
      'habitflow_tasks',
      'habitflow_habits',
      'habitflow_transactions',
      'habitflow_task_categories',
      'habitflow_task_tags',
      'habitflow_habit_categories',
      'celebration_settings',
      'widget_settings',
      'theme',
      'cachingEnabled'
    ];

    storageKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          if (key === 'habitflow_tasks') {
            data.tasks = JSON.parse(value);
          } else if (key === 'habitflow_habits') {
            data.habits = JSON.parse(value);
          } else if (key === 'habitflow_transactions') {
            data.transactions = JSON.parse(value);
          } else if (key === 'habitflow_task_categories' || key === 'habitflow_habit_categories') {
            const parsed = JSON.parse(value);
            data.categories = [...data.categories, ...parsed];
          } else if (key === 'habitflow_task_tags') {
            data.tags = JSON.parse(value);
          } else {
            data.settings[key] = JSON.parse(value);
          }
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

      // Restore data to localStorage
      if (backup.data.tasks?.length) {
        localStorage.setItem('habitflow_tasks', JSON.stringify(backup.data.tasks));
      }
      if (backup.data.habits?.length) {
        localStorage.setItem('habitflow_habits', JSON.stringify(backup.data.habits));
      }
      if (backup.data.transactions?.length) {
        localStorage.setItem('habitflow_transactions', JSON.stringify(backup.data.transactions));
      }
      if (backup.data.categories?.length) {
        localStorage.setItem('habitflow_task_categories', JSON.stringify(backup.data.categories));
      }
      if (backup.data.tags?.length) {
        localStorage.setItem('habitflow_task_tags', JSON.stringify(backup.data.tags));
      }
      
      // Restore settings
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
