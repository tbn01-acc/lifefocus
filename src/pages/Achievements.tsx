import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, ArrowLeft, Trophy, Lock, Zap, Target, CheckCircle2, Star, TrendingUp, Crown } from 'lucide-react';
import { Achievements as AchievementsComponent } from '@/components/Achievements';
import { StarProgramTab } from '@/components/rating/StarProgramTab';
import { AppHeader } from '@/components/AppHeader';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useUserLevel } from '@/hooks/useUserLevel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AchievementsPage() {
  const { language } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const { currentPlan, loading: subLoading } = useSubscription();
  const { levelInfo, loading: levelLoading, getLevelTitle, getLevelColor, XP_REWARDS } = useUserLevel();
  const isRussian = language === 'ru';
  const isPro = currentPlan === 'pro';
  
  const defaultTab = searchParams.get('tab') || 'achievements';

  if (loading || subLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          {isRussian ? 'Загрузка...' : 'Loading...'}
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/profile');
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {isRussian ? 'Награды и достижения' : 'Rewards & Achievements'}
              </h1>
            </div>
          </div>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="achievements">
              <Award className="w-4 h-4 mr-2" />
              {isRussian ? 'Бейджи и Уровень' : 'Badges & Level'}
            </TabsTrigger>
            <TabsTrigger value="program">
              <Star className="w-4 h-4 mr-2" />
              {isRussian ? 'Звёздная программа' : 'Star Program'}
            </TabsTrigger>
          </TabsList>

          {/* Badges & Level Tab */}
          <TabsContent value="achievements">
            <Tabs defaultValue="badges" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="badges" className="text-xs">
                  <Award className="w-3 h-3 mr-1" />
                  {isRussian ? 'Бейджи' : 'Badges'}
                </TabsTrigger>
                <TabsTrigger value="level" className="text-xs relative">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {isRussian ? 'Уровень' : 'Level'}
                  {!isPro && <Lock className="w-3 h-3 ml-1 text-muted-foreground" />}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="badges">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <AchievementsComponent />
                </motion.div>
              </TabsContent>

              <TabsContent value="level">
                {!isPro ? (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-yellow-500/5">
                      <CardContent className="p-6 text-center space-y-4">
                        <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center">
                          <Crown className="w-8 h-8 text-amber-500" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-foreground mb-2">
                            {isRussian ? 'Система уровней — PRO' : 'Level System — PRO'}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            {isRussian ? 'Получайте XP и повышайте уровень!' : 'Earn XP and level up!'}
                          </p>
                        </div>
                        <Button onClick={() => navigate('/upgrade')} className="bg-gradient-to-r from-amber-500 to-yellow-500">
                          <Crown className="w-4 h-4 mr-2" />
                          {isRussian ? 'Перейти на PRO' : 'Upgrade to PRO'}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : levelInfo && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <Card className={`border-0 bg-gradient-to-br ${getLevelColor(levelInfo.level)} text-white`}>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                            <span className="text-2xl font-bold">{levelInfo.level}</span>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm opacity-80">{isRussian ? 'Ваш уровень' : 'Your Level'}</div>
                            <div className="text-xl font-bold">{getLevelTitle(levelInfo.level, language)}</div>
                            <Progress value={levelInfo.progressPercent} className="h-2 mt-2 bg-white/20" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Star Program Tab */}
          <TabsContent value="program">
            <StarProgramTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
