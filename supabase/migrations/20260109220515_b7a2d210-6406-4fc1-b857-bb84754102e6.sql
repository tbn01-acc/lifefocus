-- =============================================
-- AFFILIATE 2.0: Progressive commission system
-- =============================================

-- Add new columns to referral_earnings for milestone bonuses
ALTER TABLE public.referral_earnings
ADD COLUMN IF NOT EXISTS milestone_bonus_rub numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS milestone_type text;

-- =============================================
-- STAR RATING SYSTEM: Points and streaks
-- =============================================

-- User stars and streaks table
CREATE TABLE IF NOT EXISTS public.user_stars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  total_stars integer NOT NULL DEFAULT 0,
  current_streak_days integer NOT NULL DEFAULT 0,
  longest_streak_days integer NOT NULL DEFAULT 0,
  last_activity_date date,
  freeze_available boolean DEFAULT true,
  freeze_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_stars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stars"
ON public.user_stars FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stars"
ON public.user_stars FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stars"
ON public.user_stars FOR UPDATE
USING (auth.uid() = user_id);

-- Star transactions log
CREATE TABLE IF NOT EXISTS public.star_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  transaction_type text NOT NULL, -- 'task', 'habit', 'daily_login', 'streak_bonus', 'achievement_post', 'freeze_purchase', 'reward_purchase'
  description text,
  reference_id uuid, -- task_id, habit_id, post_id, etc.
  timer_minutes integer, -- Duration of focus timer used
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.star_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own star transactions"
ON public.star_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own star transactions"
ON public.star_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Daily verified tasks counter
CREATE TABLE IF NOT EXISTS public.daily_verified_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity_date date NOT NULL,
  verified_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, activity_date)
);

ALTER TABLE public.daily_verified_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily tasks"
ON public.daily_verified_tasks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily tasks"
ON public.daily_verified_tasks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily tasks"
ON public.daily_verified_tasks FOR UPDATE
USING (auth.uid() = user_id);

-- =============================================
-- ACHIEVEMENTS FEED (Mini Social Network)
-- =============================================

-- Achievement posts table
CREATE TABLE IF NOT EXISTS public.achievement_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  image_url text NOT NULL,
  description text,
  task_id uuid,
  habit_id uuid,
  likes_count integer NOT NULL DEFAULT 0,
  dislikes_count integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.achievement_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible posts"
ON public.achievement_posts FOR SELECT
USING (is_visible = true);

CREATE POLICY "Users can create their own posts"
ON public.achievement_posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
ON public.achievement_posts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
ON public.achievement_posts FOR DELETE
USING (auth.uid() = user_id);

-- Post reactions (likes/dislikes)
CREATE TABLE IF NOT EXISTS public.post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.achievement_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reactions"
ON public.post_reactions FOR SELECT
USING (true);

CREATE POLICY "Users can add their own reactions"
ON public.post_reactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reactions"
ON public.post_reactions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
ON public.post_reactions FOR DELETE
USING (auth.uid() = user_id);

-- Post comments
CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.achievement_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible comments"
ON public.post_comments FOR SELECT
USING (is_visible = true);

CREATE POLICY "Users can add their own comments"
ON public.post_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON public.post_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.post_comments FOR DELETE
USING (auth.uid() = user_id);

-- Daily post counter
CREATE TABLE IF NOT EXISTS public.daily_post_count (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  post_date date NOT NULL,
  post_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_date)
);

ALTER TABLE public.daily_post_count ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own post count"
ON public.daily_post_count FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own post count"
ON public.daily_post_count FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own post count"
ON public.daily_post_count FOR UPDATE
USING (auth.uid() = user_id);

-- =============================================
-- PUBLIC PROFILES & TOP-100
-- =============================================

-- Add public profile fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS telegram_username text,
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ban_until timestamptz,
ADD COLUMN IF NOT EXISTS ban_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS read_only_until timestamptz;

-- =============================================
-- REWARDS SHOP
-- =============================================

CREATE TABLE IF NOT EXISTS public.rewards_shop (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_stars integer NOT NULL,
  reward_type text NOT NULL, -- 'freeze', 'pro_discount', 'custom'
  reward_value jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rewards_shop ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active rewards"
ON public.rewards_shop FOR SELECT
USING (is_active = true);

-- Purchased rewards
CREATE TABLE IF NOT EXISTS public.purchased_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reward_id uuid NOT NULL REFERENCES public.rewards_shop(id),
  stars_spent integer NOT NULL,
  is_used boolean DEFAULT false,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.purchased_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own purchased rewards"
ON public.purchased_rewards FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchased rewards"
ON public.purchased_rewards FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchased rewards"
ON public.purchased_rewards FOR UPDATE
USING (auth.uid() = user_id);

-- =============================================
-- Insert default shop items
-- =============================================

INSERT INTO public.rewards_shop (name, description, price_stars, reward_type, reward_value)
VALUES 
  ('Заморозка серии', 'Сохраните вашу серию при пропуске 1 дня', 25, 'freeze', '{"freeze_days": 1}'::jsonb),
  ('Скидка 10% на PRO', 'Получите скидку на подписку PRO', 100, 'pro_discount', '{"discount_percent": 10}'::jsonb),
  ('Скидка 25% на PRO', 'Получите большую скидку на подписку PRO', 200, 'pro_discount', '{"discount_percent": 25}'::jsonb)
ON CONFLICT DO NOTHING;

-- =============================================
-- TRIGGERS
-- =============================================

-- Update reaction counts on achievement_posts
CREATE OR REPLACE FUNCTION public.update_post_reaction_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.reaction_type = 'like' THEN
      UPDATE achievement_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSE
      UPDATE achievement_posts SET dislikes_count = dislikes_count + 1 WHERE id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.reaction_type = 'like' THEN
      UPDATE achievement_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
    ELSE
      UPDATE achievement_posts SET dislikes_count = GREATEST(0, dislikes_count - 1) WHERE id = OLD.post_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.reaction_type = 'like' AND NEW.reaction_type = 'dislike' THEN
      UPDATE achievement_posts SET likes_count = GREATEST(0, likes_count - 1), dislikes_count = dislikes_count + 1 WHERE id = NEW.post_id;
    ELSIF OLD.reaction_type = 'dislike' AND NEW.reaction_type = 'like' THEN
      UPDATE achievement_posts SET dislikes_count = GREATEST(0, dislikes_count - 1), likes_count = likes_count + 1 WHERE id = NEW.post_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER on_post_reaction_change
AFTER INSERT OR UPDATE OR DELETE ON public.post_reactions
FOR EACH ROW EXECUTE FUNCTION public.update_post_reaction_counts();

-- Update comment counts
CREATE OR REPLACE FUNCTION public.update_post_comment_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE achievement_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE achievement_posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER on_post_comment_change
AFTER INSERT OR DELETE ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.update_post_comment_counts();

-- Update user_stars updated_at
CREATE TRIGGER update_user_stars_updated_at
BEFORE UPDATE ON public.user_stars
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Storage bucket for achievement images
-- =============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('achievements', 'achievements', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view achievement images"
ON storage.objects FOR SELECT
USING (bucket_id = 'achievements');

CREATE POLICY "Authenticated users can upload achievement images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'achievements' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own achievement images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'achievements' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own achievement images"
ON storage.objects FOR DELETE
USING (bucket_id = 'achievements' AND auth.uid()::text = (storage.foldername(name))[1]);