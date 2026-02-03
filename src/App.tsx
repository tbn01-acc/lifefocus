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
import { useAuth } from "@/hooks/useAuth";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth"; // Новый хук
import { CloudRestoreDialog } from "@/components/profile/CloudRestoreDialog";

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

// Компонент экрана блокировки для Telegram
const AccessDeniedOverlay = () => (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#1A1C1E', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 9999, padding: '20px', textAlign: 'center'
  }}>
    <div style={{ backgroundColor: '#FFF', padding: '30px', borderRadius: '20px', maxWidth: '400px' }}>
      <h2 style={{ color: '#E53E3E', marginBottom: '15px' }}>Доступ ограничен</h2>
      <p style={{ color: '#4A5568', marginBottom: '20px', lineHeight: '1.5' }}>
        Для использования <b>Top Focus</b> необходимо разрешить отправку сообщений. 
        Это обязательное условие для синхронизации аккаунта и работы уведомлений.
      </p>
      <button 
        onClick={() => window.location.reload()}
        style={{
          backgroundColor: '#0088CC', color: '#FFF', border: 'none',
          padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer'
        }}
      >
        Разрешить и войти
      </button>
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

  // 1. Внедрение универсальной авторизации и защиты
  const { isAccessDenied, isLoading: isAuthLoading } = useUnifiedAuth();

  // 2. Стандартные трекеры
  useReferralActivityTracker();
  useReferralNotifications();

  // Если идет процесс авторизации в Telegram
  if (isAuthLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <span>Загрузка профиля...</span>
      </div>
    );
  }

  // Если пользователь в TG отказал в доступе к сообщениям
  if (isAccessDenied) {
    return <AccessDeniedOverlay />;
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
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
