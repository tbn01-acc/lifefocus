import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, CheckSquare, Wallet, Dumbbell, Plus, X } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface BottomNavigationProps {
  onAddHabit: () => void;
  onAddTask: () => void;
  onAddTransaction: () => void;
  onAddWorkout: () => void;
}

export function BottomNavigation({ 
  onAddHabit, 
  onAddTask, 
  onAddTransaction, 
  onAddWorkout 
}: BottomNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { path: '/habits', icon: Target, label: t('habits'), color: 'hsl(var(--habit))' },
    { path: '/tasks', icon: CheckSquare, label: t('tasks'), color: 'hsl(var(--task))' },
    { path: '/finance', icon: Wallet, label: t('finance'), color: 'hsl(var(--finance))' },
    { path: '/fitness', icon: Dumbbell, label: t('fitness'), color: 'hsl(var(--fitness))' },
  ];

  const quickAddItems = [
    { label: t('habit'), icon: Target, color: 'hsl(var(--habit))', action: onAddHabit, path: '/habits' },
    { label: t('task'), icon: CheckSquare, color: 'hsl(var(--task))', action: onAddTask, path: '/tasks' },
    { label: t('transaction'), icon: Wallet, color: 'hsl(var(--finance))', action: onAddTransaction, path: '/finance' },
    { label: t('workout'), icon: Dumbbell, color: 'hsl(var(--fitness))', action: onAddWorkout, path: '/fitness' },
  ];

  const handleQuickAdd = (item: typeof quickAddItems[0]) => {
    setIsMenuOpen(false);
    // Navigate to the section first, then open dialog
    navigate(item.path);
    // Small delay to ensure navigation completes
    setTimeout(() => {
      item.action();
    }, 100);
  };

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Quick Add Menu - Centered on screen */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 pointer-events-none">
            {/* Center container */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
              {quickAddItems.map((item, index) => {
                // Arrange in a semi-circle above center
                const totalItems = quickAddItems.length;
                const angleSpread = 140; // degrees
                const startAngle = -180 + (180 - angleSpread) / 2;
                const angleStep = angleSpread / (totalItems - 1);
                const angle = startAngle + (index * angleStep);
                const radius = 100;
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;

                return (
                  <motion.button
                    key={item.label}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: 1, 
                      x, 
                      y, 
                      opacity: 1 
                    }}
                    exit={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                    transition={{ delay: index * 0.05, type: 'spring', stiffness: 300 }}
                    onClick={() => handleQuickAdd(item)}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center gap-1"
                  >
                    <div 
                      className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: item.color }}
                    >
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-medium text-foreground whitespace-nowrap">
                      {item.label}
                    </span>
                  </motion.button>
                );
              })}
              
              {/* Close button in center */}
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="w-14 h-14 rounded-full bg-muted flex items-center justify-center shadow-lg -translate-x-1/2 -translate-y-1/2"
              >
                <X className="w-6 h-6 text-foreground" />
              </motion.button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border safe-area-inset-bottom">
        <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
          {/* Left side items */}
          {navItems.slice(0, 2).map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors min-w-[60px]",
                location.pathname === item.path
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              style={location.pathname === item.path ? { color: item.color } : undefined}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs mt-1 hidden sm:block">{item.label}</span>
            </button>
          ))}

          {/* Center Add Button */}
          <div className="relative">
            <motion.button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-glow -mt-6"
              whileTap={{ scale: 0.95 }}
              animate={{ rotate: isMenuOpen ? 45 : 0 }}
            >
              <Plus className="w-6 h-6 text-primary-foreground" />
            </motion.button>
            <span className="text-xs text-muted-foreground mt-1 hidden sm:block text-center absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
              {t('new')}
            </span>
          </div>

          {/* Right side items */}
          {navItems.slice(2, 4).map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors min-w-[60px]",
                location.pathname === item.path
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              style={location.pathname === item.path ? { color: item.color } : undefined}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs mt-1 hidden sm:block">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
