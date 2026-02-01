// ==========================================
// Database Factory
// Switch between Mock and Supabase here
// ==========================================

import { IDatabase } from '../types/database';
import { mockDatabase } from './mock';
import { SupabaseDatabase } from './supabase';

// Configuration: Change this to switch databases
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const USE_SUPABASE = SUPABASE_URL && SUPABASE_KEY;

function getDatabase(): IDatabase {
    if (USE_SUPABASE) {
        console.log('Using Supabase Database');
        return new SupabaseDatabase(SUPABASE_URL, SUPABASE_KEY);
    }
    console.log('Using Mock Database (Local)');
    return mockDatabase;
}

export const database = getDatabase();
export default database;
