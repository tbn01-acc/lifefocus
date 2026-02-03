import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app-source',
};

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

interface AuthRequest {
  initData: string;
  action?: 'login' | 'register' | 'link';
  currentToken?: string;
}

// Convert bytes to hex string
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// HMAC-SHA256 implementation
async function hmacSha256(key: ArrayBuffer, data: ArrayBuffer): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return await crypto.subtle.sign('HMAC', cryptoKey, data);
}

// Validate Telegram WebApp initData
async function validateInitData(initData: string, botToken: string): Promise<{ valid: boolean; user?: TelegramUser; error?: string }> {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    
    if (!hash) {
      return { valid: false, error: 'Hash not found in initData' };
    }

    // Remove hash from params for validation
    urlParams.delete('hash');
    
    // Sort params alphabetically and create data-check-string
    const dataCheckArr: string[] = [];
    urlParams.forEach((value, key) => {
      dataCheckArr.push(`${key}=${value}`);
    });
    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join('\n');

    // Calculate HMAC
    const encoder = new TextEncoder();
    const secretKey = await hmacSha256(
      encoder.encode('WebAppData').buffer as ArrayBuffer,
      encoder.encode(botToken).buffer as ArrayBuffer
    );
    const calculatedHashBuf = await hmacSha256(
      secretKey,
      encoder.encode(dataCheckString).buffer as ArrayBuffer
    );
    const calculatedHash = bytesToHex(new Uint8Array(calculatedHashBuf));

    if (calculatedHash !== hash) {
      return { valid: false, error: 'Invalid hash - data may be tampered' };
    }

    // Check auth_date (allow 24 hours)
    const authDate = urlParams.get('auth_date');
    if (authDate) {
      const authTimestamp = parseInt(authDate, 10);
      const now = Math.floor(Date.now() / 1000);
      if (now - authTimestamp > 86400) {
        return { valid: false, error: 'Auth data expired (>24 hours)' };
      }
    }

    // Parse user data
    const userParam = urlParams.get('user');
    if (!userParam) {
      return { valid: false, error: 'User data not found' };
    }

    const user = JSON.parse(userParam) as TelegramUser;
    return { valid: true, user };
  } catch (err) {
    console.error('Validation error:', err);
    return { valid: false, error: 'Validation failed: ' + (err as Error).message };
  }
}

// Generate custom JWT for Telegram user
async function generateCustomToken(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  telegramUser: TelegramUser
): Promise<{ access_token: string; refresh_token: string }> {
  // Create a session for the user
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: `tg_${telegramUser.id}@top-focus.ru`,
    options: {
      data: {
        telegram_id: telegramUser.id,
        telegram_username: telegramUser.username,
        display_name: [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' '),
        avatar_url: telegramUser.photo_url,
      }
    }
  });

  if (error) {
    throw new Error(`Failed to generate link: ${error.message}`);
  }

  // Exchange the token for a session
  const token = new URL(data.properties.action_link).searchParams.get('token');
  if (!token) {
    throw new Error('No token in magic link');
  }

  const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.verifyOtp({
    token_hash: token,
    type: 'magiclink',
  });

  if (sessionError || !sessionData.session) {
    throw new Error(`Failed to verify OTP: ${sessionError?.message}`);
  }

  return {
    access_token: sessionData.session.access_token,
    refresh_token: sessionData.session.refresh_token,
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { initData, action = 'login', currentToken }: AuthRequest = await req.json();

    if (!initData) {
      return new Response(
        JSON.stringify({ error: 'initData is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get bot token from environment
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN') || Deno.env.get('BOT_TOKEN');
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate initData
    const validation = await validateInitData(initData, botToken);
    if (!validation.valid || !validation.user) {
      return new Response(
        JSON.stringify({ error: validation.error || 'Invalid initData' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const telegramUser = validation.user;
    console.log(`Telegram auth for user: ${telegramUser.id} (@${telegramUser.username})`);

    // Initialize Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    });

    // Check if user exists by telegram_id
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .eq('telegram_id', telegramUser.id)
      .single();

    // Handle LINK action - link Telegram to existing account
    if (action === 'link' && currentToken) {
      const { data: { user: currentUser }, error: userError } = await supabaseAdmin.auth.getUser(currentToken);
      
      if (userError || !currentUser) {
        return new Response(
          JSON.stringify({ error: 'Invalid current token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (existingProfile && existingProfile.user_id !== currentUser.id) {
        return new Response(
          JSON.stringify({ 
            error: 'Telegram account already linked to another user',
            telegram_user: telegramUser.username 
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Link Telegram to current user
      await supabaseAdmin
        .from('profiles')
        .update({
          telegram_id: telegramUser.id,
          telegram_username: telegramUser.username,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', currentUser.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          action: 'linked',
          user_id: currentUser.id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // LOGIN: User exists - create session
    if (existingProfile) {
      console.log(`Existing user found: ${existingProfile.user_id}`);
      
      // Get the user's email to create a session
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(existingProfile.user_id);
      
      if (!userData.user) {
        return new Response(
          JSON.stringify({ error: 'User not found in auth' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate a new session for existing user
      const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: userData.user.email!,
      });

      if (sessionError) {
        throw sessionError;
      }

      const token = new URL(sessionData.properties.action_link).searchParams.get('token');
      const { data: verifyData, error: verifyError } = await supabaseAdmin.auth.verifyOtp({
        token_hash: token!,
        type: 'magiclink',
      });

      if (verifyError || !verifyData.session) {
        throw verifyError || new Error('No session created');
      }

      // Update profile with latest Telegram data
      await supabaseAdmin
        .from('profiles')
        .update({
          telegram_username: telegramUser.username,
          avatar_url: telegramUser.photo_url || existingProfile.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', existingProfile.user_id);

      return new Response(
        JSON.stringify({
          success: true,
          action: 'login',
          access_token: verifyData.session.access_token,
          refresh_token: verifyData.session.refresh_token,
          user: {
            id: existingProfile.user_id,
            display_name: existingProfile.display_name,
            avatar_url: existingProfile.avatar_url,
            telegram_id: telegramUser.id,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // REGISTER: Create new user with Telegram data
    console.log(`Creating new user for Telegram ID: ${telegramUser.id}`);
    
    const email = `tg_${telegramUser.id}@top-focus.ru`;
    const displayName = [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ');
    
    // Create user with random password (won't be used for login)
    const randomPassword = crypto.randomUUID() + crypto.randomUUID();
    
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: randomPassword,
      email_confirm: true,
      user_metadata: {
        telegram_id: telegramUser.id,
        telegram_username: telegramUser.username,
        display_name: displayName,
        avatar_url: telegramUser.photo_url,
        full_name: displayName,
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return new Response(
        JSON.stringify({ error: `Failed to create user: ${createError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate session for new user
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (sessionError) {
      throw sessionError;
    }

    const token = new URL(sessionData.properties.action_link).searchParams.get('token');
    const { data: verifyData, error: verifyError } = await supabaseAdmin.auth.verifyOtp({
      token_hash: token!,
      type: 'magiclink',
    });

    if (verifyError || !verifyData.session) {
      throw verifyError || new Error('No session created');
    }

    return new Response(
      JSON.stringify({
        success: true,
        action: 'register',
        access_token: verifyData.session.access_token,
        refresh_token: verifyData.session.refresh_token,
        user: {
          id: newUser.user.id,
          display_name: displayName,
          avatar_url: telegramUser.photo_url,
          telegram_id: telegramUser.id,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Telegram auth error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
