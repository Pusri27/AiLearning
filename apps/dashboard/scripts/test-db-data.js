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
  console.log('Fetching database stats...');

  // 1. Courses
  const { data: courses, error: coursesError } = await supabase.from('courses').select('id, title, instructor, price');
  if (coursesError) {
    console.error('Error fetching courses:', coursesError);
  } else {
    console.log(`\nCourses count: ${courses.length}`);
    courses.slice(0, 5).forEach(c => console.log(`- [${c.id}] ${c.title} by ${c.instructor} (Rp ${c.price})`));
  }

  // 2. Enrollments
  const { data: enrollments, error: enrollmentsError } = await supabase.from('enrollments').select('id, user_id, course_id, progress');
  if (enrollmentsError) {
    console.error('Error fetching enrollments:', enrollmentsError);
  } else {
    console.log(`\nEnrollments count: ${enrollments.length}`);
    enrollments.slice(0, 5).forEach(e => console.log(`- Enrollment: ${e.id}, User: ${e.user_id}, Course: ${e.course_id}, Progress: ${e.progress}%`));
  }

  // 3. Posts (Blog)
  const { data: posts, error: postsError } = await supabase.from('posts').select('id, title, author_id, category');
  if (postsError) {
    console.error('Error fetching posts:', postsError);
  } else {
    console.log(`\nPosts count: ${posts.length}`);
    posts.slice(0, 5).forEach(p => console.log(`- Post: [${p.id}] ${p.title}, Author: ${p.author_id}, Category: ${p.category}`));
  }
}

main().catch(console.error);
