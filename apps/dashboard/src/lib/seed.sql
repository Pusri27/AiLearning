-- ========================================================
-- SUPER SEEDER SCRIPT: MEGA UPDATE & IMMERSIVE MOCK DATA
-- ========================================================

-- 1. SETUP 6 MOCK USERS DI SCHEMA AUTH.USERS
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'rian_mabar@ailearning.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Rian Mabar"}', now(), now(), 'authenticated', 'authenticated', ''),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'siti_coder@ailearning.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Siti Coder"}', now(), now(), 'authenticated', 'authenticated', ''),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'dewi_melody@ailearning.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dewi Melody"}', now(), now(), 'authenticated', 'authenticated', ''),
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'budi_design@ailearning.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Budi Design"}', now(), now(), 'authenticated', 'authenticated', ''),
  ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'chef_andi@ailearning.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Chef Andi"}', now(), now(), 'authenticated', 'authenticated', ''),
  ('66666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000000', 'prof_eko@ailearning.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Prof Eko"}', now(), now(), 'authenticated', 'authenticated', '')
ON CONFLICT (id) DO NOTHING;

-- 2. SETUP PROFIL LENGKAP DI PUBLIC.PROFILES
INSERT INTO public.profiles (id, full_name, username, avatar_url, friend_code, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Rian Mabar', 'rian_mabar', 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Rian', 'MABAR1', now()),
  ('22222222-2222-2222-2222-222222222222', 'Siti Coder', 'siti_coder', 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Siti', 'CODER2', now()),
  ('33333333-3333-3333-3333-333333333333', 'Dewi Melody', 'dewi_melody', 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Dewi', 'MELOD3', now()),
  ('44444444-4444-4444-4444-444444444444', 'Budi Design', 'budi_design', 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Budi', 'DESIN4', now()),
  ('55555555-5555-5555-5555-555555555555', 'Chef Andi', 'chef_andi', 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Andi', 'CHEF55', now()),
  ('66666666-6666-6666-6666-666666666666', 'Prof Eko', 'prof_eko', 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Eko', 'PROFE6', now())
ON CONFLICT (id) DO NOTHING;


-- 3. UTILITY DYNAMIC BLOCK FOR HIERARCHY
DO $$
DECLARE
  real_user_id UUID;
  
  -- Communities
  gamer_comm_id UUID := 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1';
  coder_comm_id UUID := 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2';
  music_comm_id UUID := 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3';
  design_comm_id UUID := 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4';
  cook_comm_id UUID := 'e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5';
  
  -- Gamer Channels
  g_text_general UUID := 'a1a1a1a1-1111-1111-1111-a1a1a1a1a1a1';
  g_text_mabar UUID   := 'a1a1a1a1-2222-2222-2222-a1a1a1a1a1a1';
  g_text_news UUID    := 'a1a1a1a1-3333-3333-3333-a1a1a1a1a1a1';
  g_voice_lounge UUID := 'a1a1a1a1-4444-4444-4444-a1a1a1a1a1a1';
  g_voice_squad1 UUID := 'a1a1a1a1-5555-5555-5555-a1a1a1a1a1a1';
  
  -- Coder Channels
  c_text_general UUID := 'b2b2b2b2-1111-1111-1111-b2b2b2b2b2b2';
  c_text_help UUID    := 'b2b2b2b2-2222-2222-2222-b2b2b2b2b2b2';
  c_text_showcase UUID:= 'b2b2b2b2-3333-3333-3333-b2b2b2b2b2b2';
  c_voice_pair UUID   := 'b2b2b2b2-4444-4444-4444-b2b2b2b2b2b2';
  c_voice_seminar UUID:= 'b2b2b2b2-5555-5555-5555-b2b2b2b2b2b2';

  -- Music Channels
  m_text_general UUID := 'c3c3c3c3-1111-1111-1111-c3c3c3c3c3c3';
  m_text_share UUID   := 'c3c3c3c3-2222-2222-2222-c3c3c3c3c3c3';
  m_voice_chill UUID  := 'c3c3c3c3-3333-3333-3333-c3c3c3c3c3c3';
  m_voice_jam UUID    := 'c3c3c3c3-4444-4444-4444-c3c3c3c3c3c3';

  -- Design Channels
  d_text_general UUID := 'd4d4d4d4-1111-1111-1111-d4d4d4d4d4d4';
  d_text_showcase UUID:= 'd4d4d4d4-2222-2222-2222-d4d4d4d4d4d4';
  d_text_jobs UUID    := 'd4d4d4d4-3333-3333-3333-d4d4d4d4d4d4';
  d_voice_studio UUID := 'd4d4d4d4-4444-4444-4444-d4d4d4d4d4d4';

  -- Cooking Channels
  f_text_general UUID := 'e5e5e5e5-1111-1111-1111-e5e5e5e5e5e5';
  f_text_recipes UUID := 'e5e5e5e5-2222-2222-2222-e5e5e5e5e5e5';
  f_text_photos UUID  := 'e5e5e5e5-3333-3333-3333-e5e5e5e5e5e5';
  f_voice_kitchen UUID:= 'e5e5e5e5-4444-4444-4444-e5e5e5e5e5e5';

BEGIN
  -- A. Cari ID user pertama Anda yang bukan bot
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

  -- Jika user riil belum terdaftar, gunakan UUID acak sementara
  IF real_user_id IS NULL THEN
    real_user_id := '99999999-9999-9999-9999-999999999999';
  END IF;

  -- B. BUAT 5 KOMUNITAS DENGAN KODE UNDANGAN TETAP
  INSERT INTO public.communities (id, name, icon, accent_color, invite_code, created_by, created_at)
  VALUES
    (gamer_comm_id, 'Gamer Zone 🎮', 'sports_esports', '#ef4444', 'GAMER', real_user_id, now()),
    (coder_comm_id, 'Dev & Code Cafe 💻', 'code', '#3b82f6', 'CODER', real_user_id, now()),
    (music_comm_id, 'Music & Chill 🎵', 'music_note', '#a855f7', 'MUSIC', real_user_id, now()),
    (design_comm_id, 'Design Studio 🎨', 'palette', '#ec4899', 'DESIGN', real_user_id, now()),
    (cook_comm_id, 'Nusantara Cooking 🍳', 'restaurant', '#f59e0b', 'COOK', real_user_id, now())
  ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    accent_color = EXCLUDED.accent_color,
    invite_code = EXCLUDED.invite_code;

  -- C. DAFTARKAN ANGGOTA (USER RIIL & BOT-BOT NYA)
  -- 1. Gamer Zone members (Rian, Siti, Andi, Budi)
  INSERT INTO public.community_members (community_id, user_id, role, joined_at)
  VALUES
    (gamer_comm_id, real_user_id, 'owner', now()),
    (gamer_comm_id, '11111111-1111-1111-1111-111111111111', 'admin', now() - interval '5 hours'), -- Rian Mabar
    (gamer_comm_id, '22222222-2222-2222-2222-222222222222', 'member', now() - interval '4 hours'), -- Siti Coder
    (gamer_comm_id, '55555555-5555-5555-5555-555555555555', 'member', now() - interval '3 hours'), -- Chef Andi
    (gamer_comm_id, '44444444-4444-4444-4444-444444444444', 'member', now() - interval '2 hours')  -- Budi Design
  ON CONFLICT (community_id, user_id) DO NOTHING;

  -- 2. Dev & Code Cafe members (Siti, Prof Eko, Budi, Rian)
  INSERT INTO public.community_members (community_id, user_id, role, joined_at)
  VALUES
    (coder_comm_id, real_user_id, 'owner', now()),
    (coder_comm_id, '22222222-2222-2222-2222-222222222222', 'admin', now() - interval '6 hours'), -- Siti Coder
    (coder_comm_id, '66666666-6666-6666-6666-666666666666', 'admin', now() - interval '5 hours'), -- Prof Eko
    (coder_comm_id, '44444444-4444-4444-4444-444444444444', 'member', now() - interval '4 hours'), -- Budi Design
    (coder_comm_id, '11111111-1111-1111-1111-111111111111', 'member', now() - interval '3 hours')  -- Rian Mabar
  ON CONFLICT (community_id, user_id) DO NOTHING;

  -- 3. Music & Chill members (Dewi, Rian, Budi)
  INSERT INTO public.community_members (community_id, user_id, role, joined_at)
  VALUES
    (music_comm_id, real_user_id, 'owner', now()),
    (music_comm_id, '33333333-3333-3333-3333-333333333333', 'admin', now() - interval '7 hours'), -- Dewi Melody
    (music_comm_id, '11111111-1111-1111-1111-111111111111', 'member', now() - interval '6 hours'), -- Rian Mabar
    (music_comm_id, '44444444-4444-4444-4444-444444444444', 'member', now() - interval '5 hours')  -- Budi Design
  ON CONFLICT (community_id, user_id) DO NOTHING;

  -- 4. Design Studio members (Budi, Siti, Dewi)
  INSERT INTO public.community_members (community_id, user_id, role, joined_at)
  VALUES
    (design_comm_id, real_user_id, 'owner', now()),
    (design_comm_id, '44444444-4444-4444-4444-444444444444', 'admin', now() - interval '5 hours'), -- Budi Design
    (design_comm_id, '22222222-2222-2222-2222-222222222222', 'member', now() - interval '4 hours'), -- Siti Coder
    (design_comm_id, '33333333-3333-3333-3333-333333333333', 'member', now() - interval '3 hours')  -- Dewi Melody
  ON CONFLICT (community_id, user_id) DO NOTHING;

  -- 5. Nusantara Cooking members (Chef Andi, Rian, Prof Eko)
  INSERT INTO public.community_members (community_id, user_id, role, joined_at)
  VALUES
    (cook_comm_id, real_user_id, 'owner', now()),
    (cook_comm_id, '55555555-5555-5555-5555-555555555555', 'admin', now() - interval '6 hours'), -- Chef Andi
    (cook_comm_id, '11111111-1111-1111-1111-111111111111', 'member', now() - interval '5 hours'), -- Rian Mabar
    (cook_comm_id, '66666666-6666-6666-6666-666666666666', 'member', now() - interval '4 hours')  -- Prof Eko
  ON CONFLICT (community_id, user_id) DO NOTHING;


  -- D. BUAT CHANNELS DI TIAP SERVER
  -- 1. Gamer Zone
  INSERT INTO public.channels (id, community_id, name, type, created_at)
  VALUES
    (g_text_general, gamer_comm_id, 'general-lounge', 'text', now()),
    (g_text_mabar, gamer_comm_id, 'mabar-squad', 'text', now()),
    (g_text_news, gamer_comm_id, 'update-gaming', 'text', now()),
    (g_voice_lounge, gamer_comm_id, 'General Talk (Voice)', 'voice', now()),
    (g_voice_squad1, gamer_comm_id, 'Squad Room 1 (Voice)', 'voice', now())
  ON CONFLICT (id) DO NOTHING;

  -- 2. Dev Cafe
  INSERT INTO public.channels (id, community_id, name, type, created_at)
  VALUES
    (c_text_general, coder_comm_id, 'general-chat', 'text', now()),
    (c_text_help, coder_comm_id, 'bantuan-coding', 'text', now()),
    (c_text_showcase, coder_comm_id, 'showcase-proyek', 'text', now()),
    (c_voice_pair, coder_comm_id, 'Pair Programming ☕', 'voice', now()),
    (c_voice_seminar, coder_comm_id, 'Tech Talk Session 💡', 'voice', now())
  ON CONFLICT (id) DO NOTHING;

  -- 3. Music
  INSERT INTO public.channels (id, community_id, name, type, created_at)
  VALUES
    (m_text_general, music_comm_id, 'music-lounge', 'text', now()),
    (m_text_share, music_comm_id, 'share-rekomendasi', 'text', now()),
    (m_voice_chill, music_comm_id, 'Chill Room 🎵', 'voice', now()),
    (m_voice_jam, music_comm_id, 'Jamming Acoustic 🎸', 'voice', now())
  ON CONFLICT (id) DO NOTHING;

  -- 4. Design
  INSERT INTO public.channels (id, community_id, name, type, created_at)
  VALUES
    (d_text_general, design_comm_id, 'design-lounge', 'text', now()),
    (d_text_showcase, design_comm_id, 'showcase-uidesign', 'text', now()),
    (d_text_jobs, design_comm_id, 'info-freelance', 'text', now()),
    (d_voice_studio, design_comm_id, 'Creative Critique (Voice)', 'voice', now())
  ON CONFLICT (id) DO NOTHING;

  -- 5. Cooking
  INSERT INTO public.channels (id, community_id, name, type, created_at)
  VALUES
    (f_text_general, cook_comm_id, 'dapur-utama', 'text', now()),
    (f_text_recipes, cook_comm_id, 'resep-tradisional', 'text', now()),
    (f_text_photos, cook_comm_id, 'pamer-masakan', 'text', now()),
    (f_voice_kitchen, cook_comm_id, 'Mukbang & Ngobrol (Voice)', 'voice', now())
  ON CONFLICT (id) DO NOTHING;


  -- E. SEED DAFTAR PERTEMANAN (FRIENDS) DENGAN AKUN ANDA SECARA TIMBAL BALIK
  INSERT INTO public.friends (user_id, friend_id, created_at)
  VALUES
    (real_user_id, '11111111-1111-1111-1111-111111111111', now()), -- Rian
    ('11111111-1111-1111-1111-111111111111', real_user_id, now()),
    
    (real_user_id, '22222222-2222-2222-2222-222222222222', now()), -- Siti
    ('22222222-2222-2222-2222-222222222222', real_user_id, now()),
    
    (real_user_id, '33333333-3333-3333-3333-333333333333', now()), -- Dewi
    ('33333333-3333-3333-3333-333333333333', real_user_id, now()),

    (real_user_id, '44444444-4444-4444-4444-444444444444', now()), -- Budi
    ('44444444-4444-4444-4444-444444444444', real_user_id, now()),

    (real_user_id, '55555555-5555-5555-5555-555555555555', now()), -- Andi
    ('55555555-5555-5555-5555-555555555555', real_user_id, now())
  ON CONFLICT (user_id, friend_id) DO NOTHING;


  -- F. PEPERANGAN CHAT TIMBAL BALIK DI BERBAGAI CHANNEL
  -- 1. Gamer Zone -> #mabar-squad
  INSERT INTO public.community_messages (id, channel_id, user_id, text, created_at)
  VALUES
    (uuid_generate_v4(), g_text_mabar, '11111111-1111-1111-1111-111111111111', 'Malam ini jam 8 gas mabar Valorant ya guys. Butuh duelist satu lagi!', now() - interval '2 hours'),
    (uuid_generate_v4(), g_text_mabar, '44444444-4444-4444-4444-444444444444', 'Waduh, aku biasa main support sentinel sih. Tapi kalau terpaksa bisa deh pick Jett haha.', now() - interval '1 hour 45 minutes'),
    (uuid_generate_v4(), g_text_mabar, '11111111-1111-1111-1111-111111111111', 'Nah asik! Nanti Budi entry, aku back up pake Sova. Aman lah rank up malam ini.', now() - interval '1 hour 30 minutes'),
    (uuid_generate_v4(), g_text_mabar, '55555555-5555-5555-5555-555555555555', 'Aku ikut nonton live discord-nya aja ya bro, sambil masak kentang goreng crispy buat camilan!', now() - interval '1 hour 15 minutes'),
    (uuid_generate_v4(), g_text_mabar, real_user_id, 'Bagi kentang gorengnya dong Chef Andi! Haha. Aku nanti malem join Squad Room 1 ya pas kalian mulai.', now() - interval '30 minutes'),
    (uuid_generate_v4(), g_text_mabar, '11111111-1111-1111-1111-111111111111', 'Siaap bro! Ditunggu kehadirannya di voice room!', now() - interval '25 minutes')
  ON CONFLICT (id) DO NOTHING;

  -- 2. Dev & Code Cafe -> #bantuan-coding
  INSERT INTO public.community_messages (id, channel_id, user_id, text, created_at)
  VALUES
    (uuid_generate_v4(), c_text_help, '44444444-4444-4444-4444-444444444444', 'Ada yang tahu cara centering div di CSS paling modern ga ya? Masih sering ribet nih.', now() - interval '3 hours'),
    (uuid_generate_v4(), c_text_help, '22222222-2222-2222-2222-222222222222', 'Pake Grid atau Flexbox super gampang Bud! Cukup tulis `display: grid; place-items: center;` di parent-nya. Udah pasti center vertical & horizontal!', now() - interval '2 hours 50 minutes'),
    (uuid_generate_v4(), c_text_help, '66666666-6666-6666-6666-666666666666', 'Betul sekali saran Siti. Menggunakan CSS Grid (`place-items`) adalah metode terbersih untuk layouting modern saat ini dibandingkan metode margin-auto jaman dulu.', now() - interval '2 hours 40 minutes'),
    (uuid_generate_v4(), c_text_help, '44444444-4444-4444-4444-444444444444', 'Gila simpel banget! Selama ini saya pake position absolute terus transform translate, capek ngetik wkwk. Makasih Siti & Prof Eko!', now() - interval '2 hours 30 minutes'),
    (uuid_generate_v4(), c_text_help, real_user_id, 'Wah dapet ilmu baru juga nih dari Siti. Mantap diskusinya!', now() - interval '1 hour')
  ON CONFLICT (id) DO NOTHING;

  -- 3. Design Studio -> #showcase-uidesign
  INSERT INTO public.community_messages (id, channel_id, user_id, text, created_at)
  VALUES
    (uuid_generate_v4(), d_text_showcase, '44444444-4444-4444-4444-444444444444', 'Gimana menurut kalian mockup dashboard neobrutalism yang barusan aku bikin? Aku pake warna-warna cerah dengan stroke hitam tebal 4px.', now() - interval '5 hours'),
    (uuid_generate_v4(), d_text_showcase, '22222222-2222-2222-2222-222222222222', 'Keren parah! Kontrasnya dapet banget, kesannya berani dan premium banget. Aku suka shadow kotak tegas hitamnya!', now() - interval '4 hours 30 minutes'),
    (uuid_generate_v4(), d_text_showcase, '33333333-3333-3333-3333-333333333333', 'Estetik abis Bud! Cocok banget buat tema dashboard aplikasi pendidikan anak muda nih.', now() - interval '4 hours'),
    (uuid_generate_v4(), d_text_showcase, real_user_id, 'Sumpah ini cakep banget Budi! Boleh bagi link Figma-nya ga? Mau aku pelajari cara bikin komponen shadow-nya.', now() - interval '3 hours'),
    (uuid_generate_v4(), d_text_showcase, '44444444-4444-4444-4444-444444444444', 'Boleh dong bro! Nih link view-only Figma-nya: figma.com/file/mockup-neobrutalism-design. Silakan di-duplicate buat belajar!', now() - interval '2 hours')
  ON CONFLICT (id) DO NOTHING;

  -- 4. Cooking Studio -> #resep-rahasia
  INSERT INTO public.community_messages (id, channel_id, user_id, text, created_at)
  VALUES
    (uuid_generate_v4(), f_text_recipes, '55555555-5555-5555-5555-555555555555', 'Resep rahasia Nasi Goreng Gila ala kaki lima: Kuncinya ada di minyak baceman bawang putih dan kecap inggris pas numis bumbu halusnya!', now() - interval '6 hours'),
    (uuid_generate_v4(), f_text_recipes, '11111111-1111-1111-1111-111111111111', 'Wah pantesan! Nasi goreng buatan saya di rumah sering kurang gurih wangi. Ternyata rahasianya di kecap inggris ya Chef.', now() - interval '5 hours'),
    (uuid_generate_v4(), f_text_recipes, '66666666-6666-6666-6666-666666666666', 'Minyak bawang putih mengandung senyawa allicin yang mengalami karamelisasi saat ditumis, menghasilkan aroma gurih yang sangat khas secara ilmiah.', now() - interval '4 hours'),
    (uuid_generate_v4(), f_text_recipes, '55555555-5555-5555-5555-555555555555', 'Persis sekali penjelasannya Prof! Kimia kuliner emang ga pernah bohong wkwk.', now() - interval '3 hours')
  ON CONFLICT (id) DO NOTHING;


  -- G. POPULASI MASSIVE PESAN DIRECT MESSAGES (DMs) KE AKUN ANDA
  INSERT INTO public.direct_messages (id, sender_id, receiver_id, text, created_at)
  VALUES
    (uuid_generate_v4(), '11111111-1111-1111-1111-111111111111', real_user_id, 'Bro, jangan lupa nanti malam jam 8 kita mabar Valorant ya! Ajak yang lain juga.', now() - interval '30 minutes'),
    (uuid_generate_v4(), '22222222-2222-2222-2222-222222222222', real_user_id, 'Halo! Makasih ya udah join server Dev & Code Cafe. Kalau ada kesulitan nanya koding React, colek aku aja langsung di sini!', now() - interval '1 hour'),
    (uuid_generate_v4(), '44444444-4444-4444-4444-444444444444', real_user_id, 'Halo bro, besok pagi senggang ga? Aku mau minta review desain portfolio terbaru aku dong sebelum aku publish ke LinkedIn.', now() - interval '2 hours'),
    (uuid_generate_v4(), '55555555-5555-5555-5555-555555555555', real_user_id, 'Halo! Nanti kalau lu senggang, mampir ke channel #pamer-masakan ya. Gw baru bikin Ayam Geprek Mozzarella crispy gila wkwk.', now() - interval '3 hours'),
    (uuid_generate_v4(), '33333333-3333-3333-3333-333333333333', real_user_id, 'Hai! Nanti pas ada waktu senggang, kita jamming bareng di Karaoke Room yuk! Aku udah siapin gitar akustik aku nih.', now() - interval '4 hours')
  ON CONFLICT (id) DO NOTHING;

END $$;
