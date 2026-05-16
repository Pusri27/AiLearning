-- 1. Create Channel Admins table
CREATE TABLE IF NOT EXISTS channel_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(channel_id, user_id)
);

-- 2. RLS for Communities
DROP POLICY IF EXISTS "Anyone can view communities" ON communities;
DROP POLICY IF EXISTS "Authenticated users can create communities" ON communities;
DROP POLICY IF EXISTS "Owners and Admins can update community" ON communities;
DROP POLICY IF EXISTS "Owners can delete community" ON communities;

CREATE POLICY "Anyone can view communities" ON communities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create communities" ON communities FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owners and Admins can update community" ON communities FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM community_members WHERE community_id = communities.id AND user_id = auth.uid() AND role = 'owner')
);
CREATE POLICY "Owners can delete community" ON communities FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM community_members WHERE community_id = communities.id AND user_id = auth.uid() AND role = 'owner')
);

-- 3. RLS for Channels
DROP POLICY IF EXISTS "Anyone can view channels" ON channels;
DROP POLICY IF EXISTS "Managers can create channels" ON channels;
DROP POLICY IF EXISTS "Managers can update channels" ON channels;
DROP POLICY IF EXISTS "Managers can delete channels" ON channels;

CREATE POLICY "Anyone can view channels" ON channels FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can create channels" ON channels FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM community_members WHERE community_id = channels.community_id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
);
CREATE POLICY "Managers can update channels" ON channels FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM community_members WHERE community_id = channels.community_id AND user_id = auth.uid() AND role IN ('owner', 'admin')) OR 
  EXISTS (SELECT 1 FROM channel_admins WHERE channel_id = channels.id AND user_id = auth.uid())
);
CREATE POLICY "Managers can delete channels" ON channels FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM community_members WHERE community_id = channels.community_id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
);

-- 4. RLS for Community Members
DROP POLICY IF EXISTS "Anyone can view members" ON community_members;
DROP POLICY IF EXISTS "Anyone can join communities" ON community_members;
DROP POLICY IF EXISTS "Managers can manage members" ON community_members;
DROP POLICY IF EXISTS "Managers can delete members" ON community_members;

CREATE POLICY "Anyone can view members" ON community_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can join communities" ON community_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Managers can manage members" ON community_members FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM community_members WHERE community_id = community_members.community_id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
);
CREATE POLICY "Managers can delete members" ON community_members FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM community_members WHERE community_id = community_members.community_id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
);

-- 5. RLS for User Achievements
DROP POLICY IF EXISTS "Users can view their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can earn achievements" ON user_achievements;

CREATE POLICY "Users can view their own achievements" ON user_achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can earn achievements" ON user_achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 6. Permission helper functions
CREATE OR REPLACE FUNCTION is_community_manager(comm_id UUID, u_id UUID) 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM community_members 
    WHERE community_id = comm_id AND user_id = u_id AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql;
