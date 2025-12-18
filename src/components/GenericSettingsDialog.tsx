import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Pencil, Trash2, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { ExerciseCategory } from '@/types/fitness';

export interface GenericCategory {
  id: string;
  name: string;
  color: string;
}

export interface GenericTag {
  id: string;
  name: string;
  color: string;
}

interface GenericSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  categories: GenericCategory[];
  tags: GenericTag[];
  onAddCategory: (category: Omit<GenericCategory, 'id'>) => void;
  onUpdateCategory: (id: string, updates: Partial<GenericCategory>) => void;
  onDeleteCategory: (id: string) => void;
  onAddTag: (tag: Omit<GenericTag, 'id'>) => void;
  onUpdateTag: (id: string, updates: Partial<GenericTag>) => void;
  onDeleteTag: (id: string) => void;
  colors: string[];
  accentColor: string;
  title: string;
  // Optional exercise categories for fitness
  exerciseCategories?: ExerciseCategory[];
  onAddExerciseCategory?: (category: Omit<ExerciseCategory, 'id'>) => void;
  onUpdateExerciseCategory?: (id: string, updates: Partial<ExerciseCategory>) => void;
  onDeleteExerciseCategory?: (id: string) => void;
}

type TabType = 'categories' | 'tags' | 'exerciseCategories';

export function GenericSettingsDialog({
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
  colors,
  accentColor,
  title,
  exerciseCategories,
  onAddExerciseCategory,
  onUpdateExerciseCategory,
  onDeleteExerciseCategory,
}: GenericSettingsDialogProps) {
  const { t } = useTranslation();
  const hasExerciseCategories = exerciseCategories && onAddExerciseCategory && onUpdateExerciseCategory && onDeleteExerciseCategory;
  
  const [activeTab, setActiveTab] = useState<TabType>('categories');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState('');
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(colors[0]);

  const startEditing = (id: string, name: string, color: string) => {
    setEditingId(id);
    setEditingName(name);
    setEditingColor(color);
  };

  const saveEdit = () => {
    if (!editingId || !editingName.trim()) return;
    if (activeTab === 'categories') {
      onUpdateCategory(editingId, { name: editingName.trim(), color: editingColor });
    } else if (activeTab === 'tags') {
      onUpdateTag(editingId, { name: editingName.trim(), color: editingColor });
    } else if (activeTab === 'exerciseCategories' && onUpdateExerciseCategory) {
      onUpdateExerciseCategory(editingId, { name: editingName.trim(), color: editingColor });
    }
    setEditingId(null);
    setEditingName('');
    setEditingColor('');
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    if (activeTab === 'categories') {
      onAddCategory({ name: newName.trim(), color: newColor });
    } else if (activeTab === 'tags') {
      onAddTag({ name: newName.trim(), color: newColor });
    } else if (activeTab === 'exerciseCategories' && onAddExerciseCategory) {
      onAddExerciseCategory({ name: newName.trim(), color: newColor });
    }
    setNewName('');
    setNewColor(colors[0]);
  };

  const handleDelete = (id: string) => {
    if (activeTab === 'categories') {
      onDeleteCategory(id);
    } else if (activeTab === 'tags') {
      onDeleteTag(id);
    } else if (activeTab === 'exerciseCategories' && onDeleteExerciseCategory) {
      onDeleteExerciseCategory(id);
    }
  };

  const getItems = () => {
    if (activeTab === 'categories') return categories;
    if (activeTab === 'tags') return tags;
    if (activeTab === 'exerciseCategories') return exerciseCategories || [];
    return [];
  };

  const items = getItems();

  const getAddLabel = () => {
    if (activeTab === 'categories') return t('addCategory');
    if (activeTab === 'tags') return t('addTag');
    return t('addExerciseCategory');
  };

  const getPlaceholder = () => {
    if (activeTab === 'categories') return t('categoryNamePlaceholder');
    if (activeTab === 'tags') return t('tagNamePlaceholder');
    return t('exerciseCategoryPlaceholder');
  };

  const getEmptyMessage = () => {
    if (activeTab === 'categories') return t('noCategoriesYet');
    if (activeTab === 'tags') return t('noTagsYet');
    return t('noExerciseCategoriesYet');
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
                <Settings className="w-5 h-5" style={{ color: accentColor }} />
                <h2 className="text-xl font-semibold text-foreground">{title}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 overflow-x-auto">
              <button
                onClick={() => setActiveTab('categories')}
                className={cn(
                  "flex-1 py-2 px-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap",
                  activeTab === 'categories'
                    ? "text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
                style={activeTab === 'categories' ? { backgroundColor: accentColor } : undefined}
              >
                {t('categoriesLabel')}
              </button>
              <button
                onClick={() => setActiveTab('tags')}
                className={cn(
                  "flex-1 py-2 px-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap",
                  activeTab === 'tags'
                    ? "text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
                style={activeTab === 'tags' ? { backgroundColor: accentColor } : undefined}
              >
                {t('tagsLabel')}
              </button>
              {hasExerciseCategories && (
                <button
                  onClick={() => setActiveTab('exerciseCategories')}
                  className={cn(
                    "flex-1 py-2 px-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap",
                    activeTab === 'exerciseCategories'
                      ? "text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                  style={activeTab === 'exerciseCategories' ? { backgroundColor: accentColor } : undefined}
                >
                  {t('exerciseCategoriesLabel')}
                </button>
              )}
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
                        className="w-6 h-6 rounded-full shrink-0 cursor-pointer ring-2 ring-offset-2 ring-offset-muted"
                        style={{ backgroundColor: editingColor, borderColor: accentColor }}
                        onClick={() => {
                          const idx = colors.indexOf(editingColor);
                          setEditingColor(colors[(idx + 1) % colors.length]);
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
                        className="p-1.5 rounded-lg text-white"
                        style={{ backgroundColor: accentColor }}
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
                  {getEmptyMessage()}
                </p>
              )}
            </div>

            {/* Add New */}
            <div className="border-t border-border pt-4">
              <p className="text-sm font-medium text-foreground mb-2">
                {getAddLabel()}
              </p>
              <div className="flex gap-2">
                <div
                  className="w-10 h-10 rounded-xl shrink-0 cursor-pointer flex items-center justify-center transition-all hover:scale-105"
                  style={{ backgroundColor: newColor }}
                  onClick={() => {
                    const idx = colors.indexOf(newColor);
                    setNewColor(colors[(idx + 1) % colors.length]);
                  }}
                />
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={getPlaceholder()}
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <Button 
                  onClick={handleAdd} 
                  className="text-white"
                  style={{ backgroundColor: accentColor }}
                >
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
