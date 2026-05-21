import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

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
  });

  const loadProfile = async (userId, email) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, role, friend_code')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      setProfile({
        id:        data.id,
        fullName:  data.full_name  || '',
        username:  data.username   || '',
        avatarUrl: data.avatar_url || '',
        role:      data.role       || 'student',
        friendCode: data.friend_code || '',
        email:     email           || '',
        isGuest:   false,
      });
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
      isGuest: true,
    });
  };

  const logout = () => {
    // Reset state immediately (optimistic) so UI doesn't lag
    localStorage.removeItem('harin_guest_session');
    setProfile({
      id: '',
      fullName: '',
      username: '',
      avatarUrl: '',
      email: '',
      role: 'student',
      friendCode: '',
      isGuest: false,
    });
    // Fire signOut in background — no await needed
    supabase.auth.signOut();
  };

  useEffect(() => {
    // Check if we have a persisted guest session
    const persistedGuest = localStorage.getItem('harin_guest_session');
    if (persistedGuest === 'true') {
      loginAsGuest();
    }

    // Load on mount if session exists
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        localStorage.removeItem('harin_guest_session'); // Clear guest if real session exists
        loadProfile(session.user.id, session.user.email);
      }
    });

    // Reload on auth change
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        localStorage.removeItem('harin_guest_session');
        loadProfile(session.user.id, session.user.email);
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('harin_guest_session');
        setProfile({ fullName: '', username: '', avatarUrl: '', email: '', role: 'student', isGuest: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Called from Settings after a successful save
  const updateProfile = (updates) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  return (
    <UserProfileContext.Provider value={{ profile, updateProfile, loadProfile, loginAsGuest, logout }}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error('useUserProfile must be used within UserProfileProvider');
  return ctx;
};
