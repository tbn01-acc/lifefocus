import { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { BottomNavigation } from "@/components/BottomNavigation";
import Dashboard from "./pages/Dashboard";
import Habits from "./pages/Habits";
import Tasks from "./pages/Tasks";
import Finance from "./pages/Finance";
import Fitness from "./pages/Fitness";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const [habitDialogOpen, setHabitDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [workoutDialogOpen, setWorkoutDialogOpen] = useState(false);

  return (
    <>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route 
          path="/habits" 
          element={
            <Habits 
              openDialog={habitDialogOpen} 
              onDialogClose={() => setHabitDialogOpen(false)} 
            />
          } 
        />
        <Route 
          path="/tasks" 
          element={
            <Tasks 
              openDialog={taskDialogOpen} 
              onDialogClose={() => setTaskDialogOpen(false)} 
            />
          } 
        />
        <Route 
          path="/finance" 
          element={
            <Finance 
              openDialog={transactionDialogOpen} 
              onDialogClose={() => setTransactionDialogOpen(false)} 
            />
          } 
        />
        <Route 
          path="/fitness" 
          element={
            <Fitness 
              openDialog={workoutDialogOpen} 
              onDialogClose={() => setWorkoutDialogOpen(false)} 
            />
          } 
        />
        <Route path="/profile" element={<Profile />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNavigation 
        onAddHabit={() => setHabitDialogOpen(true)}
        onAddTask={() => setTaskDialogOpen(true)}
        onAddTransaction={() => setTransactionDialogOpen(true)}
        onAddWorkout={() => setWorkoutDialogOpen(true)}
      />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
