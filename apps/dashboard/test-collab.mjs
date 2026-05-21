import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fqmuthkvmtckvnbkckcu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxbXV0aGt2bXRja3ZuYmtja2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTM5MDEsImV4cCI6MjA5NDMyOTkwMX0.bjji1o5862pjLl9hB0J_eK3sYMdEvYlf-bEZbQXxAME';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase
    .from('community_messages')
    .select('*, profiles:user_id(full_name, avatar_url)')
    .limit(5);
  console.log('Data:', JSON.stringify(data, null, 2));
  if (error) console.error('Error:', error);
}
test();
