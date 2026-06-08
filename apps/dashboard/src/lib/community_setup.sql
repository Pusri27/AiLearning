-- 1. AKTIFKAN EKSTENSI UNTUK UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL UTAMA (Jika belum ada)
CREATE TABLE IF NOT EXISTS communities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  accent_color TEXT DEFAULT '#3b82f6',
  invite_code TEXT UNIQUE DEFAULT substring(md5(random()::text) from 1 for 8),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_members (
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (community_id, user_id)
);

CREATE TABLE IF NOT EXISTS channels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'voice')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS friends (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, friend_id)
);

CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TAMBAH KOLOM FRIEND CODE KE PROFIL
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS friend_code TEXT UNIQUE DEFAULT substring(md5(random()::text) from 1 for 6);

-- 4. FUNGSI RPC: Join Community
CREATE OR REPLACE FUNCTION join_community(invite_code_input TEXT)
RETURNS UUID AS $$
DECLARE
  target_comm_id UUID;
BEGIN
  SELECT id INTO target_comm_id FROM communities WHERE invite_code = invite_code_input;
  
  IF target_comm_id IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO community_members (community_id, user_id, role)
  VALUES (target_comm_id, auth.uid(), 'member')
  ON CONFLICT (community_id, user_id) DO NOTHING;

  RETURN target_comm_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FUNGSI RPC: Add Friend by Code
CREATE OR REPLACE FUNCTION add_friend_by_code(friend_code_input TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  target_user_id UUID;
BEGIN
  SELECT id INTO target_user_id FROM profiles WHERE friend_code = friend_code_input;
  
  IF target_user_id IS NULL OR target_user_id = auth.uid() THEN
    RETURN FALSE;
  END IF;

  INSERT INTO friends (user_id, friend_id)
  VALUES (auth.uid(), target_user_id)
  ON CONFLICT (user_id, friend_id) DO NOTHING;

  INSERT INTO friends (user_id, friend_id)
  VALUES (target_user_id, auth.uid())
  ON CONFLICT (user_id, friend_id) DO NOTHING;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RESET & AKTIFKAN RLS POLICIES
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Membersihkan policy lama sebelum membuat yang baru
DROP POLICY IF EXISTS "Anyone can view communities" ON communities;
CREATE POLICY "Anyone can view communities" ON communities FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view members" ON community_members;
CREATE POLICY "Anyone can view members" ON community_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can join communities" ON community_members;
CREATE POLICY "Users can join communities" ON community_members FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view channels" ON channels;
CREATE POLICY "Anyone can view channels" ON channels FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view messages" ON community_messages;
CREATE POLICY "Anyone can view messages" ON community_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can send messages" ON community_messages;
CREATE POLICY "Users can send messages" ON community_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their friends" ON friends;
CREATE POLICY "Users can view their friends" ON friends FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their DMs" ON direct_messages;
CREATE POLICY "Users can view their DMs" ON direct_messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send DMs" ON direct_messages;
CREATE POLICY "Users can send DMs" ON direct_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
