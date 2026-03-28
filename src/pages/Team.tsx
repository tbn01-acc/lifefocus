import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Zap, LayoutDashboard, Columns3, Trophy, Plus, 
  FolderKanban, Building2, Target, ArrowLeft, Compass, FlaskConical
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

import { useTranslation } from '@/contexts/LanguageContext';
import { useTeam } from '@/hooks/useTeam';
import { useAuth } from '@/hooks/useAuth';
import { useTeamExperience } from '@/hooks/useTeamExperience';
import { TeamOverview } from '@/components/team/TeamOverview';
import { SprintBurndownChart } from '@/components/team/SprintBurndownChart';
import { SprintKanban } from '@/components/team/SprintKanban';
import { SprintRetrospective } from '@/components/team/SprintRetrospective';
import { TeamMembers } from '@/components/team/TeamMembers';
import { CreateTeamDialog } from '@/components/team/CreateTeamDialog';
import { CreateSprintDialog } from '@/components/team/CreateSprintDialog';
import { DemoModeBanner, EmptyStateDemoBanner } from '@/components/team/DemoModeBanner';
import { DemoTeamOverview } from '@/components/team/DemoTeamOverview';
import { DemoBurndownChart } from '@/components/team/DemoBurndownChart';
import { DemoKanban } from '@/components/team/DemoKanban';
import { RetroPodium } from '@/components/team/RetroPodium';
import { TeamPublicProfile } from '@/components/team/TeamPublicProfile';
import { TeamWorkspaces } from '@/components/team/TeamWorkspaces';

function SkeletonTeam() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-[200px] rounded-xl" />
      </div>
    </div>
  );
}

// Demo mode view extracted
function DemoView({ experience, isRu }: { experience: any; isRu: boolean }) {
  const isTest = experience.mode === 'test';
  const d = experience.data;

  return (
    <div className="min-h-screen bg-background pb-24">
      <AnimatePresence>
        <DemoModeBanner
          mode={experience.mode}
          onExit={experience.exitMode}
          onSwitchToTest={experience.switchToTest}
          onReset={experience.resetTest}
        />
      </AnimatePresence>
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold">{d.teamName}</h1>
            <p className="text-xs text-muted-foreground">{d.sprint.title}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span>{d.sprint.completedSP}/{d.sprint.totalSP} SP</span>
          </div>
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="w-full grid grid-cols-4 h-9">
            <TabsTrigger value="overview" className="text-xs gap-1">
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isRu ? 'Обзор' : 'Overview'}</span>
            </TabsTrigger>
            <TabsTrigger value="kanban" className="text-xs gap-1">
              <Columns3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isRu ? 'Канбан' : 'Kanban'}</span>
            </TabsTrigger>
            <TabsTrigger value="retro" className="text-xs gap-1">
              <Trophy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isRu ? 'Ретро' : 'Retro'}</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="text-xs gap-1">
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isRu ? 'Состав' : 'Members'}</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <DemoTeamOverview data={d} />
            <DemoBurndownChart data={d} />
          </TabsContent>
          <TabsContent value="kanban">
            <DemoKanban data={d} onUpdateStatus={experience.updateTaskStatus} isReadOnly={!isTest} />
          </TabsContent>
          <TabsContent value="retro">
            <RetroPodium members={d.members} onAward={experience.awardMember} isTest={isTest} />
          </TabsContent>
          <TabsContent value="members">
            <div className="space-y-2">
              {d.members.map((m: any, i: number) => (
                <motion.div
                  key={m.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card/80 border border-border/50"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                    {m.name.split(' ').map((w: string) => w[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{m.name}</p>
                    <p className="text-[10px] text-muted-foreground">{m.role}</p>
                  </div>
                  <span className="text-[10px]">{m.status}</span>
                  <span className="text-[10px] text-yellow-500 font-medium">{m.xp.toLocaleString()} XP</span>
                  {isTest && (
                    <button className="text-[10px] text-yellow-500 hover:text-yellow-400" onClick={() => experience.awardMember(m.id)}>⭐</button>
                  )}
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function TeamPage() {
  const { language } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const {
    team, members, sprints, activeSprint, sprintTasks, sprintParticipants,
    dailyStats, feedback, loading,
    createTeam, createSprint, addSprintTask, updateTaskStatus,
    finishSprint, submitFeedback, joinTeam, inviteMember,
  } = useTeam();

  const experience = useTeamExperience();

  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [createSprintOpen, setCreateSprintOpen] = useState(false);

  if (loading || experience.switching) return <SkeletonTeam />;

  if (experience.mode !== 'real' && experience.data) {
    return <DemoView experience={experience} isRu={isRu} />;
  }

  // No team — show full interface with limited content and Test tab as default
  if (!team) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold">{isRu ? 'Командная работа' : 'Teamwork'}</h1>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/team-focus')} className="gap-1">
              <Compass className="w-4 h-4" />
              <span className="hidden sm:inline">{isRu ? 'Фокус' : 'Focus'}</span>
            </Button>
          </div>

          {/* Main Tabs — default to test */}
          <Tabs defaultValue="test" className="space-y-4">
            <TabsList className="w-full grid grid-cols-7 h-9">
              <TabsTrigger value="overview" className="text-xs gap-1" disabled>
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isRu ? 'Обзор' : 'Overview'}</span>
              </TabsTrigger>
              <TabsTrigger value="workspaces" className="text-xs gap-1" disabled>
                <FolderKanban className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isRu ? 'Проекты' : 'Projects'}</span>
              </TabsTrigger>
              <TabsTrigger value="kanban" className="text-xs gap-1" disabled>
                <Columns3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isRu ? 'Канбан' : 'Kanban'}</span>
              </TabsTrigger>
              <TabsTrigger value="retro" className="text-xs gap-1" disabled>
                <Trophy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isRu ? 'Ретро' : 'Retro'}</span>
              </TabsTrigger>
              <TabsTrigger value="members" className="text-xs gap-1" disabled>
                <Users className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isRu ? 'Состав' : 'Team'}</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="text-xs gap-1" disabled>
                <Building2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isRu ? 'Профиль' : 'Profile'}</span>
              </TabsTrigger>
              <TabsTrigger value="test" className="text-xs gap-1">
                <FlaskConical className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isRu ? 'Тест' : 'Test'}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="test">
              <div className="text-center py-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Users className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">{isRu ? 'Командная работа' : 'Teamwork'}</h2>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    {isRu
                      ? 'Создайте команду или присоединитесь по коду приглашения, чтобы запускать спринты, отслеживать прогресс и зарабатывать XP вместе.'
                      : 'Create a team or join by invite code to launch sprints, track progress and earn XP together.'}
                  </p>
                  <Button onClick={() => setCreateTeamOpen(true)} size="lg" className="w-full max-w-md mb-4">
                    <Users className="w-5 h-5 mr-2" />
                    {isRu ? 'Начать' : 'Get Started'}
                  </Button>
                  <div className="bg-card border border-border rounded-xl p-4 max-w-md mx-auto">
                    <h3 className="text-sm font-semibold mb-2">
                      {isRu ? 'Посмотрите, что сможет ВАША команда!' : 'See what YOUR team can do!'}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      {isRu
                        ? 'Загляните внутрь готовой команды из 12 специалистов. Канбан-доска, Burndown-чарт, пьедестал почёта и 24 задачи — всё работает.'
                        : 'Take a look inside a ready-made team of 12 specialists. Kanban board, Burndown chart, Hall of Fame and 24 tasks — everything works.'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button size="sm" variant="outline" onClick={experience.startDemo}>
                        {isRu ? '👀 Демо' : '👀 Demo'}
                      </Button>
                      <Button size="sm" onClick={experience.startTest}>
                        {isRu ? '🧪 Тест' : '🧪 Test'}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </TabsContent>
          </Tabs>

          <CreateTeamDialog open={createTeamOpen} onOpenChange={setCreateTeamOpen} onCreateTeam={createTeam} onJoinTeam={joinTeam} />
        </div>
      </div>
    );
  }

  // Real team view
  const completedSprints = sprints.filter(s => s.status === 'completed');
  const isOwner = user?.id === team.owner_id;
  const totalSP = sprintTasks.reduce((s, t) => s + (t.story_points || 0), 0);
  const completedSP = sprintTasks.filter(t => t.status === 'done').reduce((s, t) => s + (t.story_points || 0), 0);
  const sprintProgress = totalSP > 0 ? Math.round((completedSP / totalSP) * 100) : 0;
  const activeTasks = sprintTasks.filter(t => t.status !== 'done').length;
  const doneTasks = sprintTasks.filter(t => t.status === 'done').length;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{team.name}</h1>
            {team.description && (
              <p className="text-xs text-muted-foreground truncate">{team.description}</p>
            )}
          </div>
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" onClick={() => navigate('/team-focus')} className="gap-1">
              <Compass className="w-4 h-4" />
              <span className="hidden sm:inline">{isRu ? 'Фокус' : 'Focus'}</span>
            </Button>
            {isOwner && !activeSprint && (
              <Button size="sm" onClick={() => setCreateSprintOpen(true)}>
                <Zap className="w-4 h-4 mr-1" />
                {isRu ? 'Спринт' : 'Sprint'}
              </Button>
            )}
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <Card className="border-border/50">
            <CardContent className="p-2 text-center">
              <div className="text-lg font-bold">{members.length}</div>
              <div className="text-[10px] text-muted-foreground">{isRu ? 'Участники' : 'Members'}</div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-2 text-center">
              <div className="text-lg font-bold">{sprints.length}</div>
              <div className="text-[10px] text-muted-foreground">{isRu ? 'Спринты' : 'Sprints'}</div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-2 text-center">
              <div className="text-lg font-bold text-green-500">{doneTasks}</div>
              <div className="text-[10px] text-muted-foreground">{isRu ? 'Готово' : 'Done'}</div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-2 text-center">
              <div className="text-lg font-bold text-amber-500">{activeTasks}</div>
              <div className="text-[10px] text-muted-foreground">{isRu ? 'В работе' : 'Active'}</div>
            </CardContent>
          </Card>
        </div>

        {/* Sprint Progress Banner */}
        {activeSprint && (
          <Card className="mb-4 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-semibold">{activeSprint.title}</span>
                </div>
                <Badge variant="outline" className="text-xs">{completedSP}/{totalSP} SP</Badge>
              </div>
              <Progress value={sprintProgress} className="h-2" />
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="w-full grid grid-cols-7 h-9">
            <TabsTrigger value="overview" className="text-xs gap-1">
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isRu ? 'Обзор' : 'Overview'}</span>
            </TabsTrigger>
            <TabsTrigger value="workspaces" className="text-xs gap-1">
              <FolderKanban className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isRu ? 'Проекты' : 'Projects'}</span>
            </TabsTrigger>
            <TabsTrigger value="kanban" className="text-xs gap-1">
              <Columns3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isRu ? 'Канбан' : 'Kanban'}</span>
            </TabsTrigger>
            <TabsTrigger value="retro" className="text-xs gap-1">
              <Trophy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isRu ? 'Ретро' : 'Retro'}</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="text-xs gap-1">
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isRu ? 'Состав' : 'Team'}</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="text-xs gap-1">
              <Building2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isRu ? 'Профиль' : 'Profile'}</span>
            </TabsTrigger>
            <TabsTrigger value="test" className="text-xs gap-1">
              <FlaskConical className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isRu ? 'Тест' : 'Test'}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <TeamOverview members={members} activeSprint={activeSprint} sprintTasks={sprintTasks} />
            <SprintBurndownChart sprint={activeSprint} dailyStats={dailyStats} />
          </TabsContent>

          <TabsContent value="workspaces">
            <TeamWorkspaces teamId={team.id} isOwner={isOwner} />
          </TabsContent>

          <TabsContent value="kanban">
            {activeSprint ? (
              <SprintKanban
                tasks={sprintTasks}
                members={members}
                onUpdateStatus={updateTaskStatus}
                onAddTask={addSprintTask}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Columns3 className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground mb-3">
                  {isRu ? 'Запустите спринт, чтобы использовать Канбан-доску' : 'Start a sprint to use the Kanban board'}
                </p>
                {isOwner && (
                  <Button size="sm" onClick={() => setCreateSprintOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    {isRu ? 'Создать спринт' : 'Create Sprint'}
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="retro">
            <SprintRetrospective
              sprint={activeSprint}
              completedSprints={completedSprints}
              participants={sprintParticipants}
              tasks={sprintTasks}
              feedback={feedback}
              onFinishSprint={finishSprint}
              onSubmitFeedback={submitFeedback}
            />
          </TabsContent>

          <TabsContent value="members">
            <TeamMembers team={team} members={members} onInviteMember={inviteMember} />
          </TabsContent>

          <TabsContent value="profile">
            <TeamPublicProfile
              teamId={team.id}
              teamName={team.name}
              isOwner={isOwner}
              onUpdate={() => {}}
            />
          </TabsContent>

          <TabsContent value="test">
            <div className="text-center py-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Users className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2">{isRu ? 'Командная работа' : 'Teamwork'}</h2>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                  {isRu
                    ? 'Создайте команду или присоединитесь по коду приглашения, чтобы запускать спринты, отслеживать прогресс и зарабатывать XP вместе.'
                    : 'Create a team or join by invite code to launch sprints, track progress and earn XP together.'}
                </p>
                <div className="bg-card border border-border rounded-xl p-4 max-w-md mx-auto">
                  <h3 className="text-sm font-semibold mb-2">
                    {isRu ? 'Посмотрите, что сможет ВАША команда!' : 'See what YOUR team can do!'}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    {isRu
                      ? 'Загляните внутрь готовой команды из 12 специалистов. Канбан-доска, Burndown-чарт, пьедестал почёта и 24 задачи — всё работает.'
                      : 'Take a look inside a ready-made team of 12 specialists. Kanban board, Burndown chart, Hall of Fame and 24 tasks — everything works.'}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button size="sm" variant="outline" onClick={experience.startDemo}>
                      {isRu ? '👀 Демо' : '👀 Demo'}
                    </Button>
                    <Button size="sm" onClick={experience.startTest}>
                      {isRu ? '🧪 Тест' : '🧪 Test'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </TabsContent>
        </Tabs>

        <CreateSprintDialog
          open={createSprintOpen}
          onOpenChange={setCreateSprintOpen}
          members={members}
          onCreateSprint={createSprint}
        />
      </div>
    </div>
  );
}
