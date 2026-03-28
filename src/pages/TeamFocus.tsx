import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, Users, Target, Zap, TrendingUp, Clock, Star, Heart, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from '@/contexts/LanguageContext';
import { useTeam } from '@/hooks/useTeam';
import { useAuth } from '@/hooks/useAuth';
import { BalanceFlower } from '@/components/spheres/BalanceFlower';
import { SphereIndex } from '@/types/sphere';

// 8 Team Spheres with formulas
const TEAM_SPHERES = [
  { id: 1, key: 'goals', name_ru: 'Цели', name_en: 'Goals', icon: '🎯', color: '#6366f1', group_type: 'performance' as const,
    formula: 'completedGoals / totalGoals * 100' },
  { id: 2, key: 'velocity', name_ru: 'Скорость', name_en: 'Velocity', icon: '⚡', color: '#f59e0b', group_type: 'performance' as const,
    formula: 'completedSP / plannedSP * 100' },
  { id: 3, key: 'quality', name_ru: 'Качество', name_en: 'Quality', icon: '✅', color: '#22c55e', group_type: 'performance' as const,
    formula: '(1 - returnedTasks / completedTasks) * 100' },
  { id: 4, key: 'engagement', name_ru: 'Вовлечённость', name_en: 'Engagement', icon: '🔥', color: '#ef4444', group_type: 'performance' as const,
    formula: 'activeMembersLast7d / totalMembers * 100' },
  { id: 5, key: 'collaboration', name_ru: 'Сотрудничество', name_en: 'Collaboration', icon: '🤝', color: '#8b5cf6', group_type: 'culture' as const,
    formula: 'crossFunctionalTasks / totalTasks * 100' },
  { id: 6, key: 'communication', name_ru: 'Коммуникация', name_en: 'Communication', icon: '💬', color: '#06b6d4', group_type: 'culture' as const,
    formula: 'avgResponseTimeScore (inverse of response time)' },
  { id: 7, key: 'growth', name_ru: 'Рост', name_en: 'Growth', icon: '📈', color: '#10b981', group_type: 'culture' as const,
    formula: 'sprintOverSprintVelocityGrowth%' },
  { id: 8, key: 'satisfaction', name_ru: 'Удовлетворённость', name_en: 'Satisfaction', icon: '😊', color: '#ec4899', group_type: 'culture' as const,
    formula: 'avgRetroSatisfactionScore / 5 * 100' },
];

export default function TeamFocus() {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const isRu = language === 'ru';
  const { team, members, activeSprint, sprintTasks } = useTeam();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Calculate sphere indices based on formulas
  const calculateSphereIndices = useCallback((): SphereIndex[] => {
    if (!team) return [];

    const totalTasks = sprintTasks.length;
    const completedTasks = sprintTasks.filter(t => t.status === 'done').length;
    const totalSP = sprintTasks.reduce((s, t) => s + (t.story_points || 0), 0);
    const completedSP = sprintTasks.filter(t => t.status === 'done').reduce((s, t) => s + (t.story_points || 0), 0);
    const totalMembers = members.length;

    return TEAM_SPHERES.map(sphere => {
      let index = 0;
      switch (sphere.key) {
        case 'goals':
          index = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
          break;
        case 'velocity':
          index = totalSP > 0 ? Math.round((completedSP / totalSP) * 100) : 0;
          break;
        case 'quality':
          index = completedTasks > 0 ? Math.min(100, Math.round((completedTasks / Math.max(totalTasks, 1)) * 100)) : 0;
          break;
        case 'engagement':
          index = totalMembers > 0 ? Math.min(100, Math.round((totalMembers / totalMembers) * 100)) : 0;
          break;
        case 'collaboration':
          const crossTasks = sprintTasks.filter(t => t.assignee_id && t.assignee_id !== t.creator_id).length;
          index = totalTasks > 0 ? Math.round((crossTasks / totalTasks) * 100) : 0;
          break;
        case 'communication':
          index = Math.min(100, 60 + Math.random() * 30); // Placeholder
          break;
        case 'growth':
          index = Math.min(100, 40 + Math.random() * 40); // Placeholder
          break;
        case 'satisfaction':
          index = Math.min(100, 50 + Math.random() * 40); // Placeholder
          break;
      }

      return {
        sphereId: sphere.id,
        sphereKey: sphere.key as any,
        goalsProgress: index,
        habitsProgress: 0,
        activityScore: index > 0 ? 100 : 0,
        index: Math.round(index),
      };
    });
  }, [team, members, sprintTasks]);

  const sphereIndices = calculateSphereIndices();
  const teamIndex = sphereIndices.length > 0
    ? Math.round(sphereIndices.reduce((s, si) => s + si.index, 0) / sphereIndices.length)
    : 0;

  if (!team) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="max-w-md mx-auto px-4 py-12 text-center">
          <Users className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">{isRu ? 'Создайте или присоединитесь к команде' : 'Create or join a team'}</p>
          <Button onClick={() => navigate('/team')} className="mt-4">{isRu ? 'Перейти' : 'Go'}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{isRu ? 'Фокус команды' : 'Team Focus'}</h1>
              <p className="text-sm text-muted-foreground">{team.name}</p>
            </div>
          </div>
        </div>

        {/* Balance Flower */}
        <Card className="p-4">
          <p className="text-sm text-muted-foreground text-center mb-2">
            {isRu ? 'Баланс 8 сфер команды' : 'Balance of 8 team spheres'}
          </p>
          <BalanceFlower
            sphereIndices={sphereIndices}
            lifeIndex={teamIndex}
          />
        </Card>

        {/* Sphere Cards */}
        <div className="grid grid-cols-2 gap-3">
          {TEAM_SPHERES.map((sphere, i) => {
            const si = sphereIndices.find(s => s.sphereId === sphere.id);
            const indexValue = si?.index || 0;
            return (
              <motion.div
                key={sphere.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${sphere.color}20` }}
                    >
                      {sphere.icon}
                    </div>
                    <p className="font-medium text-sm truncate flex-1">
                      {isRu ? sphere.name_ru : sphere.name_en}
                    </p>
                    <span className="text-sm font-bold">{Math.round(indexValue / 10)}/10</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: sphere.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${indexValue}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 truncate">
                    {sphere.formula.split(' ')[0]}
                  </p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
