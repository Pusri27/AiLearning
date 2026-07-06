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

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', '61ccaf45-59b1-4a7c-aba6-fabe20220f35').single();
  if (error) {
    console.error('Error fetching target profile:', error);
  } else {
    console.log('Target Profile:', JSON.stringify(profile, null, 2));
  }

  const { data: allProfiles, error: errAll } = await supabase.from('profiles').select('id, full_name, username, role, language');
  if (errAll) {
    console.error('Error fetching all profiles:', errAll);
  } else {
    console.log('All Profiles:', JSON.stringify(allProfiles, null, 2));
  }
}

main().catch(console.error);
