import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SpreadLevel } from '@/hooks/useBalanceSpread';
import confetti from 'canvas-confetti';
import { playSuccessSound } from '@/utils/celebrations';
import { X, Zap, AlertTriangle, Target, Award, Crown } from 'lucide-react';

interface BalanceStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: SpreadLevel;
  spread: number;
  language: 'ru' | 'en' | 'es';
}

const statusMessages = {
  topFocus: {
    ru: {
      title: 'Мастер фокуса',
      message: 'Полная синхронизация всех сфер жизни. Продолжайте в том же духе.',
    },
    en: {
      title: 'Master of Focus',
      message: 'Full synchronization of all life areas. Keep it up.',
    },
    es: {
      title: 'Maestro del Foco',
      message: 'Sincronización total de todas las áreas. Sigue así.',
    },
  },
  stability: {
    ru: {
      title: 'Устойчивость',
      message: 'Отличный баланс. Ваша жизнь гармонична, а ресурсы распределены верно.',
    },
    en: {
      title: 'Stability',
      message: 'Great balance. Your life is harmonious, and resources are allocated correctly.',
    },
    es: {
      title: 'Estabilidad',
      message: 'Excelente equilibrio. Tu vida es armoniosa y los recursos están bien asignados.',
    },
  },
  balance: {
    ru: {
      title: 'Равновесие',
      message: 'Ритм сбивается. Обратите внимание на отстающие сферы, чтобы сохранить темп.',
    },
    en: {
      title: 'Balance',
      message: 'Rhythm is off. Pay attention to lagging areas to keep the momentum.',
    },
    es: {
      title: 'Equilibrio',
      message: 'El ritmo falla. Presta atención a las áreas rezagadas para mantener el impulso.',
    },
  },
  tilt: {
    ru: {
      title: 'Крен',
      message: 'Сильный наклон. Вы на грани выгорания в одних делах и застоя в других.',
    },
    en: {
      title: 'Tilt',
      message: 'Significant tilt. You are on the edge of burnout in some areas and stagnation in others.',
    },
    es: {
      title: 'Inclinación',
      message: 'Inclinación fuerte. Estás al borde del agotamiento en unas áreas y del estancamiento en otras.',
    },
  },
  chaos: {
    ru: {
      title: 'Хаос',
      message: 'Фокус потерян. Одна сфера забирает всё, пока остальные пустуют. Пора замедлиться.',
    },
    en: {
      title: 'Chaos',
      message: 'Focus lost. One area consumes everything while others are empty. Time to slow down.',
    },
    es: {
      title: 'Caos',
      message: 'Foco perdido. Una esfera lo consume todo mientras otras están vacías. Es hora de frenar.',
    },
  },
};

const levelIcons: Record<SpreadLevel, React.ReactNode> = {
  topFocus: <Crown className="w-10 h-10 text-amber-400" />,
  stability: <Award className="w-10 h-10 text-emerald-400" />,
  balance: <Target className="w-10 h-10 text-sky-400" />,
  tilt: <AlertTriangle className="w-10 h-10 text-orange-400" />,
  chaos: <Zap className="w-10 h-10 text-red-400" />,
};

const levelColors: Record<SpreadLevel, string> = {
  topFocus: 'from-amber-500/20 to-yellow-500/20 border-amber-400/50',
  stability: 'from-emerald-500/20 to-green-500/20 border-emerald-400/50',
  balance: 'from-sky-500/20 to-blue-500/20 border-sky-400/50',
  tilt: 'from-orange-500/20 to-amber-500/20 border-orange-400/50',
  chaos: 'from-red-500/20 to-rose-500/20 border-red-400/50',
};

export function BalanceStatusModal({ isOpen, onClose, level, spread, language }: BalanceStatusModalProps) {
  const [showLightning, setShowLightning] = useState(false);
  const [showRedPulse, setShowRedPulse] = useState(false);
  const [showBluePulse, setShowBluePulse] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Trigger effects based on level
    if (level === 'topFocus') {
      // Multiple fireworks
      playSuccessSound();
      const duration = 2000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ['#fbbf24', '#f59e0b', '#eab308', '#fcd34d'],
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ['#fbbf24', '#f59e0b', '#eab308', '#fcd34d'],
        });
        confetti({
          particleCount: 3,
          angle: 90,
          spread: 45,
          origin: { x: 0.5, y: 0.3 },
          colors: ['#fbbf24', '#f59e0b', '#eab308'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    } else if (level === 'stability') {
      // Confetti
      playSuccessSound();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#22c55e', '#4ade80', '#34d399'],
      });
    } else if (level === 'balance') {
      // Blue pulse
      setShowBluePulse(true);
      setTimeout(() => setShowBluePulse(false), 1500);
    } else if (level === 'tilt') {
      // Red pulse
      setShowRedPulse(true);
      setTimeout(() => setShowRedPulse(false), 1500);
    } else if (level === 'chaos') {
      // Lightning effect
      setShowLightning(true);
      setTimeout(() => setShowLightning(false), 300);
      setTimeout(() => {
        setShowLightning(true);
        setTimeout(() => setShowLightning(false), 200);
      }, 400);
    }
  }, [isOpen, level]);

  const content = statusMessages[level]?.[language] || statusMessages[level]?.en;
  const Icon = levelIcons[level];
  const colorClass = levelColors[level];

  return (
    <>
      {/* Lightning overlay */}
      <AnimatePresence>
        {showLightning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 z-[100] bg-white/20 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Red pulse overlay */}
      <AnimatePresence>
        {showRedPulse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0, 0.3, 0] }}
            transition={{ duration: 1.5, times: [0, 0.2, 0.4, 0.6, 1] }}
            className="fixed inset-0 z-[100] bg-red-500/30 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Blue pulse overlay */}
      <AnimatePresence>
        {showBluePulse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0, 0.3, 0] }}
            transition={{ duration: 1.5, times: [0, 0.2, 0.4, 0.6, 1] }}
            className="fixed inset-0 z-[100] bg-sky-500/30 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className={`max-w-sm bg-gradient-to-br ${colorClass} backdrop-blur-xl border-2`}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="flex flex-col items-center text-center py-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', damping: 10 }}
              className="mb-4"
            >
              {Icon}
            </motion.div>
            
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-xl font-bold">
                {content?.title}
              </DialogTitle>
              <DialogDescription className="text-base text-foreground/80">
                {content?.message}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 text-sm text-muted-foreground">
              Spread: {Math.round(spread)}%
            </div>

            <Button
              onClick={onClose}
              className="mt-6 w-full"
              variant="secondary"
            >
              {language === 'ru' ? 'Понятно' : language === 'es' ? 'Entendido' : 'Got it'}
            </Button>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
}
