import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { PomodoroProvider } from "@/contexts/PomodoroContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useReferralActivityTracker } from "@/hooks/useReferralActivityTracker";
import { useReferralNotifications } from "@/hooks/useReferralNotifications";
import { useCloudSync } from "@/hooks/useCloudSync";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { CloudRestoreDialog } from "@/components/profile/CloudRestoreDialog";
import { TelegramBlockedScreen } from "@/components/TelegramBlockedScreen";

// Импорт страниц
import Dashboard from "./pages/Dashboard";
import Habits from "./pages/Habits";
import Tasks from "./pages/Tasks";
import Finance from "./pages/Finance";
import Services from "./pages/Services";
import Statistics from "./pages/Statistics";
import Profile from "./pages/Profile";
import ProfileSettings from "./pages/ProfileSettings";
import PublicProfilePreview from "./pages/PublicProfilePreview";
import UserCatalog from "./pages/UserCatalog";
import Achievements from "./pages/Achievements";
import PartnerProgram from "./pages/PartnerProgram";
import AboutApp from "./pages/AboutApp";
import News from "./pages/News";
import Auth from "./pages/Auth";
import Upgrade from "./pages/Upgrade";
import Admin from "./pages/Admin";
import TagPage from "./pages/TagPage";
import Rating from "./pages/Rating";
import RewardsShop from "./pages/RewardsShop";
import StarHistory from "./pages/StarHistory";
import Archive from "./pages/Archive";
import Focus from "./pages/Focus";
import UserProfile from "./pages/UserProfile";
import Notifications from "./pages/Notifications";
import Goals from "./pages/Goals";
import GoalDetail from "./pages/GoalDetail";
import LifeFocus from "./pages/LifeFocus";
import SphereDetail from "./pages/SphereDetail";
import NotFound from "./pages/NotFound";
import DayPlan from "./pages/DayPlan";
import DaySummary from "./pages/DaySummary";

const queryClient = new QueryClient();

// Компонент загрузки
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <span className="text-muted-foreground">Загрузка профиля...</span>
    </div>
  </div>
);

const CloudSyncProvider = ({ children }: { children: React.ReactNode }) => {
  const { triggerSync } = useCloudSync();

  useEffect(() => {
    const handleStorageChange = () => triggerSync();
    window.addEventListener('habitflow-data-changed', handleStorageChange);
    return () => window.removeEventListener('habitflow-data-changed', handleStorageChange);
  }, [triggerSync]);

  return <>{children}</>;
};

const SubscriptionWrapper = ({ children }: { children: React.ReactNode }) => {
  const { user, profile } = useAuth();
  return (
    <SubscriptionProvider user={user} referralCode={profile?.referral_code || null}>
      {children}
    </SubscriptionProvider>
  );
};

const AppContent = () => {
  const [habitDialogOpen, setHabitDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);

  // Используем новый AuthProvider
  const { loading, isBlocked, error, isInTelegram } = useAuth();

  // Стандартные трекеры
  useReferralActivityTracker();
  useReferralNotifications();

  // Показываем загрузку
  if (loading) {
    return <LoadingScreen />;
  }

  // Если пользователь в Telegram и отказал в доступе
  if (isBlocked) {
    return <TelegramBlockedScreen message={error || undefined} />;
  }

  return (
    <CloudSyncProvider>
      <CloudRestoreDialog />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/habits" element={<Habits openDialog={habitDialogOpen} onDialogClose={() => setHabitDialogOpen(false)} />} />
        <Route path="/tasks" element={<Tasks openDialog={taskDialogOpen} onDialogClose={() => setTaskDialogOpen(false)} />} />
        <Route path="/finance" element={<Finance openDialog={transactionDialogOpen} onDialogClose={() => setTransactionDialogOpen(false)} />} />
        <Route path="/services" element={<Services />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/settings" element={<ProfileSettings />} />
        <Route path="/profile/public" element={<PublicProfilePreview />} />
        <Route path="/users" element={<UserCatalog />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/partner-program" element={<PartnerProgram />} />
        <Route path="/about" element={<AboutApp />} />
        <Route path="/news" element={<News />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/upgrade" element={<Upgrade />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/tag/:tagId" element={<TagPage />} />
        <Route path="/rating" element={<Rating />} />
        <Route path="/rewards" element={<RewardsShop />} />
        <Route path="/star-history" element={<StarHistory />} />
        <Route path="/archive" element={<Archive />} />
        <Route path="/focus" element={<Focus />} />
        <Route path="/user/:userId" element={<UserProfile />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/goals/:id" element={<GoalDetail />} />
        <Route path="/life-focus" element={<LifeFocus />} />
        <Route path="/sphere/:sphereKey" element={<SphereDetail />} />
        <Route path="/day-plan" element={<DayPlan />} />
        <Route path="/day-summary" element={<DaySummary />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNavigation 
        onAddHabit={() => setHabitDialogOpen(true)}
        onAddTask={() => setTaskDialogOpen(true)}
        onAddTransaction={() => setTransactionDialogOpen(true)}
      />
    </CloudSyncProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <PomodoroProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <SubscriptionWrapper>
                <AppContent />
              </SubscriptionWrapper>
            </BrowserRouter>
          </TooltipProvider>
        </PomodoroProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
