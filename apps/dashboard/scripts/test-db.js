import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import ws from 'ws';

globalThis.WebSocket = ws;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  console.log('Testing connection to:', supabaseUrl);
  
  // Test 1: Fetch users from Auth using service role
  console.log('\n--- FETCHING USERS FROM AUTH ---');
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    console.error('Error fetching users:', usersError);
  } else {
    console.log(`Successfully fetched ${users.length} users:`);
    users.forEach(u => {
      console.log(`- ID: ${u.id}, Email: ${u.email}, Role: ${u.role}, Created At: ${u.created_at}`);
    });
  }

  // Test 2: Fetch profiles from public.profiles
  console.log('\n--- FETCHING PROFILES FROM DATABASE ---');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .limit(10);
    
  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
  } else {
    console.log(`Successfully fetched ${profiles.length} profiles:`);
    profiles.forEach(p => {
      console.log(`- ID: ${p.id}, Full Name: ${p.full_name}, Role: ${p.role}`);
    });
  }
}

main().catch(console.error);
