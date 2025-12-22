import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Brain, Coffee, Zap, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePomodoro } from '@/hooks/usePomodoro';
import { PomodoroPhase } from '@/types/service';
import { useTranslation } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';

export function PomodoroWidgetCompact() {
  const { t } = useTranslation();
  const {
    currentPhase,
    timeLeft,
    isRunning,
    completedSessions,
    start,
    pause,
    reset,
  } = usePomodoro();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseInfo = (phase: PomodoroPhase) => {
    switch (phase) {
      case 'work':
        return { icon: Brain, color: 'hsl(var(--service))', label: t('work') || 'Работа' };
      case 'short_break':
        return { icon: Coffee, color: 'hsl(var(--success))', label: t('shortBreak') || 'Перерыв' };
      case 'long_break':
        return { icon: Zap, color: 'hsl(var(--accent))', label: t('longBreak') || 'Отдых' };
    }
  };

  const phaseInfo = getPhaseInfo(currentPhase);
  const PhaseIcon = phaseInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl p-3 shadow-card border border-border"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <PhaseIcon className="w-3.5 h-3.5" style={{ color: phaseInfo.color }} />
          <span className="font-medium text-xs">{t('pomodoroTimer')}</span>
        </div>
        <Link to="/services" className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Timer and controls */}
      <div className="flex items-center gap-2">
        {/* Compact timer circle */}
        <div className="relative w-12 h-12 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="17" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
            <circle
              cx="20"
              cy="20"
              r="17"
              fill="none"
              stroke={phaseInfo.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 17}`}
              strokeDashoffset={`${2 * Math.PI * 17 * (1 - timeLeft / (currentPhase === 'work' ? 25 * 60 : currentPhase === 'short_break' ? 5 * 60 : 15 * 60))}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={reset}
            className="h-7 w-7"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
          
          <Button
            size="sm"
            onClick={() => isRunning ? pause() : start()}
            className="flex-1 h-7 text-xs px-2"
            style={{ backgroundColor: phaseInfo.color }}
          >
            {isRunning ? (
              <><Pause className="w-3 h-3 mr-1" /> {t('stop')}</>
            ) : (
              <><Play className="w-3 h-3 mr-1" /> {t('start')}</>
            )}
          </Button>
        </div>
      </div>

      {/* Sessions count */}
      <div className="mt-2 pt-2 border-t border-border flex justify-between text-[10px] text-muted-foreground">
        <span>{phaseInfo.label}</span>
        <span>{completedSessions} {t('sessionsToday') || 'сессий'}</span>
      </div>
    </motion.div>
  );
}