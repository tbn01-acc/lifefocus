import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface RestTimerProps {
  defaultDuration?: number; // in seconds
  onComplete?: () => void;
}

export function RestTimer({ defaultDuration = 90, onComplete }: RestTimerProps) {
  const { t } = useTranslation();
  const [duration, setDuration] = useState(defaultDuration);
  const [timeLeft, setTimeLeft] = useState(defaultDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Create audio element for notification
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleio0NnOq1NvJhkc1OVSCqLrBj1owM0lgdIeYoJeBZlREP0JLWGNxgImNioCJmJ+fppyWeHhycG1pa2tyenp2bWljY2VnZ2loZ2VlY2NjY2NjY2NiYmJiYmNjZGVmZ2hqa2xucHFzdHZ4eXt9f4GDhYeJi42PkZOVl5manJ6goaOlpqiqqq2vsLK0tbe5u72/wcPFx8nLzc/R09XX2dvc3t/h4uTl5+jp6uzt7u/x8vP09fb3+Pn6+/z9/v8AAQIDBAUGBwgJCgsM');
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            if (soundEnabled && audioRef.current) {
              audioRef.current.play().catch(() => {});
            }
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, soundEnabled, onComplete]);

  const toggleTimer = () => {
    if (timeLeft === 0) {
      setTimeLeft(duration);
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(duration);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration - timeLeft) / duration) * 100;

  const presetDurations = [30, 60, 90, 120, 180];

  return (
    <div className="bg-card rounded-2xl p-4 border border-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground">{t('restTimer')}</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-muted-foreground" />
            ) : (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <Settings className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Timer Display */}
      <div className="relative flex items-center justify-center mb-4">
        <svg className="w-32 h-32 transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="hsl(262, 80%, 55%)"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 56}`}
            strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <span className={cn(
          "absolute text-3xl font-bold",
          timeLeft <= 10 && timeLeft > 0 && isRunning ? "text-destructive animate-pulse" : "text-foreground"
        )}>
          {formatTime(timeLeft)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={resetTimer}
          className="w-10 h-10 rounded-full"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          onClick={toggleTimer}
          className={cn(
            "w-14 h-14 rounded-full text-white",
            isRunning ? "bg-destructive hover:bg-destructive/90" : "bg-fitness hover:bg-fitness/90"
          )}
        >
          {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
        </Button>
        <div className="w-10" /> {/* Spacer for alignment */}
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">{t('timerDuration')}</p>
              <div className="flex flex-wrap gap-2">
                {presetDurations.map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setDuration(d);
                      setTimeLeft(d);
                      setIsRunning(false);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      duration === d
                        ? "bg-fitness text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {formatTime(d)}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setDuration(val);
                    if (!isRunning) setTimeLeft(val);
                  }}
                  className="w-20 h-8 text-sm"
                  min={5}
                  max={600}
                />
                <span className="text-xs text-muted-foreground">{t('seconds')}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
