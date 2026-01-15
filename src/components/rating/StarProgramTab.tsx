import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Flame, CheckCircle2, Target, Zap, Gift, Award, TrendingUp, Users, Heart } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';
import { useStars } from '@/hooks/useStars';

export function StarProgramTab() {
  const { language } = useTranslation();
  const { userStars } = useStars();
  const isRussian = language === 'ru';

  const earnMethods = [
    {
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      title: isRussian ? 'Выполнение задачи' : 'Complete a task',
      stars: 1,
      description: isRussian ? 'За каждую выполненную задачу' : 'For each completed task',
    },
    {
      icon: <Target className="w-5 h-5 text-purple-500" />,
      title: isRussian ? 'Выполнение привычки' : 'Complete a habit',
      stars: 1,
      description: isRussian ? 'За каждую выполненную привычку' : 'For each completed habit',
    },
    {
      icon: <Flame className="w-5 h-5 text-orange-500" />,
      title: isRussian ? 'Серия 7 дней' : '7-day streak',
      stars: 5,
      description: isRussian ? 'Бонус за неделю активности' : 'Bonus for a week of activity',
    },
    {
      icon: <Zap className="w-5 h-5 text-yellow-500" />,
      title: isRussian ? 'Серия 30 дней' : '30-day streak',
      stars: 25,
      description: isRussian ? 'Бонус за месяц активности' : 'Bonus for a month of activity',
    },
    {
      icon: <Users className="w-5 h-5 text-blue-500" />,
      title: isRussian ? 'Приглашение друга' : 'Invite a friend',
      stars: 10,
      description: isRussian ? 'Когда друг зарегистрируется' : 'When friend registers',
    },
    {
      icon: <Heart className="w-5 h-5 text-pink-500" />,
      title: isRussian ? 'Получить лайк' : 'Receive a like',
      stars: 1,
      description: isRussian ? 'За лайк на вашу публикацию' : 'For a like on your post',
    },
  ];

  const spendMethods = [
    {
      icon: <Gift className="w-5 h-5 text-indigo-500" />,
      title: isRussian ? 'Заморозка серии' : 'Streak Freeze',
      stars: 50,
      description: isRussian ? 'Сохраните серию, если пропустили день' : 'Keep your streak if you missed a day',
    },
    {
      icon: <Award className="w-5 h-5 text-amber-500" />,
      title: isRussian ? 'Скидка на PRO' : 'PRO Discount',
      stars: 100,
      description: isRussian ? '10% скидка на подписку PRO' : '10% discount on PRO subscription',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Current Stars */}
      {userStars && (
        <Card className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isRussian ? 'Ваш баланс' : 'Your balance'}
                  </p>
                  <p className="text-2xl font-bold">{userStars.total_stars}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-orange-500">
                  <Flame className="w-4 h-4" />
                  <span className="font-medium">{userStars.current_streak_days}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isRussian ? 'дней подряд' : 'day streak'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* How to Earn */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            {isRussian ? 'Как заработать звёзды' : 'How to earn stars'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {earnMethods.map((method, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
            >
              <div className="p-2 rounded-lg bg-background">
                {method.icon}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{method.title}</p>
                <p className="text-xs text-muted-foreground">{method.description}</p>
              </div>
              <Badge variant="secondary" className="gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                +{method.stars}
              </Badge>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* How to Spend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Gift className="w-4 h-4 text-purple-500" />
            {isRussian ? 'На что потратить' : 'How to spend'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {spendMethods.map((method, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
            >
              <div className="p-2 rounded-lg bg-background">
                {method.icon}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{method.title}</p>
                <p className="text-xs text-muted-foreground">{method.description}</p>
              </div>
              <Badge variant="outline" className="gap-1">
                <Star className="w-3 h-3 text-yellow-500" />
                {method.stars}
              </Badge>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm mb-1">
                {isRussian ? 'Совет' : 'Tip'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isRussian 
                  ? 'Выполняйте задачи и привычки каждый день, чтобы накопить серию и получить бонусные звёзды!'
                  : 'Complete tasks and habits every day to build a streak and earn bonus stars!'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
