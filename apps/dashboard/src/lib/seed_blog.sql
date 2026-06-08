-- ========================================================
-- BLOG SEEDER SCRIPT: POPULATE HIGH-QUALITY ARTICLES
-- ========================================================

-- 1. SETUP MOCK USERS & PROFILES (Pengaman jika seeder komunitas belum dijalankan)
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'rian_mabar@ailearning.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Rian Mabar"}', now(), now(), 'authenticated', 'authenticated', ''),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'siti_coder@ailearning.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Siti Coder"}', now(), now(), 'authenticated', 'authenticated', ''),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'dewi_melody@ailearning.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dewi Melody"}', now(), now(), 'authenticated', 'authenticated', ''),
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'budi_design@ailearning.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Budi Design"}', now(), now(), 'authenticated', 'authenticated', ''),
  ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'chef_andi@ailearning.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Chef Andi"}', now(), now(), 'authenticated', 'authenticated', ''),
  ('66666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000000', 'prof_eko@ailearning.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Prof Eko"}', now(), now(), 'authenticated', 'authenticated', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, full_name, username, avatar_url, friend_code, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Rian Mabar', 'rian_mabar', 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Rian', 'MABAR1', now()),
  ('22222222-2222-2222-2222-222222222222', 'Siti Coder', 'siti_coder', 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Siti', 'CODER2', now()),
  ('33333333-3333-3333-3333-333333333333', 'Dewi Melody', 'dewi_melody', 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Dewi', 'MELOD3', now()),
  ('44444444-4444-4444-4444-444444444444', 'Budi Design', 'budi_design', 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Budi', 'DESIN4', now()),
  ('55555555-5555-5555-5555-555555555555', 'Chef Andi', 'chef_andi', 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Andi', 'CHEF55', now()),
  ('66666666-6666-6666-6666-666666666666', 'Prof Eko', 'prof_eko', 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Eko', 'PROFE6', now())
ON CONFLICT (id) DO NOTHING;


-- 2. DYNAMIC BLOG AND NOTIFICATIONS INSERTION
DO $$
DECLARE
  real_user_id UUID;
  post_id_1 UUID := uuid_generate_v4();
  post_id_2 UUID := uuid_generate_v4();
  post_id_3 UUID := uuid_generate_v4();
  post_id_4 UUID := uuid_generate_v4();
  post_id_5 UUID := uuid_generate_v4();
  post_id_6 UUID := uuid_generate_v4();
  post_id_7 UUID := uuid_generate_v4();

BEGIN
  -- A. Cari ID user pertama Anda yang sedang aktif log-in
  SELECT id INTO real_user_id 
  FROM auth.users 
  WHERE id NOT IN (
    '11111111-1111-1111-1111-111111111111', 
    '22222222-2222-2222-2222-222222222222', 
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555',
    '66666666-6666-6666-6666-666666666666'
  )
  ORDER BY created_at ASC
  LIMIT 1;

  -- Jika tidak ditemukan, fallback ke UUID acak sementara
  IF real_user_id IS NULL THEN
    real_user_id := '99999999-9999-9999-9999-999999999999';
  END IF;

  -- B. BERSIHKAN POST LAMA UNTUK MENCEGAH DUPLIKASI DATA
  -- (Opsional, agar feed terasa benar-benar fresh)
  DELETE FROM public.posts WHERE author_id IN (
    '11111111-1111-1111-1111-111111111111', 
    '22222222-2222-2222-2222-222222222222', 
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555',
    '66666666-6666-6666-6666-666666666666'
  );

  -- C. MASUKKAN 7 ARTIKEL BLOG BERKUALITAS PREMIUM
  -- 1. Artikel Siti Coder - Programming
  INSERT INTO public.posts (id, title, content, category, image_url, author_id, views, created_at, updated_at)
  VALUES (
    post_id_1,
    'Panduan Menulis Clean Code & Best Practices di React',
    E'Menulis kode yang berjalan lancar adalah satu hal, tetapi menulis kode yang mudah dibaca oleh developer lain (atau dirimu sendiri 6 bulan dari sekarang) adalah seni tersendiri. Di React, ada beberapa praktik terbaik yang bisa kamu terapkan:\n\n1. Pemisahan Komponen: Komponen idealnya hanya bertanggung jawab atas satu tugas (Single Responsibility Principle). Jika file komponenmu sudah melebihi 200 baris, pertimbangkan untuk membaginya menjadi sub-komponen.\n\n2. Gunakan Custom Hooks: Ekstrak logika bisnis yang rumit atau stateful dari visual rendering komponen. Gunakan hooks seperti `useUserProfile` atau `useOnlineStatus` untuk memisahkan logic dengan tampilan UI.\n\n3. Hindari Nesting Berlebihan: Struktur folder modular (misal memisahkan /components, /pages, /lib, dan /context) akan sangat membantu navigasi proyek skala menengah ke atas.\n\nSelamat mencoba clean code kawan-kawan! 💻🔥',
    'Programming',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200',
    '22222222-2222-2222-2222-222222222222',
    1840,
    now() - interval '3 days',
    now() - interval '3 days'
  );

  -- 2. Artikel Budi Design - UI/UX Design (Ini yang paling populer!)
  INSERT INTO public.posts (id, title, content, category, image_url, author_id, views, created_at, updated_at)
  VALUES (
    post_id_2,
    'Tren UI/UX Design Terpopuler: Mengapa Neo-Brutalisme Naik Daun?',
    E'Setelah bertahun-tahun didominasi oleh gaya minimalis monokrom yang bersih (flat design), dunia UI/UX kini sedang mengalami gelombang pemberontakan estetika baru: Neo-Brutalisme.\n\nGaya neobrutalisme ditandai dengan:\n- Stroke perbatasan hitam tebal (biasanya 2px hingga 4px)\n- Warna neon yang sangat kontras dan mencolok\n- Bayangan offset tegas persegi (tanpa efek blur/lembut) yang membuat elemen tampak melayang di atas permukaan canvas\n- Tipografi tebal yang asimetris\n\nEstetika ini digemari karena memberikan kesan berani, jujur, dan "hidup" bagi pengguna. Figma dan Gumroad adalah contoh platform global yang sukses mengadopsi visual ini. Bagaimana tanggapanmu? Apakah kamu menyukai gaya desain neobrutalisme seperti di aplikasi dashboard ini? Yuk tuangkan opinimu!',
    'UI/UX Design',
    'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=1200',
    '44444444-4444-4444-4444-444444444444',
    2450,
    now() - interval '2 days',
    now() - interval '2 days'
  );

  -- 3. Artikel Prof Eko - AI & Machine Learning
  INSERT INTO public.posts (id, title, content, category, image_url, author_id, views, created_at, updated_at)
  VALUES (
    post_id_3,
    'Memulai Belajar Artificial Intelligence & Python dari Nol',
    E'Artificial Intelligence (AI) bukan lagi masa depan, melainkan masa kini. Bagi pemula yang ingin terjun ke industri AI dan Machine Learning, berikut adalah peta jalan (roadmap) langkah-demi-langkah yang terbukti efektif:\n\nLangkah 1: Kuasai Python Dasar. Python adalah bahasa wajib dalam sains data. Pelajari tipe data, loop, function, dan konsep OOP.\n\nLangkah 2: Pelajari Matematika Dasar. Anda tidak perlu menjadi profesor matematika, namun kuasai konsep statistik dasar, probabilitas, aljabar linier (vektor & matriks), serta kalkulus dasar.\n\nLangkah 3: Pustaka Analitis Python. Mulailah berlatih memanipulasi data menggunakan Pandas, NumPy, dan visualisasi dengan Matplotlib/Seaborn.\n\nLangkah 4: Model Machine Learning Klasik. Pelajari algoritma regresi linier, decision tree, dan k-means sebelum menyentuh Deep Learning.\n\nIngat, konsistensi jauh lebih penting dibanding belajar 10 jam dalam sehari namun hanya sekali seminggu. Selamat belajar!',
    'AI & Machine Learning',
    'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=1200',
    '66666666-6666-6666-6666-666666666666',
    1200,
    now() - interval '5 days',
    now() - interval '5 days'
  );

  -- 4. Artikel Atas Nama AKUN ANDA (Study Tips)
  INSERT INTO public.posts (id, title, content, category, image_url, author_id, views, created_at, updated_at)
  VALUES (
    post_id_4,
    'Cara Mengatasi Distraksi Belajar dengan Metode Deep Work',
    E'Pernahkah kamu duduk untuk belajar atau koding selama 2 jam, namun 80% waktumu habis untuk scroll media sosial atau membalas chat WhatsApp? Itu disebut "Shallow Work".\n\nUntuk melatih fokus ekstrem, perkenalkan metode: Deep Work.\nDeep work adalah kemampuan untuk berfokus tanpa distraksi pada tugas yang menuntut kemampuan kognitif. Tips menerapkannya:\n\n1. Aturan 90 Menit: Otak manusia bekerja optimal dalam blok waktu 90 menit. Singkirkan HP ke ruangan lain, tutup semua tab browser yang tidak relevan, lalu koding/belajarlah secara penuh.\n\n2. Ritual Memulai: Siapkan secangkir kopi, pasang musik lofi akustik instrumental, dan rapihkan meja sebelum mulai.\n\nTeknik ini sangat membantu saya dalam membangun aplikasi dashboard ini dengan cepat dan rapi. Semoga bermanfaat untuk kalian semua ya!',
    'Study Tips',
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1200',
    real_user_id,
    950,
    now() - interval '1 day',
    now() - interval '1 day'
  );

  -- 5. Artikel Dewi Melody - Mental Health
  INSERT INTO public.posts (id, title, content, category, image_url, author_id, views, created_at, updated_at)
  VALUES (
    post_id_5,
    'Mengatasi Burnout Akademik: Menjaga Keseimbangan Kesehatan Mental',
    E'Sebagai mahasiswa atau programmer, dikejar deadline tugas, modul kodingan, atau ujian seringkali membuat kita merasa lelah secara fisik dan emosional. Keadaan ini disebut dengan Burnout.\n\nBerikut adalah cara-cara sederhana yang saya lakukan untuk menjaga kedamaian pikiran:\n- Dengarkan Musik Santai: Musik akustik instrumental terbukti mampu menurunkan tingkat kortisol (hormon stres) hingga 30%.\n- Batasi Waktu Layar (Screen-free time): Berikan waktu 1 jam sebelum tidur tanpa melihat layar HP/laptop Anda. Gantilah dengan membaca buku fisik atau meditasi pernapasan.\n- Hirup Udara Segar: Luangkan waktu 15 menit setiap pagi untuk berjalan kaki di luar rumah tanpa membawa gadget.\n\nPikiran yang tenang akan menghasilkan kreativitas dan kodingan yang jauh lebih bersih. Jaga kesehatan mental kalian ya guys! 🎵🍃',
    'Mental Health',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=1200',
    '33333333-3333-3333-3333-333333333333',
    1510,
    now() - interval '12 hours',
    now() - interval '12 hours'
  );

  -- 6. Artikel Siti Coder - Web Development
  INSERT INTO public.posts (id, title, content, category, image_url, author_id, views, created_at, updated_at)
  VALUES (
    post_id_6,
    'Perbandingan CSS Grid vs Flexbox: Kapan Harus Menggunakannya?',
    E'Banyak programmer pemula sering kebingungan menentukan pilihan antara CSS Grid dan Flexbox. Ini adalah aturan sederhana terbaik untuk memahaminya:\n\n- Flexbox dirancang untuk layout satu dimensi (1D), baik baris saja ATAU kolom saja. Contoh terbaik: Navbar, menu tab mendatar, atau tombol berbaris.\n\n- CSS Grid dirancang untuk layout dua dimensi (2D), yang memiliki baris DAN kolom sekaligus. Contoh terbaik: Halaman dashboard, portfolio grid, atau galeri foto.\n\n- Mengkombinasikan Keduanya: Gunakan CSS Grid untuk mengatur layout utama halaman web Anda, lalu gunakan Flexbox untuk merapikan elemen-elemen kecil di dalam kartu/card Grid tersebut. Ini kombinasi maut paling efisien!\n\nSemoga penjelasan singkat ini membantu menghilangkan pusingmu saat layouting!',
    'Web Development',
    'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=1200',
    '22222222-2222-2222-2222-222222222222',
    890,
    now() - interval '4 days',
    now() - interval '4 days'
  );

  -- 7. Artikel Chef Andi - Tutorial / Lainnya
  INSERT INTO public.posts (id, title, content, category, image_url, author_id, views, created_at, updated_at)
  VALUES (
    post_id_7,
    'Tips Menata Makanan Agar Tampil Mewah Seperti di Restoran Bintang 5',
    E'Pernah heran kenapa masakan sederhana di restoran mewah kelihatan sangat lezat padahal porsinya kecil? Itu dinamakan teknik "Food Plating". Berikut tips rahasia dari dapur saya:\n\n1. Aturan Ganjil: Menata lauk dengan jumlah ganjil (misal 3 atau 5 potong) secara visual jauh lebih menarik bagi mata manusia dibanding genap.\n\n2. Berikan Ruang Kosong (White Space): Jangan penuhi seluruh piring dengan makanan. Biarkan pinggiran piring kosong untuk memusatkan pandangan pada hidangan utama.\n\n3. Ketinggian (Height): Berikan dimensi tinggi pada makanan dengan menyusun lauk sedikit menumpuk ke atas, bukan melebar datar.\n\nCobalah praktekkan di rumah saat menyajikan sarapan esok hari!',
    'Tutorial',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1200',
    '55555555-5555-5555-5555-555555555555',
    640,
    now() - interval '6 days',
    now() - interval '6 days'
  );


  -- D. SEED NOTIFIKASI GLOBAL (Agar ada tanda notifikasi menyala merah di pojok kanan atas!)
  INSERT INTO public.notifications (id, title, content, type, link_to, is_read, created_at)
  VALUES
    (uuid_generate_v4(), 'Tren UI/UX Baru!', 'Tren Neo-Brutalisme sedang ramai dibahas oleh Budi Design. Cek ulasannya!', 'blog', '/blog', false, now() - interval '20 minutes'),
    (uuid_generate_v4(), 'Artikel Terbit', 'Artikelmu tentang "Mengatasi Distraksi Belajar" telah diterbitkan ke publik!', 'blog', '/blog', false, now() - interval '1 hour'),
    (uuid_generate_v4(), 'Tips Menata Makanan', 'Chef Andi baru saja membagikan resep & teknik plating restoran bintang 5!', 'blog', '/blog', false, now() - interval '4 hours')
  ON CONFLICT (id) DO NOTHING;

END $$;
