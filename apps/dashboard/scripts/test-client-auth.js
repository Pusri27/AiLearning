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
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  console.log('Testing public auth client against:', supabaseUrl);

  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  console.log('\n1. Testing SignUp with email:', testEmail);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (signUpError) {
    console.error('SignUp Error:', signUpError);
  } else {
    console.log('SignUp Success!', signUpData);
    
    // Now let's try to get user details
    console.log('\n2. Testing getUser() with newly signed up user...');
    // We need to set the session token
    if (signUpData.session) {
      const { data: userData, error: userError } = await supabase.auth.getUser(signUpData.session.access_token);
      if (userError) {
        console.error('getUser Error:', userError);
      } else {
        console.log('getUser Success!', userData);
      }
    } else {
      console.log('SignUp succeeded but did not return a session (email confirmation might be required).');
    }
  }

  // Let's try to sign in with an existing user or wrong credentials to see what happens
  console.log('\n3. Testing SignIn with password (invalid credentials)...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'nonexistent@example.com',
    password: 'wrong_password'
  });
  console.log('SignIn Response:', { signInData, signInError });
}

main().catch(console.error);
