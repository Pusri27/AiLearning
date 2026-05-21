import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import ws from 'ws';

// 1. Load .env file
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
  console.log('\x1b[33m⚠ Peringatan: Berkas .env tidak ditemukan.\x1b[0m');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const activeKey = serviceRoleKey || anonKey;

if (!supabaseUrl || !activeKey) {
  console.error('\x1b[31m✖ Error: VITE_SUPABASE_URL atau Kunci Supabase tidak ditemukan di .env!\x1b[0m');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, activeKey, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});

const HIGH_QUALITY_POSTS = [
  {
    title: 'Panduan Lengkap Memulai Pemrograman Python untuk Kecerdasan Buatan (AI)',
    category: 'AI & Machine Learning',
    image_url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=800',
    content: `Bahasa pemrograman Python telah menjadi standar de-facto untuk pengembangan kecerdasan buatan. Mengapa demikian? Sintaksisnya yang bersih, komunitasnya yang masif, serta tersedianya ribuan library seperti NumPy, Pandas, Scikit-Learn, TensorFlow, dan PyTorch membuatnya menjadi pilihan utama.

Bagi pemula yang ingin belajar, langkah pertama adalah memahami tipe data dasar, percabangan, perulangan, dan fungsi di Python. Setelah itu, biasakan diri Anda dengan manipulasi array menggunakan NumPy dan analisis data terstruktur menggunakan Pandas.

Jangan langsung terjun ke arsitektur Deep Learning yang rumit; mulailah dengan algoritma machine learning klasik seperti Linear Regression, K-Nearest Neighbors, dan Decision Trees untuk meletakkan pondasi yang kuat sebelum melangkah lebih jauh.`,
    views: 1250
  },
  {
    title: 'Mengenal Desain Sistem (Design System) dan Pentingnya bagi Developer',
    category: 'UI/UX Design',
    image_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=800',
    content: `Design System bukan sekadar kumpulan komponen tombol atau skema warna di Figma, melainkan sebuah ekosistem terpadu yang memuat token desain (warna, tipografi, jarak), komponen UI, dan pedoman visual yang menjembatani desainer dan pengembang frontend.

Dengan menerapkan design system yang matang, tim produk dapat menghemat ribuan jam kerja karena tidak perlu mendesain ulang komponen dasar dari nol. Selain itu, konsistensi visual di seluruh aplikasi akan meningkat tajam, menciptakan pengalaman pengguna (UX) yang profesional dan intuitif.

Bagi pengembang frontend, implementasi design system biasanya direpresentasikan melalui CSS variables, Tailwind configuration, atau pustaka komponen mandiri berbasis React/Vue yang reusable.`,
    views: 2430
  },
  {
    title: 'Optimasi Performa Aplikasi React Menggunakan Code Splitting & Lazy Loading',
    category: 'Programming',
    image_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800',
    content: `Salah satu masalah umum pada aplikasi Single Page Application (SPA) seperti React adalah ukuran bundle JavaScript yang terlalu besar (bloated) pada saat pemuatan pertama. Pengguna dipaksa mengunduh seluruh kode aplikasi meskipun mereka hanya mengunjungi halaman beranda.

Di sinilah teknik Code Splitting menggunakan React.lazy() dan Suspense menjadi sangat krusial. Dengan membagi kode berdasarkan rute halaman atau komponen berat (seperti chart besar atau editor teks), browser hanya akan mengunduh kode yang benar-benar dibutuhkan pada rute aktif saat itu juga.

Hasilnya? Waktu pemuatan awal (First Contentful Paint) menjadi jauh lebih cepat, mengurangi beban jaringan browser, dan memberikan pengalaman transisi antarhalaman yang responsif.`,
    views: 1980
  },
  {
    title: 'Cara Membangun Habit Belajar Koding Konsisten Menggunakan Kaizen',
    category: 'Study Tips',
    image_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800',
    content: `Belajar koding seringkali melelahkan dan membuat frustrasi, terutama ketika Anda menghadapi error yang sulit dipecahkan. Banyak pemula menyerah karena mencoba belajar selama 8 jam sekaligus di akhir pekan saja.

Alternatif yang jauh lebih efektif adalah menerapkan prinsip Kaizen dari Jepang: perbaikan kecil yang dilakukan secara terus-menerus. Cukup luangkan waktu 20 hingga 30 menit setiap hari untuk menulis kode atau membaca dokumentasi secara fokus.

Konsistensi harian ini jauh lebih baik karena membangun jalur saraf (neuroplasticity) baru di otak dan perlahan membentuk kebiasaan jangka panjang. Koding adalah keterampilan motorik dan logika yang harus dilatih melalui repetisi harian, bukan dengan cara kebut semalam.`,
    views: 1540
  },
  {
    title: 'Tips Menjaga Kesehatan Mental Developer dari Ancaman Burnout',
    category: 'Mental Health',
    image_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800',
    content: `Industri teknologi bergerak dengan sangat cepat, menuntut para pengembang untuk terus mempelajari teknologi baru di bawah tekanan tenggat waktu proyek yang ketat. Kondisi ini sering kali berujung pada kelelahan emosional dan penurunan performa kerja yang dikenal sebagai burnout.

Untuk mencegahnya, penting bagi para developer untuk menetapkan batasan kerja yang jelas, seperti tidak menyentuh laptop setelah jam kerja berakhir. Selain itu, luangkan waktu untuk melakukan aktivitas fisik ringan di luar ruangan dan istirahatkan mata dari layar (screen-free time).

Kesehatan mental dan kebahagiaan Anda jauh lebih berharga daripada baris kode apa pun. Pikiran yang tenang juga akan menghasilkan kode yang jauh lebih bersih dan minim bug.`,
    views: 1720
  },
  {
    title: 'Membangun RESTful API Aman Menggunakan Node.js, Express, dan JWT',
    category: 'Web Development',
    image_url: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=800',
    content: `Keamanan adalah aspek paling krusial dalam pembuatan backend API. Saat membangun RESTful API menggunakan Node.js dan Express, mengamankan rute sensitif dapat dicapai secara efisien menggunakan JSON Web Tokens (JWT).

Ketika pengguna berhasil login, server akan memancarkan token terenkripsi yang berisi identitas pengguna. Token ini kemudian dikirimkan oleh klien di setiap request berikutnya melalui header Authorization.

Server kemudian memvalidasi tanda tangan token tersebut sebelum memberikan akses ke data. Pastikan untuk selalu menggunakan HTTPS dan menyimpan token di tempat yang aman (seperti HttpOnly cookies) guna mencegah serangan Cross-Site Scripting (XSS).`,
    views: 1890
  },
  {
    title: 'Langkah Praktis Membuat Animasi CSS yang Halus dan Efisien',
    category: 'UI/UX Design',
    image_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=800',
    content: `Animasi dapat menghidupkan antarmuka pengguna dan memberikan feedback visual yang memuaskan. Namun, animasi yang patah-patah justru akan memperburuk pengalaman pengguna.

Untuk membuat animasi CSS yang sangat halus (mencapai 60 FPS), pastikan Anda memanipulasi properti yang tidak memicu proses layouting ulang oleh browser (reflow/repaint). Properti terbaik untuk dianimasikan adalah transform (seperti translate, scale, rotate) dan opacity.

Hindari menganimasikan properti seperti width, height, top, atau left secara langsung karena memaksa browser untuk menghitung ulang seluruh tata letak halaman pada setiap frame. Gunakan hardware acceleration dengan properti will-change bila diperlukan.`,
    views: 1410
  },
  {
    title: 'Tips Sukses Menghadapi Coding Interview untuk Calon Software Engineer',
    category: 'Tutorial',
    image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800',
    content: `Menghadapi wawancara teknis (coding interview) bisa sangat menegangkan. Rahasia sukses melewatinya bukan hanya menulis kode yang benar, tetapi bagaimana Anda berkomunikasi dan memecahkan masalah.

Ketika diberikan sebuah soal algoritma, jangan langsung mengetik kode. Jelaskan terlebih dahulu pemikiran Anda (think out loud), diskusikan pendekatan kasar (brute force), lalu tanyakan batasan masalah (edge cases) kepada pewawancara.

Setelah menyepakati pendekatan terbaik, tulis kode secara sistematis dan bersih. Di akhir sesi, lakukan dry-run dengan contoh kasus uji guna membuktikan kebenaran kode Anda secara visual sebelum menjalankan compiler.`,
    views: 2010
  }
];

async function runSeeder() {
  console.log('\x1b[36m========== MEMULAI PROSES SEEDING BLOG BERKUALITAS PREMIUM ==========\x1b[0m');

  try {
    // 1. Dapatkan profil penulis yang valid dari database
    console.log('⏳ Mengambil daftar profil dari database...');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name');

    if (profileError || !profiles || profiles.length === 0) {
      throw new Error(profileError?.message || 'Tidak ada profil pengguna di database. Harap jalankan seeder user/seed.sql terlebih dahulu.');
    }

    const authorIds = profiles.map(p => p.id);
    console.log(`\x1b[32m✔ Terdeteksi ${profiles.length} profil pengguna siap dikaitkan.\x1b[0m`);

    // 2. Bersihkan postingan lama
    console.log('⏳ Membersihkan postingan lama di database...');
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .gt('id', 0); // Delete all since id is a serial/bigint >= 1

    if (deleteError) {
      console.warn('⚠️ Peringatan saat membersihkan postingan lama:', deleteError.message);
    } else {
      console.log('✔ Postingan lama dibersihkan.');
    }

    // 3. Masukkan artikel berkualitas premium
    console.log('⏳ Menyisipkan 8 artikel blog berkualitas tinggi...');
    
    let successCount = 0;
    for (let i = 0; i < HIGH_QUALITY_POSTS.length; i++) {
      const post = HIGH_QUALITY_POSTS[i];
      
      // Pilih author secara acak dari database
      const randomAuthorId = authorIds[i % authorIds.length];
      
      const { error: insertError } = await supabase
        .from('posts')
        .insert({
          title: post.title,
          content: post.content,
          category: post.category,
          image_url: post.image_url,
          author_id: randomAuthorId,
          views: post.views,
          created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(), // Bertahap per hari
          updated_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
        });

      if (insertError) {
        console.error(`✖ Gagal menyisipkan artikel "${post.title}":`, insertError.message);
      } else {
        successCount++;
        console.log(`   📝 [Artikel #${successCount}]: "${post.title}" (${post.category})`);
      }
    }

    console.log('\x1b[32m===============================================================');
    console.log('✔ SEEDING BLOG SELESAI DENGAN SUKSES!');
    console.log(`   - Jumlah Artikel Premium Berhasil Dimasukkan: ${successCount}`);
    console.log('===============================================================\x1b[0m');

  } catch (err) {
    console.error('\x1b[31m✖ Terjadi kesalahan fatal selama seeding:\x1b[0m', err.message);
  }
}

runSeeder();
