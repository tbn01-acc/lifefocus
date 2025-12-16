import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Pencil, Trash2, Plus, Check } from 'lucide-react';
import { TaskCategory, TaskTag, TASK_COLORS } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface TaskSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  categories: TaskCategory[];
  tags: TaskTag[];
  onAddCategory: (category: Omit<TaskCategory, 'id'>) => void;
  onUpdateCategory: (id: string, updates: Partial<TaskCategory>) => void;
  onDeleteCategory: (id: string) => void;
  onAddTag: (tag: Omit<TaskTag, 'id'>) => void;
  onUpdateTag: (id: string, updates: Partial<TaskTag>) => void;
  onDeleteTag: (id: string) => void;
}

export function TaskSettingsDialog({
  open,
  onClose,
  categories,
  tags,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddTag,
  onUpdateTag,
  onDeleteTag,
}: TaskSettingsDialogProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'categories' | 'tags'>('categories');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState('');
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(TASK_COLORS[0]);

  const startEditing = (id: string, name: string, color: string) => {
    setEditingId(id);
    setEditingName(name);
    setEditingColor(color);
  };

  const saveEdit = () => {
    if (!editingId || !editingName.trim()) return;
    if (activeTab === 'categories') {
      onUpdateCategory(editingId, { name: editingName.trim(), color: editingColor });
    } else {
      onUpdateTag(editingId, { name: editingName.trim(), color: editingColor });
    }
    setEditingId(null);
    setEditingName('');
    setEditingColor('');
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    if (activeTab === 'categories') {
      onAddCategory({ name: newName.trim(), color: newColor });
    } else {
      onAddTag({ name: newName.trim(), color: newColor });
    }
    setNewName('');
    setNewColor(TASK_COLORS[0]);
  };

  const handleDelete = (id: string) => {
    if (activeTab === 'categories') {
      onDeleteCategory(id);
    } else {
      onDeleteTag(id);
    }
  };

  const items = activeTab === 'categories' ? categories : tags;

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
                <Settings className="w-5 h-5 text-task" />
                <h2 className="text-xl font-semibold text-foreground">
                  {t('taskSettings')}
                </h2>
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
                onClick={() => setActiveTab('categories')}
                className={cn(
                  "flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all",
                  activeTab === 'categories'
                    ? "bg-task text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {t('categoriesLabel')}
              </button>
              <button
                onClick={() => setActiveTab('tags')}
                className={cn(
                  "flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all",
                  activeTab === 'tags'
                    ? "bg-task text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {t('tagsLabel')}
              </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 bg-muted rounded-xl p-3"
                >
                  {editingId === item.id ? (
                    <>
                      <div
                        className="w-6 h-6 rounded-full shrink-0 cursor-pointer ring-2 ring-offset-2 ring-offset-muted ring-task"
                        style={{ backgroundColor: editingColor }}
                        onClick={() => {
                          const idx = TASK_COLORS.indexOf(editingColor);
                          setEditingColor(TASK_COLORS[(idx + 1) % TASK_COLORS.length]);
                        }}
                      />
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 h-8 text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                      />
                      <button
                        onClick={saveEdit}
                        className="p-1.5 rounded-lg bg-task text-white hover:bg-task/90"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <div
                        className="w-6 h-6 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="flex-1 text-sm text-foreground truncate">
                        {item.name}
                      </span>
                      <button
                        onClick={() => startEditing(item.id, item.name, item.color)}
                        className="p-1.5 rounded-lg hover:bg-background/50 text-muted-foreground"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  {activeTab === 'categories' ? t('noCategoriesYet') : t('noTagsYet')}
                </p>
              )}
            </div>

            {/* Add New */}
            <div className="border-t border-border pt-4">
              <p className="text-sm font-medium text-foreground mb-2">
                {activeTab === 'categories' ? t('addCategory') : t('addTag')}
              </p>
              <div className="flex gap-2">
                <div
                  className="w-10 h-10 rounded-xl shrink-0 cursor-pointer flex items-center justify-center transition-all hover:scale-105"
                  style={{ backgroundColor: newColor }}
                  onClick={() => {
                    const idx = TASK_COLORS.indexOf(newColor);
                    setNewColor(TASK_COLORS[(idx + 1) % TASK_COLORS.length]);
                  }}
                />
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={activeTab === 'categories' ? t('categoryNamePlaceholder') : t('tagNamePlaceholder')}
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <Button onClick={handleAdd} className="bg-task hover:bg-task/90">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
