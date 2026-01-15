import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/contexts/LanguageContext';
import { useLeaderboard, PublicProfile } from '@/hooks/useLeaderboard';
import { useLeaderboardAggregates, LeaderboardPeriod, LeaderboardType } from '@/hooks/useLeaderboardAggregates';
import { useAchievementsFeed } from '@/hooks/useAchievementsFeed';
import { useStars } from '@/hooks/useStars';
import { useAuth } from '@/hooks/useAuth';
import { useRewardsShop } from '@/hooks/useRewardsShop';
import { fetchUserRewardItemsBatch, UserRewardItems } from '@/hooks/useUserRewardItems';
import { AppHeader } from '@/components/AppHeader';
import { AchievementPublishDialog } from '@/components/AchievementPublishDialog';
import { PublicProfileEditDialog } from '@/components/profile/PublicProfileEditDialog';
import { ContactsGatedDialog } from '@/components/profile/ContactsGatedDialog';
import { RewardsShopTab } from '@/components/rewards/RewardsShopTab';
import { UserAvatarWithFrame } from '@/components/rewards/UserAvatarWithFrame';
import { UserBadges } from '@/components/rewards/UserBadges';
import { TopThreePodium } from '@/components/rating/TopThreePodium';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Trophy, Star, Flame, ThumbsUp, ThumbsDown, MessageCircle, Send, User, Plus, Settings, Phone, ShoppingBag, Heart, Zap, Calendar, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function Rating() {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const isRussian = language === 'ru';
  const { user, profile } = useAuth();
  const { leaderboard: baseLeaderboard, currentUserRank: baseUserRank, loading: baseLoading, getPublicProfile } = useLeaderboard();
  const { 
    leaderboard: aggregateLeaderboard, 
    currentUserRank: aggregateUserRank, 
    loading: aggregateLoading, 
    period, 
    setPeriod, 
    type, 
    setType 
  } = useLeaderboardAggregates();
  const { 
    posts, 
    loading: feedLoading, 
    sortBy, 
    setSortBy, 
    reactToPost, 
    fetchComments, 
    addComment,
    dailyPostCount,
    dailyLimit
  } = useAchievementsFeed();
  const { userStars } = useStars();
  const { rewards, purchasedRewards, loading: rewardsLoading, userStars: shopStars, purchaseReward, useReward, getUnusedRewards } = useRewardsShop();

  const [activeTab, setActiveTab] = useState<'leaderboard' | 'feed' | 'rewards'>('leaderboard');
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('stars');
  const [selectedProfile, setSelectedProfile] = useState<PublicProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showProfileEditDialog, setShowProfileEditDialog] = useState(false);
  const [showContactsDialog, setShowContactsDialog] = useState(false);
  const [contactsProfile, setContactsProfile] = useState<PublicProfile | null>(null);
  const [userRewards, setUserRewards] = useState<Map<string, UserRewardItems>>(new Map());

  // Use appropriate leaderboard based on type/period
  const leaderboard = leaderboardType === 'stars' && period === 'all' 
    ? baseLeaderboard.map(u => ({
        rank: u.rank,
        user_id: u.user_id,
        display_name: u.display_name,
        avatar_url: u.avatar_url,
        value: u.total_stars,
        is_current_user: u.is_current_user,
      }))
    : aggregateLeaderboard;
  
  const currentUserRank = leaderboardType === 'stars' && period === 'all' 
    ? baseUserRank ? {
        rank: baseUserRank.rank,
        user_id: baseUserRank.user_id,
        display_name: baseUserRank.display_name,
        avatar_url: baseUserRank.avatar_url,
        value: baseUserRank.total_stars,
        is_current_user: true,
      } : null
    : aggregateUserRank;
  
  const loading = leaderboardType === 'stars' && period === 'all' ? baseLoading : aggregateLoading;

  // Fetch reward items for leaderboard users
  useEffect(() => {
    if (leaderboard.length > 0) {
      const userIds = leaderboard.map(u => u.user_id);
      fetchUserRewardItemsBatch(userIds).then(setUserRewards);
    }
  }, [leaderboard]);

  // Update aggregate hook when type changes
  useEffect(() => {
    setType(leaderboardType);
  }, [leaderboardType, setType]);

  const handleUserClick = async (userId: string) => {
    setProfileLoading(true);
    const profile = await getPublicProfile(userId);
    setSelectedProfile(profile);
    setProfileLoading(false);
  };

  const handleOpenComments = async (postId: string) => {
    setSelectedPost(postId);
    setCommentsLoading(true);
    const postComments = await fetchComments(postId);
    setComments(postComments);
    setCommentsLoading(false);
  };

  const handleAddComment = async () => {
    if (!selectedPost || !newComment.trim()) return;
    
    const success = await addComment(selectedPost, newComment);
    if (success) {
      setNewComment('');
      const updatedComments = await fetchComments(selectedPost);
      setComments(updatedComments);
    }
  };

  const handleGetContacts = (profile: PublicProfile) => {
    setContactsProfile(profile);
    setShowContactsDialog(true);
    setSelectedProfile(null);
  };

  const getValueIcon = () => {
    switch (leaderboardType) {
      case 'likes': return <Heart className="h-4 w-4 text-pink-500 fill-pink-500" />;
      case 'activity': return <Zap className="h-4 w-4 text-blue-500" />;
      default: return <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />;
    }
  };

  const periodLabels: Record<LeaderboardPeriod, string> = {
    today: isRussian ? 'Сегодня' : 'Today',
    month: isRussian ? 'Месяц' : 'Month',
    year: isRussian ? 'Год' : 'Year',
    all: isRussian ? 'Всё время' : 'All time',
  };

  const topThree = leaderboard.slice(0, 3);
  const restOfLeaderboard = leaderboard.slice(3);

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      
      <main className="container max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Trophy className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold">
              {isRussian ? 'Рейтинг' : 'Rating'}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {userStars && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="cursor-pointer"
                onClick={() => navigate('/star-history')}
              >
                <Badge variant="secondary" className="text-lg px-3 py-1 gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  {userStars.total_stars}
                </Badge>
              </motion.div>
            )}

            {user && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowProfileEditDialog(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Quick Stats Buttons - Compact */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Button 
            variant="outline" 
            className="h-8 text-xs px-2 flex items-center gap-1"
            onClick={() => navigate('/star-history')}
          >
            <Star className="h-3 w-3 text-yellow-500" />
            <span className="truncate">{userStars?.total_stars || 0}</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-8 text-xs px-2 flex items-center gap-1"
          >
            <Trophy className="h-3 w-3 text-primary" />
            <span className="truncate">#{currentUserRank?.rank || '—'}</span>
          </Button>
          <Button 
            variant="default" 
            className="h-8 text-xs px-2 flex items-center gap-1"
            onClick={() => navigate('/achievements?tab=program')}
          >
            <TrendingUp className="h-3 w-3" />
            <span className="truncate">{isRussian ? 'Заработать' : 'Earn'}</span>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="leaderboard" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              {isRussian ? 'ТОП-100' : 'TOP-100'}
            </TabsTrigger>
            <TabsTrigger value="feed" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              {isRussian ? 'Лента' : 'Feed'}
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              {isRussian ? 'Награды' : 'Rewards'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard">
            {/* Type and Period Selectors */}
            <div className="flex flex-col gap-2 mb-4">
              {/* Leaderboard Type */}
              <div className="flex gap-1">
                <Button
                  variant={leaderboardType === 'stars' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 h-7 text-xs"
                  onClick={() => setLeaderboardType('stars')}
                >
                  <Star className="h-3 w-3 mr-1" />
                  {isRussian ? 'Звёзды' : 'Stars'}
                </Button>
                <Button
                  variant={leaderboardType === 'likes' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 h-7 text-xs"
                  onClick={() => setLeaderboardType('likes')}
                >
                  <Heart className="h-3 w-3 mr-1" />
                  {isRussian ? 'Лайки' : 'Likes'}
                </Button>
                <Button
                  variant={leaderboardType === 'activity' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 h-7 text-xs"
                  onClick={() => setLeaderboardType('activity')}
                >
                  <Zap className="h-3 w-3 mr-1" />
                  {isRussian ? 'Активность' : 'Activity'}
                </Button>
              </div>

              {/* Period Selector */}
              <div className="flex gap-1">
                {(['today', 'month', 'year', 'all'] as LeaderboardPeriod[]).map((p) => (
                  <Button
                    key={p}
                    variant={period === p ? 'secondary' : 'ghost'}
                    size="sm"
                    className="flex-1 h-6 text-xs"
                    onClick={() => setPeriod(p)}
                  >
                    {periodLabels[p]}
                  </Button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {/* Top 3 Podium */}
                {topThree.length > 0 && (
                  <TopThreePodium
                    users={topThree}
                    userRewards={userRewards}
                    onUserClick={handleUserClick}
                    valueIcon={getValueIcon()}
                  />
                )}

                {/* Rest of leaderboard */}
                <AnimatePresence>
                  {restOfLeaderboard.map((leaderboardUser, index) => (
                    <motion.div
                      key={leaderboardUser.user_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <Card 
                        className={`cursor-pointer hover:bg-accent/50 transition-colors ${
                          leaderboardUser.is_current_user ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => handleUserClick(leaderboardUser.user_id)}
                      >
                        <CardContent className="flex items-center gap-4 p-3">
                          <div className="w-6 flex justify-center">
                            <span className="text-xs font-medium text-muted-foreground">
                              #{leaderboardUser.rank}
                            </span>
                          </div>
                          
                          <UserAvatarWithFrame
                            avatarUrl={leaderboardUser.avatar_url}
                            displayName={leaderboardUser.display_name}
                            frameId={userRewards.get(leaderboardUser.user_id)?.activeFrame}
                            size="sm"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate text-sm">
                                {leaderboardUser.display_name}
                              </p>
                              {leaderboardUser.is_current_user && (
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {isRussian ? 'Вы' : 'You'}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 text-base font-semibold">
                            {getValueIcon()}
                            {leaderboardUser.value}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Current user if not in top 100 */}
                {currentUserRank && currentUserRank.rank > 100 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">
                      {isRussian ? 'Ваша позиция' : 'Your position'}
                    </p>
                    <Card className="ring-2 ring-primary">
                      <CardContent className="flex items-center gap-4 p-3">
                        <div className="w-6 flex justify-center">
                          <span className="text-xs font-medium">#{currentUserRank.rank}</span>
                        </div>
                        
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={currentUserRank.avatar_url || undefined} />
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <p className="font-medium text-sm">{currentUserRank.display_name}</p>
                        </div>
                        
                        <div className="flex items-center gap-1 text-base font-semibold">
                          {getValueIcon()}
                          {currentUserRank.value}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {leaderboard.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {isRussian ? 'Рейтинг пока пуст' : 'Leaderboard is empty'}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="feed">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant={sortBy === 'new' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('new')}
                >
                  {isRussian ? 'Новое' : 'New'}
                </Button>
                <Button
                  variant={sortBy === 'popular' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('popular')}
                >
                  {isRussian ? 'Популярное' : 'Popular'}
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {dailyPostCount}/{dailyLimit}
                </Badge>
                
                {user && (
                  <Button
                    size="sm"
                    onClick={() => setShowPublishDialog(true)}
                    disabled={dailyPostCount >= dailyLimit}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {isRussian ? 'Пост' : 'Post'}
                  </Button>
                )}
              </div>
            </div>

            {feedLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-64 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {posts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card>
                        <CardHeader className="pb-3">
                          <div 
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => handleUserClick(post.user_id)}
                          >
                            <UserAvatarWithFrame
                              avatarUrl={post.user_profile?.avatar_url}
                              displayName={post.user_profile?.display_name}
                              frameId={post.user_profile?.active_frame}
                              size="sm"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium truncate">
                                  {post.user_profile?.display_name || 'Пользователь'}
                                </p>
                                <UserBadges 
                                  badgeIds={post.user_profile?.active_badges || []}
                                  maxDisplay={2}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(post.created_at), 'dd MMM, HH:mm', { locale: ru })}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-3">
                          <img 
                            src={post.image_url} 
                            alt="Achievement" 
                            className="w-full rounded-lg object-cover max-h-80"
                          />
                          
                          {post.description && (
                            <p className="text-sm">{post.description}</p>
                          )}
                          
                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={post.user_reaction === 'like' ? 'text-green-500' : ''}
                                onClick={() => reactToPost(post.id, 'like')}
                              >
                                <ThumbsUp className={`h-4 w-4 mr-1 ${post.user_reaction === 'like' ? 'fill-current' : ''}`} />
                                {post.likes_count}
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                className={post.user_reaction === 'dislike' ? 'text-red-500' : ''}
                                onClick={() => reactToPost(post.id, 'dislike')}
                              >
                                <ThumbsDown className={`h-4 w-4 mr-1 ${post.user_reaction === 'dislike' ? 'fill-current' : ''}`} />
                                {post.dislikes_count}
                              </Button>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenComments(post.id)}
                            >
                              <MessageCircle className="h-4 w-4 mr-1" />
                              {post.comments_count}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {posts.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {isRussian ? 'Пока нет публикаций' : 'No posts yet'}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rewards">
            <RewardsShopTab
              rewards={rewards}
              purchasedRewards={purchasedRewards}
              loading={rewardsLoading}
              userStars={shopStars}
              purchaseReward={purchaseReward}
              useReward={useReward}
              getUnusedRewards={getUnusedRewards}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Profile Dialog */}
      <Dialog open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isRussian ? 'Профиль' : 'Profile'}</DialogTitle>
          </DialogHeader>
          
          {selectedProfile && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedProfile.avatar_url || undefined} />
                  <AvatarFallback>
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{selectedProfile.display_name}</h3>
                  {(selectedProfile.telegram_username) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 gap-2"
                      onClick={() => handleGetContacts(selectedProfile)}
                    >
                      <Phone className="h-4 w-4" />
                      {isRussian ? 'Получить контакты' : 'Get Contacts'}
                    </Button>
                  )}
                </div>
              </div>

              {selectedProfile.bio && (
                <p className="text-sm text-muted-foreground">{selectedProfile.bio}</p>
              )}

              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-3 text-center">
                    <Star className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                    <p className="text-lg font-bold">{selectedProfile.total_stars}</p>
                    <p className="text-xs text-muted-foreground">{isRussian ? 'Звёзд' : 'Stars'}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-3 text-center">
                    <Flame className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                    <p className="text-lg font-bold">{selectedProfile.current_streak_days}</p>
                    <p className="text-xs text-muted-foreground">{isRussian ? 'Дней' : 'Days'}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-3 text-center">
                    <User className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-lg font-bold">{selectedProfile.total_referrals}</p>
                    <p className="text-xs text-muted-foreground">{isRussian ? 'Рефералов' : 'Referrals'}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Contacts Gated Dialog */}
      <ContactsGatedDialog
        open={showContactsDialog}
        onOpenChange={setShowContactsDialog}
        telegramUsername={contactsProfile?.telegram_username || null}
        email={contactsProfile?.public_email || null}
        displayName={contactsProfile?.display_name || null}
      />

      {/* Comments Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{isRussian ? 'Комментарии' : 'Comments'}</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 pr-4">
            {commentsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map(comment => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.user_profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {comment.user_profile?.display_name || 'Пользователь'}
                      </p>
                      <p className="text-sm text-muted-foreground">{comment.content}</p>
                    </div>
                  </div>
                ))}
                
                {comments.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    {isRussian ? 'Пока нет комментариев' : 'No comments yet'}
                  </p>
                )}
              </div>
            )}
          </ScrollArea>
          
          {user ? (
            <div className="flex gap-2 pt-4 border-t">
              <Textarea
                placeholder={isRussian ? 'Написать комментарий...' : 'Write a comment...'}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[40px] resize-none"
              />
              <Button size="icon" onClick={handleAddComment} disabled={!newComment.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">
              {isRussian ? 'Войдите, чтобы оставить комментарий' : 'Sign in to comment'}
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Publish Achievement Dialog */}
      <AchievementPublishDialog
        open={showPublishDialog}
        onOpenChange={setShowPublishDialog}
      />

      {/* Profile Edit Dialog */}
      {user && profile && (
        <PublicProfileEditDialog
          open={showProfileEditDialog}
          onOpenChange={setShowProfileEditDialog}
          userId={user.id}
          currentData={{
            display_name: profile.display_name || '',
            avatar_url: profile.avatar_url || '',
            bio: (profile as any).bio || '',
            telegram_username: (profile as any).telegram_username || '',
            public_email: (profile as any).public_email || ''
          }}
          onUpdate={() => {}}
        />
      )}
    </div>
  );
}
