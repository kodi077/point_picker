import { createClient, SupabaseClient } from '@supabase/supabase-js';

// These will be replaced by esbuild during build using --define
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
        supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (err) {
        console.error('Failed to initialize Supabase client:', err);
    }
} else {
    console.warn('Supabase credentials missing. Sign-in and history features will be disabled.');
}

export const supabase = supabaseInstance;
export const isSupabaseConfigured = !!supabaseInstance;
