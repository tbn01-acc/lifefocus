// Supabase client with reverse proxy support for bypassing blocks in Russia
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Direct Supabase URL for fallback
const DIRECT_SUPABASE_URL = "https://jexrtsyokhegjxnvqjur.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpleHJ0c3lva2hlZ2p4bnZxanVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MDA4MTcsImV4cCI6MjA4MDk3NjgxN30.tI3L5GGJMtlXwlNEM-6EsxyQ5BRNrsoP-jk4mzD01_o";

/**
 * Get Supabase URL based on environment
 * - top-focus.ru: Use /_supabase proxy to bypass Russian blocks
 * - Other environments: Use direct Supabase URL
 */
const getSupabaseUrl = (): string => {
  // Server-side rendering fallback
  if (typeof window === 'undefined') {
    return DIRECT_SUPABASE_URL;
  }
  
  const hostname = window.location.hostname;
  
  // Use reverse proxy only on production domain top-focus.ru
  if (hostname === 'top-focus.ru' || hostname.endsWith('.top-focus.ru')) {
    return `${window.location.origin}/_supabase`;
  }
  
  // All other environments (Lovable preview, localhost, Telegram WebApp iframe)
  // use direct Supabase URL
  return DIRECT_SUPABASE_URL;
};

/**
 * Get custom headers for requests
 * Adds x-app-source header for proxy identification
 */
const getCustomHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {};
  
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'top-focus.ru' || hostname.endsWith('.top-focus.ru')) {
      headers['x-app-source'] = 'top-focus-pwa';
    }
  }
  
  return headers;
};

const SUPABASE_URL = getSupabaseUrl();

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: getCustomHeaders(),
  },
});

// Export URL for debugging
export const getActiveSupabaseUrl = () => SUPABASE_URL;