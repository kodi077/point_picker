import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tethmvyxfjztrgimurzz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRldGhtdnl4Zmp6dHJnaW11cnp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MDE5MTQsImV4cCI6MjA4NzQ3NzkxNH0.p4mX5_kgRAnQj7Ws-4ee1sN623gX7Eg-Wf1IYanBtC0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
