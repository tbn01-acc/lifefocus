import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, CheckSquare } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { Task } from '@/types/task';
import { TaskCard } from '@/components/TaskCard';
import { TaskDialog } from '@/components/TaskDialog';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/contexts/LanguageContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TasksProps {
  openDialog?: boolean;
  onDialogClose?: () => void;
}

export default function Tasks({ openDialog, onDialogClose }: TasksProps) {
  const { tasks, isLoading, addTask, updateTask, deleteTask, toggleTaskCompletion } = useTasks();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteConfirmTask, setDeleteConfirmTask] = useState<Task | null>(null);
  const { t } = useTranslation();

  const handleSaveTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'completed'>) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      addTask(taskData);
    }
    setEditingTask(null);
    setDialogOpen(false);
    onDialogClose?.();
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleDeleteTask = (task: Task) => {
    setDeleteConfirmTask(task);
  };

  const confirmDelete = () => {
    if (deleteConfirmTask) {
      deleteTask(deleteConfirmTask.id);
      setDeleteConfirmTask(null);
    }
  };

  // Sort: incomplete first, then by due date
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse-soft">
          <Sparkles className="w-12 h-12 text-task" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <PageHeader
          icon={<CheckSquare className="w-5 h-5 text-task" />}
          iconBgClass="bg-task/20"
          title={t('taskTracker')}
          subtitle={`${tasks.length} ${t('tasks').toLowerCase()}`}
        />

        {/* Content */}
        <div className="mt-6">
          <AnimatePresence mode="popLayout">
            {sortedTasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-task/20 to-task/10 flex items-center justify-center">
                  <CheckSquare className="w-10 h-10 text-task" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {t('startTasks')}
                </h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
                  {t('createFirstTask')}
                </p>
                <Button 
                  onClick={() => setDialogOpen(true)}
                  className="bg-task text-white hover:bg-task/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('createTask')}
                </Button>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {sortedTasks.map((task, index) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={index}
                    onToggle={() => toggleTaskCompletion(task.id)}
                    onEdit={() => handleEditTask(task)}
                    onDelete={() => handleDeleteTask(task)}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* FAB */}
      {sortedTasks.length > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="fixed bottom-24 right-6"
        >
          <Button
            onClick={() => {
              setEditingTask(null);
              setDialogOpen(true);
            }}
            size="lg"
            className="w-14 h-14 rounded-full bg-task hover:bg-task/90 shadow-lg p-0"
          >
            <Plus className="w-6 h-6 text-white" />
          </Button>
        </motion.div>
      )}

      {/* Dialogs */}
      <TaskDialog
        open={dialogOpen || !!openDialog}
        onClose={() => {
          setDialogOpen(false);
          setEditingTask(null);
          onDialogClose?.();
        }}
        onSave={handleSaveTask}
        task={editingTask}
      />

      <AlertDialog open={!!deleteConfirmTask} onOpenChange={() => setDeleteConfirmTask(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTask')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteTaskDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
