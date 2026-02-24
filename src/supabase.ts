import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Fallback to hardcoded credentials if environment variables are missing
const FALLBACK_URL = 'https://tethmvyxfjztrgimurzz.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRldGhtdnl4Zmp6dHJnaW11cnp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MDE5MTQsImV4cCI6MjA4NzQ3NzkxNH0.p4mX5_kgRAnQj7Ws-4ee1sN623gX7Eg-Wf1IYanBtC0';

const SUPABASE_URL = process.env.SUPABASE_URL || FALLBACK_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || FALLBACK_KEY;

let supabaseInstance: SupabaseClient | null = null;

try {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (err) {
    console.error('Failed to initialize Supabase client:', err);
}

export const supabase = supabaseInstance;
export const isSupabaseConfigured = !!supabaseInstance;
