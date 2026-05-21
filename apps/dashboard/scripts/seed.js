import { createClient } from '@supabase/supabase-js';
import { fakerID_ID as faker } from '@faker-js/faker'; // Menggunakan lokal bahasa Indonesia agar data nama dan percakapan terasa lokal & natural!
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import ws from 'ws';

// 1. CARI DAN LOAD .ENV FILE SECARA MANDIRI & TANGGUH
const possibleEnvPaths = [
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), 'apps', 'dashboard', '.env'),
  path.join(process.cwd(), '..', '.env')
];

let envPath = '';
for (const p of possibleEnvPaths) {
  if (fs.existsSync(p)) {
    envPath = p;
    break;
  }
}

if (envPath) {
  dotenv.config({ path: envPath });
  console.log(`\x1b[32m✔ Berhasil memuat berkas lingkungan dari: ${envPath}\x1b[0m`);
} else {
  console.log('\x1b[33m⚠ Peringatan: Berkas .env tidak ditemukan. Menggunakan variabel lingkungan global jika ada.\x1b[0m');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Mengutamakan Service Role Key (bypasses RLS) untuk seeder, jika tidak ada fallback ke Anon Key
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const activeKey = serviceRoleKey || anonKey;

if (!supabaseUrl || !activeKey) {
  console.error('\x1b[31m✖ Error: VITE_SUPABASE_URL atau Kunci Supabase tidak ditemukan di .env!\x1b[0m');
  console.error('Silakan pastikan berkas .env Anda terisi dengan benar.');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.log('\x1b[33mℹ Info: SUPABASE_SERVICE_ROLE_KEY tidak terdeteksi di .env. Menggunakan VITE_SUPABASE_ANON_KEY.\x1b[0m');
  console.log('\x1b[33m   Jika terjadi error RLS (Row Level Security), masukkan service_role key dari dashboard Supabase Anda ke .env.\x1b[0m\n');
} else {
  console.log('\x1b[32m✔ Menggunakan SUPABASE_SERVICE_ROLE_KEY (Bypass RLS Aktif untuk seeding multi-user!)\x1b[0m\n');
}

const supabase = createClient(supabaseUrl, activeKey, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});

// 2. FUNGSI UTAMA SEEDER
async function runSeeder() {
  console.log('\x1b[36m========== MEMULAI PROSES SEEDING FAKER.JS INDONESIA ==========\x1b[0m');

  try {
    // A. Dapatkan profil penulis yang valid dari database
    console.log('⏳ Mengambil daftar profil penulis dari database...');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name');

    if (profileError || !profiles || profiles.length === 0) {
      throw new Error(profileError?.message || 'Tidak ada profil pengguna di database. Harap jalankan seed.sql terlebih dahulu di Supabase.');
    }

    console.log(`\x1b[32m✔ Terdeteksi ${profiles.length} profil pengguna siap dikaitkan.\x1b[0m`);
    const profileIds = profiles.map(p => p.id);

    // B. Dapatkan daftar channel yang valid dari database
    const { data: channels, error: channelError } = await supabase
      .from('channels')
      .select('id, name, type');

    if (channelError || !channels || channels.length === 0) {
      throw new Error(channelError?.message || 'Tidak ada channel aktif di database. Harap jalankan seed.sql terlebih dahulu.');
    }

    const textChannels = channels.filter(c => c.type === 'text');
    console.log(`\x1b[32m✔ Terdeteksi ${textChannels.length} saluran teks aktif siap diisi chat.\x1b[0m\n`);

    // C. GENERATE 5 ARTIKEL BLOG PREMIUM (SEDANG & RAPI)
    console.log('⏳ Menulis 5 artikel blog baru menggunakan data acak Faker...');
    
    // Kategori berpasangan dengan visual Unsplash yang cocok
    const categoryMatches = [
      { cat: 'Programming', img: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=800' },
      { cat: 'UI/UX Design', img: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=800' },
      { cat: 'AI & Machine Learning', img: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=800' },
      { cat: 'Study Tips', img: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800' },
      { cat: 'Mental Health', img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800' }
    ];

    const seededPosts = [];
    for (let i = 0; i < 5; i++) {
      const match = categoryMatches[i % categoryMatches.length];
      const title = `Panduan ${faker.word.adjective()} Belajar ${faker.word.noun()} di Era ${faker.word.noun()}`;
      
      const paragraphs = [
        faker.lorem.paragraph(4),
        faker.lorem.paragraph(5),
        faker.lorem.paragraph(4)
      ].join('\n\n');

      const authorId = faker.helpers.arrayElement(profileIds);
      const views = faker.number.int({ min: 150, max: 2800 });
      const createdAt = faker.date.recent({ days: 14 }); // 14 hari terakhir

      const { data: newPost, error: postErr } = await supabase
        .from('posts')
        .insert({
          title: title,
          content: paragraphs,
          category: match.cat,
          image_url: match.img,
          author_id: authorId,
          views: views,
          created_at: createdAt.toISOString(),
          updated_at: createdAt.toISOString()
        })
        .select()
        .single();

      if (postErr) {
        console.error(`✖ Gagal menyisipkan artikel ${i + 1}:`, postErr.message);
      } else {
        seededPosts.push(newPost);
        console.log(`   📝 [Artikel ${i + 1}]: "${title}" (Kategori: ${match.cat}, Penulis ID: ${authorId.slice(0, 8)}...)`);
      }
    }
    console.log(`\x1b[32m✔ Sukses menyisipkan ${seededPosts.length} artikel blog baru ke database!\x1b[0m\n`);


    // D. GENERATE 10 PERCAKAPAN CHAT BARU DI SALURAN TEKS
    console.log('⏳ Mengirim 10 pesan obrolan acak ke berbagai channel...');
    let chatCount = 0;
    
    // Obrolan gaul bertema tech/belajar buatan Faker
    const chatSentences = [
      'Halo guys, lagi pada sibuk ngerjain modul apa nih malam ini?',
      'Baru kelar nonton dokumenter AI, mind-blowing banget perkembangannya.',
      'Ada rekomendasi materi buat belajar Tailwind CSS dari dasar ga ya?',
      'Btw, saya barusan nemu shortcut keren di VS Code: Ctrl + Shift + P, ngebantu banget!',
      'Desain dashboard barunya kece parah, transisinya smooth banget pas diklik.',
      'Jangan lupa istirahat ya kawan-kawan, stretch otot dulu biar ga pegel koding terus.',
      'Ada yang mau bareng join voice room sebentar lagi? Mau nanya tips framework nih.',
      'Baru aja cobain fitur barunya, stabil dan responsif abis!',
      'Menurut kalian mending belajar React native atau Flutter dulu ya buat mobile dev?',
      'Semangat semuanya! Proyek ini bakal keliatan makin asik dan keren.'
    ];

    for (let i = 0; i < 10; i++) {
      const channel = faker.helpers.arrayElement(textChannels);
      const senderId = faker.helpers.arrayElement(profileIds);
      const text = chatSentences[i % chatSentences.length];
      const time = faker.date.recent({ days: 1 }); // 24 jam terakhir

      const { error: msgErr } = await supabase
        .from('community_messages')
        .insert({
          channel_id: channel.id,
          user_id: senderId,
          text: text,
          created_at: time.toISOString()
        });

      if (msgErr) {
        console.error(`✖ Gagal menyisipkan pesan ${i + 1}:`, msgErr.message);
      } else {
        chatCount++;
        console.log(`   💬 [Chat #${channel.name}]: "${text.slice(0, 40)}..." oleh User ${senderId.slice(0, 8)}...`);
      }
    }
    console.log(`\x1b[32m✔ Sukses mengirimkan ${chatCount} pesan percakapan tiruan ke saluran komunitas!\x1b[0m\n`);

    console.log('\x1b[32m===============================================================');
    console.log('✔ PROSES SEEDING FAKER BERHASIL SELESAI!');
    console.log(`   - Jumlah Artikel Baru : ${seededPosts.length} Artikel`);
    console.log(`   - Jumlah Chat Komunitas: ${chatCount} Pesan`);
    console.log('===============================================================\x1b[0m');

  } catch (err) {
    console.error('\x1b[31m✖ Terjadi kesalahan fatal selama seeding:\x1b[0m', err.message);
  }
}

runSeeder();
