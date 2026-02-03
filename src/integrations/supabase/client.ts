// Supabase client with reverse proxy support for bypassing blocks
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use reverse proxy path to hide direct supabase.co requests
// In production (Vercel), use the app's origin + proxy path
// In development, Vite proxy handles it, but SDK still needs full URL
const getSupabaseUrl = () => {
  if (typeof window === 'undefined') {
    return "https://jexrtsyokhegjxnvqjur.supabase.co";
  }
  
  const origin = window.location.origin;
  
  // Only use proxy for custom domain top-focus.ru
  if (origin.includes('top-focus.ru')) {
    return `${origin}/_supabase`;
  }
  
  // For Lovable preview, development, Telegram WebApp, and any other context
  // use direct Supabase URL
  return "https://jexrtsyokhegjxnvqjur.supabase.co";
};

const SUPABASE_URL = getSupabaseUrl();
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpleHJ0c3lva2hlZ2p4bnZxanVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MDA4MTcsImV4cCI6MjA4MDk3NjgxN30.tI3L5GGJMtlXwlNEM-6EsxyQ5BRNrsoP-jk4mzD01_o";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});