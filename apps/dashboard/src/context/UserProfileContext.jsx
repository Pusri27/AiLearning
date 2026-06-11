import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { showToast } from '../lib/toast';

const UserProfileContext = createContext(null);

export const UserProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState({
    fullName: '',
    username: '',
    avatarUrl: '',
    email: '',
    role: 'student',
    friend_code: '',
    isGuest: false,
    language: localStorage.getItem('harin_content_language') || 'id',
  });

  const loadProfile = async (userId, email, userMetadata = null) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, role, friend_code')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        const errMsg = error.message?.toLowerCase() || '';
        if (error.status === 401 || error.status === 403 || errMsg.includes('jwt') || errMsg.includes('invalid ticket') || errMsg.includes('invalid claim') || errMsg.includes('signature')) {
          console.warn('Stale auth token detected. Purging session...');
          await supabase.auth.signOut();
          return;
        }
      }

      if (data) {
        setProfile({
          id:        data.id,
          fullName:  data.full_name  || '',
          username:  data.username   || '',
          avatarUrl: data.avatar_url || '',
          role:      data.role       || 'student',
          friendCode: data.friend_code || '',
          friend_code: data.friend_code || '',
          email:     email           || '',
          isGuest:   false,
          language:  localStorage.getItem('harin_content_language') || 'id',
        });
      } else {
        console.warn('Profile not found in database for user:', userId);
        const defaultName = userMetadata?.full_name || (email ? email.split('@')[0] : 'User');
        const defaultRole = userMetadata?.role || 'student';
        const defaultUsername = `user_${userId.slice(0, 8)}`;
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name: defaultName,
            username: defaultUsername,
            role: defaultRole
          });

        setProfile({
          id: userId,
          fullName: defaultName,
          username: defaultUsername,
          avatarUrl: '',
          role: defaultRole,
          friendCode: '',
          friend_code: '',
          email: email || '',
          isGuest: false,
          language: localStorage.getItem('harin_content_language') || 'id',
        });
      }
    } catch (err) {
      console.error('Failed in loadProfile:', err);
    }
  };

  const loginAsGuest = () => {
    localStorage.setItem('harin_guest_session', 'true');
    setProfile({
      fullName: 'Tamu Harin',
      username: 'guest_user',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest',
      email: '',
      role: 'student',
      friendCode: '',
      friend_code: '',
      isGuest: true,
      language: localStorage.getItem('harin_content_language') || 'id',
    });
  };

  const logout = () => {
    localStorage.removeItem('harin_guest_session');
    setProfile({
      id: '',
      fullName: '',
      username: '',
      avatarUrl: '',
      email: '',
      role: 'student',
      friendCode: '',
      friend_code: '',
      isGuest: false,
      language: localStorage.getItem('harin_content_language') || 'id',
    });
    supabase.auth.signOut();
  };

  useEffect(() => {
    const persistedGuest = localStorage.getItem('harin_guest_session');
    if (persistedGuest === 'true') {
      loginAsGuest();
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.warn('Session is stale or invalid on mount, signing out:', error);
          await supabase.auth.signOut();
          localStorage.removeItem('harin_guest_session');
          return;
        }
        if (user) {
          localStorage.removeItem('harin_guest_session');
          loadProfile(user.id, user.email, user.user_metadata);
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        localStorage.removeItem('harin_guest_session');
        loadProfile(session.user.id, session.user.email, session.user.user_metadata);
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('harin_guest_session');
        setProfile({ fullName: '', username: '', avatarUrl: '', email: '', role: 'student', friendCode: '', friend_code: '', isGuest: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Called from Settings after a successful save
  const updateProfile = (updates) => {
    if (updates.language !== undefined) {
      localStorage.setItem('harin_content_language', updates.language);
    }
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const [unreadCommunityCount, setUnreadCommunityCount] = useState(0);

  const fetchGlobalUnreadCount = async (userId) => {
    if (!userId) return;
    try {
      const { data: memberships } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', userId);
        
      if (!memberships || memberships.length === 0) {
        setUnreadCommunityCount(0);
        return;
      }
      
      const communityIds = memberships.map(m => m.community_id);
      
      const { data: channels } = await supabase
        .from('channels')
        .select('id')
        .in('community_id', communityIds)
        .neq('type', 'voice');
        
      if (!channels || channels.length === 0) {
        setUnreadCommunityCount(0);
        return;
      }
      
      const channelIds = channels.map(c => c.id);
      
      let totalUnread = 0;
      for (const channelId of channelIds) {
        const lastRead = localStorage.getItem(`last_read_channel:${channelId}`) || '1970-01-01T00:00:00.000Z';
        
        const { count, error } = await supabase
          .from('community_messages')
          .select('*', { count: 'exact', head: true })
          .eq('channel_id', channelId)
          .gt('created_at', lastRead)
          .neq('user_id', userId);
          
        if (!error && count) {
          totalUnread += count;
        }
      }
      setUnreadCommunityCount(totalUnread);
    } catch (err) {
      console.error('Error fetching global unread count:', err);
    }
  };

  const recalculateUnread = () => {
    if (profile?.id) {
      fetchGlobalUnreadCount(profile.id);
    }
  };

  useEffect(() => {
    if (!profile?.id) {
      setUnreadCommunityCount(0);
      return;
    }

    fetchGlobalUnreadCount(profile.id);

    // Subscribe to all insertions on community_messages to update unread badge
    const globalMsgChannel = supabase
      .channel('global_sidebar_notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'community_messages'
      }, (payload) => {
        const newMsg = payload.new;
        if (!newMsg || newMsg.user_id === profile.id) return;
        
        // Simply trigger recalculation to ensure consistency and correctness
        fetchGlobalUnreadCount(profile.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(globalMsgChannel);
    };
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) return;

    console.log("🔔 [Global Realtime Notif] Subscribing to notifications table for user ID:", profile.id);

    const notifChannel = supabase
      .channel('global-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      }, (payload) => {
        const newNotif = payload.new;
        if (!newNotif) return;

        const isMeOrBroadcast = !newNotif.user_id || newNotif.user_id === profile.id;
        console.log(`🔔 [Global Realtime Notif] Received:`, newNotif, `isMeOrBroadcast:`, isMeOrBroadcast);

        if (isMeOrBroadcast) {
          // 1. Tampilkan in-app toast
          showToast(`${newNotif.title || 'Notifikasi Baru'}: ${newNotif.content || ''}`, 'success');

          // 2. Trigger native browser desktop notification
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(newNotif.title || "Notifikasi Baru", {
                body: newNotif.content || "",
                icon: "/favicon.svg"
              });
            } catch (err) {
              console.error("🔔 [Global Realtime Notif] Error trigger native notification:", err);
            }
          }

          // 3. Dispatch custom event to notify any mounted dropdowns to refresh
          window.dispatchEvent(new CustomEvent('harin-new-notification', { detail: newNotif }));
        }
      })
      .subscribe((status, err) => {
        console.log(`🔔 [Global Realtime Notif] Subscription status: ${status}`, err || '');
      });

    return () => {
      console.log("🔔 [Global Realtime Notif] Cleaning up global subscription...");
      supabase.removeChannel(notifChannel);
    };
  }, [profile?.id]);

  return (
    <UserProfileContext.Provider value={{ profile, updateProfile, loadProfile, loginAsGuest, logout, unreadCommunityCount, recalculateUnread }}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error('useUserProfile must be used within UserProfileProvider');
  return ctx;
};
