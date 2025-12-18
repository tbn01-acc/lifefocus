import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Trash2, Plus, X, FileText } from 'lucide-react';
import { Workout, WORKOUT_COLORS } from '@/types/fitness';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface WorkoutTemplate {
  id: string;
  name: string;
  workout: Omit<Workout, 'id' | 'createdAt'>;
  createdAt: string;
}

interface WorkoutTemplatesProps {
  open: boolean;
  onClose: () => void;
  templates: WorkoutTemplate[];
  onSaveTemplate: (template: Omit<WorkoutTemplate, 'id' | 'createdAt'>) => void;
  onDeleteTemplate: (id: string) => void;
  onCreateFromTemplate: (template: WorkoutTemplate) => void;
  workouts: Workout[];
}

export function WorkoutTemplates({
  open,
  onClose,
  templates,
  onSaveTemplate,
  onDeleteTemplate,
  onCreateFromTemplate,
  workouts,
}: WorkoutTemplatesProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'templates' | 'save'>('templates');
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState('');

  const handleSaveAsTemplate = () => {
    if (!selectedWorkoutId || !templateName.trim()) return;
    
    const workout = workouts.find(w => w.id === selectedWorkoutId);
    if (!workout) return;

    onSaveTemplate({
      name: templateName.trim(),
      workout: {
        name: workout.name,
        icon: workout.icon,
        color: workout.color,
        exercises: workout.exercises,
        scheduledDays: workout.scheduledDays,
        categoryId: workout.categoryId,
        tagIds: workout.tagIds,
      },
    });

    setSelectedWorkoutId(null);
    setTemplateName('');
    toast.success(t('templateSaved'));
  };

  const handleCreateFromTemplate = (template: WorkoutTemplate) => {
    onCreateFromTemplate(template);
    toast.success(t('workoutCreatedFromTemplate'));
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[10%] bottom-24 max-w-md mx-auto bg-card rounded-3xl p-6 shadow-lg z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-fitness" />
                <h2 className="text-xl font-semibold text-foreground">{t('workoutTemplates')}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab('templates')}
                className={cn(
                  "flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all",
                  activeTab === 'templates'
                    ? "bg-fitness text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {t('myTemplates')}
              </button>
              <button
                onClick={() => setActiveTab('save')}
                className={cn(
                  "flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all",
                  activeTab === 'save'
                    ? "bg-fitness text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {t('saveAsTemplate')}
              </button>
            </div>

            {/* Templates List */}
            {activeTab === 'templates' && (
              <div className="flex-1 overflow-y-auto space-y-2">
                {templates.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">{t('noTemplatesYet')}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">{t('saveWorkoutAsTemplate')}</p>
                  </div>
                ) : (
                  templates.map((template) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-muted rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{template.workout.icon}</span>
                          <div>
                            <h3 className="font-medium text-foreground">{template.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {template.workout.exercises.length} {t('exercises')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8"
                            onClick={() => handleCreateFromTemplate(template)}
                          >
                            <Copy className="w-4 h-4 text-fitness" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8"
                            onClick={() => onDeleteTemplate(template.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Exercise preview */}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {template.workout.exercises.slice(0, 3).map((ex, idx) => (
                          <span 
                            key={idx} 
                            className="text-xs bg-background px-2 py-0.5 rounded"
                          >
                            {ex.name}
                          </span>
                        ))}
                        {template.workout.exercises.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{template.workout.exercises.length - 3}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {/* Save as Template */}
            {activeTab === 'save' && (
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t('selectWorkout')}
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {workouts.map((workout) => (
                        <button
                          key={workout.id}
                          onClick={() => setSelectedWorkoutId(workout.id)}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                            selectedWorkoutId === workout.id
                              ? "bg-fitness/20 border-2 border-fitness"
                              : "bg-muted hover:bg-muted/80"
                          )}
                        >
                          <span className="text-xl">{workout.icon}</span>
                          <div>
                            <div className="font-medium text-foreground">{workout.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {workout.exercises.length} {t('exercises')}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedWorkoutId && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {t('templateName')}
                      </label>
                      <Input
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder={t('templateNamePlaceholder')}
                        className="mb-4"
                      />
                      <Button
                        onClick={handleSaveAsTemplate}
                        disabled={!templateName.trim()}
                        className="w-full bg-fitness hover:bg-fitness/90 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {t('saveTemplate')}
                      </Button>
                    </motion.div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
