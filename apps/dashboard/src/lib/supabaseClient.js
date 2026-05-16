import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('--- SUPABASE CONFIG CHECK ---');
console.log('URL:', supabaseUrl);
console.log('Key Length:', supabaseAnonKey?.length || 0);

if (!supabaseUrl || supabaseUrl === 'undefined') {
  throw new Error('Supabase URL is missing! Make sure VITE_SUPABASE_URL is defined in your .env file and you have restarted the dev server (npm run dev).');
}

if (!supabaseAnonKey || supabaseAnonKey === 'undefined') {
  throw new Error('Supabase Anon Key is missing! Make sure VITE_SUPABASE_ANON_KEY is defined in your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
