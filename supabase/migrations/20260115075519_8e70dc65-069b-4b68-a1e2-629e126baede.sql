-- Add 'team' role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'team';

-- Create leaderboard aggregation table for period-based ratings
CREATE TABLE IF NOT EXISTS public.leaderboard_aggregates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_type text NOT NULL, -- 'today', 'month', 'year', 'all'
  period_key text NOT NULL, -- e.g., '2026-01-15', '2026-01', '2026', 'all'
  total_stars integer NOT NULL DEFAULT 0,
  total_likes integer NOT NULL DEFAULT 0,
  total_activity_score integer NOT NULL DEFAULT 0,
  habits_completed integer NOT NULL DEFAULT 0,
  tasks_completed integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_type, period_key)
);

-- Enable RLS
ALTER TABLE public.leaderboard_aggregates ENABLE ROW LEVEL SECURITY;

-- RLS policies for leaderboard_aggregates
CREATE POLICY "Leaderboard aggregates are viewable by everyone"
ON public.leaderboard_aggregates FOR SELECT
USING (true);

CREATE POLICY "Users can update their own aggregates"
ON public.leaderboard_aggregates FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own aggregates"
ON public.leaderboard_aggregates FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_aggregates_period 
ON public.leaderboard_aggregates(period_type, period_key, total_stars DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_aggregates_likes 
ON public.leaderboard_aggregates(period_type, period_key, total_likes DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_aggregates_activity 
ON public.leaderboard_aggregates(period_type, period_key, total_activity_score DESC);

-- Add team role for serge101.pro@gmail.com
-- First get user_id from auth.users then insert role
-- This will be done via the application

-- Create cloud_user_settings table for PRO user cloud sync
CREATE TABLE IF NOT EXISTS public.cloud_user_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  widget_settings jsonb DEFAULT '{}',
  notification_settings jsonb DEFAULT '{}',
  celebration_settings jsonb DEFAULT '{}',
  theme_settings jsonb DEFAULT '{}',
  dashboard_layout jsonb DEFAULT '{}',
  general_settings jsonb DEFAULT '{}',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cloud_user_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own settings"
ON public.cloud_user_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
ON public.cloud_user_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
ON public.cloud_user_settings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings"
ON public.cloud_user_settings FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_cloud_user_settings_updated_at
BEFORE UPDATE ON public.cloud_user_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leaderboard_aggregates_updated_at
BEFORE UPDATE ON public.leaderboard_aggregates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();