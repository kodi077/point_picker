import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

export type AuthChangeCallback = (user: User | null) => void;

export async function signInWithEmail(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            emailRedirectTo: window.location.origin
        }
    });
    if (error) {
        console.error('Error signing in:', error.message);
        throw error;
    }
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error signing out:', error.message);
}

export function onAuthStateChange(callback: AuthChangeCallback) {
    // Supabase fires the listener with INITIAL_SESSION immediately upon subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        callback(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
}
