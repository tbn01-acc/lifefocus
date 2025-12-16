import { motion } from 'framer-motion';
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
}

export function TodoSection({ title, items, color, icon, onToggle, emptyMessage }: TodoSectionProps) {
  // Filter to show only incomplete items
  const incompleteItems = items.filter(i => !i.completed);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 shadow-card"
      style={{ backgroundColor: color }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20"
        >
          <div className="text-white">{icon}</div>
        </div>
        <h3 className="text-sm font-medium text-white">{title}</h3>
        <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">
          {incompleteItems.length}
        </span>
      </div>

      <div className="space-y-2 max-h-32 overflow-y-auto">
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
