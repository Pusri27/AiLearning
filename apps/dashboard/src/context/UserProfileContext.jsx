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
  });

  const loadProfile = async (userId, email) => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, username, avatar_url, role')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      setProfile({
        fullName:  data.full_name  || '',
        username:  data.username   || '',
        avatarUrl: data.avatar_url || '',
        role:      data.role       || 'student',
        email:     email           || '',
      });
    }
  };

  useEffect(() => {
    // Load on mount if session exists
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) loadProfile(session.user.id, session.user.email);
    });

    // Reload on auth change
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session) loadProfile(session.user.id, session.user.email);
      else setProfile({ fullName: '', username: '', avatarUrl: '', email: '', role: 'student' });
    });

    return () => subscription.unsubscribe();
  }, []);

  // Called from Settings after a successful save
  const updateProfile = (updates) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  return (
    <UserProfileContext.Provider value={{ profile, updateProfile, loadProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error('useUserProfile must be used within UserProfileProvider');
  return ctx;
};
