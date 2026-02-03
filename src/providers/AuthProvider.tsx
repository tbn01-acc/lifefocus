import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  telegram_id: number | null;
  telegram_username: string | null;
  email: string | null;
  is_public: boolean | null;
  referral_code: string | null;
  referred_by: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isInTelegram: boolean;
  telegramUser: TelegramUser | null;
  isBlocked: boolean;
  error: string | null;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithGitHub: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  linkTelegramAccount: () => Promise<{ error: Error | null }>;
  refetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Legacy hook support
export { useAuth as useAuthContext };

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInTelegram, setIsInTelegram] = useState(false);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const queryClient = useQueryClient();

  // Fetch user profile
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      setProfile(data as Profile);
      return data;
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      return null;
    }
  }, []);

  const refetchProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user?.id, fetchProfile]);

  // Telegram WebApp authentication
  const handleTelegramAuth = useCallback(async () => {
    const tg = (window as any).Telegram?.WebApp;
    
    if (!tg?.initData) {
      return false;
    }

    console.log('Telegram WebApp detected, attempting auth...');
    setIsInTelegram(true);
    
    // Parse user from initDataUnsafe
    if (tg.initDataUnsafe?.user) {
      setTelegramUser(tg.initDataUnsafe.user);
    }

    // Check write access permission
    const hasWriteAccess = tg.initDataUnsafe?.user?.allows_write_to_pm;
    
    if (!hasWriteAccess && tg.requestWriteAccess) {
      return new Promise<boolean>((resolve) => {
        tg.requestWriteAccess((allowed: boolean) => {
          if (!allowed) {
            setIsBlocked(true);
            setError('Для работы приложения необходимо разрешить отправку сообщений');
            setLoading(false);
            resolve(false);
          } else {
            setIsBlocked(false);
            resolve(true);
          }
        });
      });
    }

    try {
      // Call our edge function to authenticate
      const { data, error } = await supabase.functions.invoke('telegram-auth', {
        body: { initData: tg.initData }
      });

      if (error) {
        console.error('Telegram auth error:', error);
        setError('Ошибка авторизации через Telegram');
        return false;
      }

      if (data?.access_token && data?.refresh_token) {
        // Set the session
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });

        if (sessionError) {
          console.error('Session error:', sessionError);
          setError('Ошибка установки сессии');
          return false;
        }

        console.log('Telegram auth successful:', data.action);
        return true;
      }

      return false;
    } catch (err) {
      console.error('Telegram auth exception:', err);
      setError('Не удалось авторизоваться через Telegram');
      return false;
    }
  }, []);

  // Initialize auth
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        // Set up auth state listener first
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (!isMounted) return;
            
            setSession(session);
            setUser(session?.user ?? null);
            
            // Defer profile fetch
            if (session?.user) {
              setTimeout(() => {
                if (isMounted) {
                  fetchProfile(session.user.id);
                }
              }, 0);
            } else {
              setProfile(null);
            }

            // Invalidate queries on auth change
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
              queryClient.invalidateQueries();
            }
          }
        );

        // Check for Telegram WebApp first
        const checkTelegram = async () => {
          // Wait for Telegram SDK with polling (up to 3 seconds)
          let attempts = 0;
          const maxAttempts = 6;
          
          while (attempts < maxAttempts) {
            if ((window as any).Telegram?.WebApp?.initData) {
              break;
            }
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
          }

          const tg = (window as any).Telegram?.WebApp;
          
          if (tg?.initData) {
            tg.ready?.();
            tg.expand?.();
            
            const success = await handleTelegramAuth();
            if (success) {
              setLoading(false);
              return true;
            }
          }
          
          return false;
        };

        const telegramHandled = await checkTelegram();
        
        if (!telegramHandled) {
          // Standard Supabase auth
          const { data: { session } } = await supabase.auth.getSession();
          
          if (isMounted) {
            setSession(session);
            setUser(session?.user ?? null);
            
            if (session?.user) {
              await fetchProfile(session.user.id);
            }
          }
        }
        
        if (isMounted) {
          setLoading(false);
        }

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error('Auth init error:', err);
        if (isMounted) {
          setLoading(false);
          setError('Ошибка инициализации авторизации');
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [fetchProfile, handleTelegramAuth, queryClient]);

  // Auth methods
  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName,
          full_name: displayName,
        },
      },
    });
    
    return { error: error as Error | null };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
    return { error: error as Error | null };
  };

  const signInWithGitHub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/` },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    queryClient.clear();
    return { error: error as Error | null };
  };

  const linkTelegramAccount = async () => {
    const tg = (window as any).Telegram?.WebApp;
    
    if (!tg?.initData || !session?.access_token) {
      return { error: new Error('Telegram WebApp or session not available') };
    }

    try {
      const { data, error } = await supabase.functions.invoke('telegram-auth', {
        body: { 
          initData: tg.initData,
          action: 'link',
          currentToken: session.access_token,
        }
      });

      if (error) {
        return { error: error as Error };
      }

      if (data?.success) {
        await refetchProfile();
        return { error: null };
      }

      return { error: new Error(data?.error || 'Link failed') };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    isInTelegram,
    telegramUser,
    isBlocked,
    error,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithGitHub,
    signOut,
    linkTelegramAccount,
    refetchProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
