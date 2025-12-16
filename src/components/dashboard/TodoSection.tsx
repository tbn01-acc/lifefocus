import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TodoItem {
  id: string;
  name: string;
  icon?: string;
  completed: boolean;
}

interface TodoSectionProps {
  title: string;
  items: TodoItem[];
  color: string;
  icon: React.ReactNode;
  onToggle: (id: string) => void;
  emptyMessage?: string;
  isExpanded?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
}

function getProgressColor(percentage: number): string {
  if (percentage <= 20) return 'hsl(0, 70%, 50%)'; // red
  if (percentage <= 40) return 'hsl(30, 90%, 50%)'; // orange
  if (percentage <= 60) return 'hsl(50, 90%, 50%)'; // yellow
  if (percentage <= 80) return 'hsl(145, 70%, 45%)'; // green
  if (percentage <= 90) return 'hsl(200, 80%, 50%)'; // cyan
  if (percentage < 100) return 'hsl(220, 80%, 55%)'; // blue
  return 'hsl(262, 80%, 55%)'; // purple (100%)
}

function getContrastColor(percentage: number): string {
  if (percentage <= 60) return percentage <= 40 ? 'white' : 'hsl(0, 0%, 15%)';
  return 'white';
}

export function TodoSection({ 
  title, 
  items, 
  color, 
  icon, 
  onToggle, 
  emptyMessage,
  isExpanded = false,
  onExpand,
  onCollapse
}: TodoSectionProps) {
  const incompleteItems = items.filter(i => !i.completed);
  const completedCount = items.filter(i => i.completed).length;
  const totalCount = items.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  const progressColor = getProgressColor(percentage);
  const textColor = getContrastColor(percentage);

  const handleRingClick = () => {
    if (onExpand) onExpand();
  };

  const handleHeaderClick = () => {
    if (onCollapse) onCollapse();
  };

  // Collapsed view - just the ring
  if (!isExpanded) {
    return (
      <motion.button
        onClick={handleRingClick}
        className="flex flex-col items-center gap-2 p-3"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div 
          className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg cursor-pointer"
          style={{ backgroundColor: progressColor }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <span 
            className="text-lg font-bold"
            style={{ color: textColor }}
          >
            {percentage}
          </span>
        </motion.div>
        <div className="flex items-center gap-1.5">
          <div 
            className="w-5 h-5 rounded-md flex items-center justify-center"
            style={{ backgroundColor: color }}
          >
            <div className="text-white scale-75">{icon}</div>
          </div>
          <span className="text-xs font-medium text-muted-foreground">{title}</span>
        </div>
      </motion.button>
    );
  }

  // Expanded view - full list
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="col-span-2 lg:col-span-4 rounded-2xl p-4 shadow-card"
      style={{ backgroundColor: color }}
    >
      <button 
        onClick={handleHeaderClick}
        className="w-full flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity"
      >
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20"
        >
          <div className="text-white">{icon}</div>
        </div>
        <h3 className="text-sm font-medium text-white">{title}</h3>
        <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">
          {incompleteItems.length}
        </span>
      </button>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {incompleteItems.length === 0 ? (
          <p className="text-xs text-white/80 py-2 text-center">
            {emptyMessage || '✓'}
          </p>
        ) : (
          incompleteItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onToggle(item.id)}
              className={cn(
                "w-full flex items-center gap-2 p-2 rounded-lg transition-all text-left",
                "bg-white/20 hover:bg-white/30"
              )}
            >
              <div
                className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors border-white/50"
              >
                {item.completed && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
              
              {item.icon && (
                <span className="text-sm flex-shrink-0">{item.icon}</span>
              )}
              
              <span className="text-sm truncate text-white">
                {item.name}
              </span>
            </button>
          ))
        )}
      </div>
    </motion.div>
  );
}
