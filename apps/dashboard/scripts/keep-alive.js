import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from apps/dashboard/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not found in environment.');
  process.exit(1);
}

// Ensure we are hitting a real Supabase domain, not the placeholder
if (supabaseUrl.includes('fqmuthkvmtckvnbkckcu')) {
  console.log('Skipping ping: currently configured with the mock/placeholder URL.');
  process.exit(0);
}

console.log(`Pinging Supabase project at: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function ping() {
  try {
    // Perform a lightweight query to trigger activity on the DB
    const { data, error } = await supabase.from('courses').select('id').limit(1);
    if (error) {
      throw error;
    }
    console.log('Successfully pinged database. Course records found:', data.length);
    console.log('Supabase instance marked as active.');
  } catch (err) {
    console.error('Failed to ping Supabase:', err.message);
    process.exit(1);
  }
}

ping();
