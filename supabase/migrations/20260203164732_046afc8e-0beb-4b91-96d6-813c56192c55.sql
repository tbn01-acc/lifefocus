-- ШАГ 1: Обновление таблицы profiles и добавление недостающей логики

-- Убедимся, что telegram_id имеет правильный тип и уникальный индекс
DO $$ 
BEGIN
  -- Добавляем уникальный индекс на telegram_id если его нет
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'profiles' AND indexname = 'profiles_telegram_id_unique'
  ) THEN
    CREATE UNIQUE INDEX profiles_telegram_id_unique ON public.profiles(telegram_id) WHERE telegram_id IS NOT NULL;
  END IF;
END $$;

-- Обновляем функцию handle_new_user для корректной обработки данных
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  tg_id BIGINT;
  tg_username TEXT;
BEGIN
  -- Извлекаем telegram_id если есть
  tg_id := (NEW.raw_user_meta_data->>'telegram_id')::BIGINT;
  tg_username := NEW.raw_user_meta_data->>'telegram_username';
  
  INSERT INTO public.profiles (
    user_id,
    display_name,
    full_name,
    avatar_url,
    telegram_id,
    telegram_username,
    email
  )
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'username', 
      NEW.raw_user_meta_data->>'full_name', 
      'user_' || substr(NEW.id::text, 1, 8)
    ),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    tg_id,
    tg_username,
    NEW.email
  )
  ON CONFLICT (user_id) DO UPDATE SET
    telegram_id = COALESCE(EXCLUDED.telegram_id, profiles.telegram_id),
    telegram_username = COALESCE(EXCLUDED.telegram_username, profiles.telegram_username),
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Убедимся что триггер существует
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RPC функция для атомарной привязки Telegram ID к текущему пользователю
CREATE OR REPLACE FUNCTION public.link_telegram_account(tg_id BIGINT, tg_username TEXT DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_user_id UUID;
  existing_profile RECORD;
  result jsonb;
BEGIN
  -- Получаем текущего пользователя
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Проверяем, не привязан ли уже этот Telegram к другому аккаунту
  SELECT * INTO existing_profile 
  FROM public.profiles 
  WHERE telegram_id = tg_id AND user_id != current_user_id;
  
  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Telegram account already linked to another user',
      'existing_user_id', existing_profile.user_id
    );
  END IF;
  
  -- Обновляем профиль текущего пользователя
  UPDATE public.profiles
  SET 
    telegram_id = tg_id,
    telegram_username = COALESCE(tg_username, telegram_username),
    updated_at = now()
  WHERE user_id = current_user_id;
  
  IF NOT FOUND THEN
    -- Создаем профиль если его нет
    INSERT INTO public.profiles (user_id, telegram_id, telegram_username)
    VALUES (current_user_id, tg_id, tg_username);
  END IF;
  
  RETURN jsonb_build_object('success', true, 'user_id', current_user_id);
END;
$$;

-- Функция для поиска пользователя по Telegram ID
CREATE OR REPLACE FUNCTION public.find_user_by_telegram(tg_id BIGINT)
RETURNS TABLE(user_id UUID, display_name TEXT, avatar_url TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT p.user_id, p.display_name, p.avatar_url
  FROM public.profiles p
  WHERE p.telegram_id = tg_id
  LIMIT 1;
END;
$$;