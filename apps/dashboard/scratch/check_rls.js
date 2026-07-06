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
  const { data, error } = await supabase.rpc('get_policies'); // may not exist
  if (error) {
    console.error('Error fetching policies via RPC:', error);
    
    // Let's run a raw query using pg_catalog
    const { data: pgData, error: pgError } = await supabase.from('courses').select('id');
    console.log('Querying courses with Service Role:', pgData ? `${pgData.length} records` : 'error');
  } else {
    console.log('Policies:', data);
  }

  // Let's try querying courses table with ANON key to see if RLS restricts it!
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const supabaseAnon = createClient(supabaseUrl, anonKey);
  const { data: anonData, error: anonError } = await supabaseAnon.from('courses').select('*');
  if (anonError) {
    console.error('Error fetching courses with Anon Key:', anonError);
  } else {
    console.log('Courses fetched with Anon Key:', anonData.length, 'records');
    console.log('Anon Key Course IDs:', anonData.map(c => c.id));
  }
}

main().catch(console.error);
