import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Filter, TrendingUp, TrendingDown, Flame, CheckCircle, Target, Gift, Snowflake, Image } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useStars, StarTransaction } from '@/hooks/useStars';
import { useTranslation } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TRANSACTION_TYPES = [
  { value: 'all', label: 'Все', labelEn: 'All', icon: Star },
  { value: 'task', label: 'Задачи', labelEn: 'Tasks', icon: CheckCircle },
  { value: 'habit', label: 'Привычки', labelEn: 'Habits', icon: Target },
  { value: 'daily_login', label: 'Вход', labelEn: 'Login', icon: Flame },
  { value: 'streak_bonus', label: 'Серия', labelEn: 'Streak', icon: Flame },
  { value: 'achievement_post', label: 'Публикации', labelEn: 'Posts', icon: Image },
  { value: 'freeze_purchase', label: 'Заморозка', labelEn: 'Freeze', icon: Snowflake },
  { value: 'referral', label: 'Рефералы', labelEn: 'Referrals', icon: Gift },
];

export default function StarHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userStars, loading: starsLoading } = useStars();
  const { language } = useTranslation();
  const isRussian = language === 'ru';
  
  const [transactions, setTransactions] = useState<StarTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user, filter]);

  const fetchTransactions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('star_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200);

      if (filter !== 'all') {
        query = query.eq('transaction_type', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    const found = TRANSACTION_TYPES.find(t => t.value === type);
    if (found) {
      const Icon = found.icon;
      return <Icon className="h-4 w-4" />;
    }
    return <Star className="h-4 w-4" />;
  };

  const getTransactionLabel = (type: string) => {
    const found = TRANSACTION_TYPES.find(t => t.value === type);
    if (found) {
      return isRussian ? found.label : found.labelEn;
    }
    return type;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {isRussian ? 'Войдите, чтобы увидеть историю звёзд' : 'Sign in to see star history'}
            </p>
            <Button className="mt-4" onClick={() => navigate('/auth')}>
              {isRussian ? 'Войти' : 'Sign in'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold">
                {isRussian ? 'История звёзд' : 'Star History'}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        {starsLoading ? (
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : userStars && (
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Star className="h-6 w-6 mx-auto mb-2 text-yellow-500 fill-yellow-500" />
                <p className="text-2xl font-bold">{userStars.total_stars}</p>
                <p className="text-xs text-muted-foreground">
                  {isRussian ? 'Всего звёзд' : 'Total Stars'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Flame className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                <p className="text-2xl font-bold">{userStars.current_streak_days}</p>
                <p className="text-xs text-muted-foreground">
                  {isRussian ? 'Текущая серия' : 'Current Streak'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">{userStars.longest_streak_days}</p>
                <p className="text-xs text-muted-foreground">
                  {isRussian ? 'Рекорд' : 'Best Streak'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter */}
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={isRussian ? 'Фильтр' : 'Filter'} />
            </SelectTrigger>
            <SelectContent>
              {TRANSACTION_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <type.icon className="h-4 w-4" />
                    {isRussian ? type.label : type.labelEn}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Transactions List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {transactions.map((tx, index) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <Card>
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.amount > 0 
                          ? 'bg-green-500/10 text-green-500' 
                          : 'bg-red-500/10 text-red-500'
                      }`}>
                        {tx.amount > 0 ? (
                          <TrendingUp className="h-5 w-5" />
                        ) : (
                          <TrendingDown className="h-5 w-5" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="gap-1 text-xs">
                            {getTransactionIcon(tx.transaction_type)}
                            {getTransactionLabel(tx.transaction_type)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {tx.description || (isRussian ? 'Транзакция' : 'Transaction')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(tx.created_at), 'dd MMM, HH:mm', { locale: isRussian ? ru : undefined })}
                        </p>
                      </div>
                      
                      <div className={`text-lg font-bold flex items-center gap-1 ${
                        tx.amount > 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {transactions.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {isRussian ? 'Нет транзакций' : 'No transactions'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}