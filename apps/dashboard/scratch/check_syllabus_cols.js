import ws from 'ws';
globalThis.WebSocket = ws;

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, anonKey, {
  auth: {
    persistSession: false
  }
});

async function main() {
  const { data, error } = await supabase
    .from('course_syllabus')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching course_syllabus:', error);
  } else {
    console.log('Successfully fetched course_syllabus:', data);
    if (data && data.length > 0) {
      console.log('Columns in course_syllabus table:', Object.keys(data[0]));
    } else {
      console.log('No records found, table is empty. Let\'s select from information_schema if possible.');
    }
  }
}

main().catch(console.error);
