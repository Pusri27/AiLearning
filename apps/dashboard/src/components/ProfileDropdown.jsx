import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const ProfileDropdown = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="relative group">
      <button className="w-10 h-10 border-2 border-on-surface rounded-full overflow-hidden flex items-center justify-center bg-primary-container shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
        {user?.user_metadata?.avatar_url ? (
          <img className="w-full h-full object-cover" src={user.user_metadata.avatar_url} alt="Profile" />
        ) : (
          <span className="material-symbols-outlined text-on-primary-container">person</span>
        )}
      </button>

      {/* Dropdown Menu */}
      <div className="absolute right-0 mt-2 w-56 bg-surface border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100]">
        <div className="p-3 border-b-2 border-on-surface bg-surface-container-low">
          <p className="font-label-bold text-sm line-clamp-1">{user?.user_metadata?.full_name || 'Guest User'}</p>
          <p className="text-xs text-on-surface-variant line-clamp-1">{user?.email || 'Not logged in'}</p>
        </div>
        <div className="p-1">
          {user ? (
            <>
              <button 
                onClick={() => navigate('/profile')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-primary-container hover:text-on-primary-container transition-colors text-left font-label-bold text-sm"
              >
                <span className="material-symbols-outlined text-lg">person</span>
                Profile
              </button>
              {user?.user_metadata?.role === 'teacher' && (
                <button 
                  onClick={() => navigate('/teacher/dashboard')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-primary-container hover:text-on-primary-container transition-colors text-left font-label-bold text-sm"
                >
                  <span className="material-symbols-outlined text-lg">dashboard_customize</span>
                  Teacher Dashboard
                </button>
              )}
              <button 
                onClick={() => navigate('/settings')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-primary-container hover:text-on-primary-container transition-colors text-left font-label-bold text-sm"
              >
                <span className="material-symbols-outlined text-lg">settings</span>
                Settings
              </button>
              <div className="border-t-2 border-on-surface my-1"></div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-error-container hover:text-error transition-colors text-left font-label-bold text-sm text-error"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
                Logout
              </button>
            </>
          ) : (
            <button 
              onClick={() => navigate('/login')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-primary-container hover:text-on-primary-container transition-colors text-left font-label-bold text-sm"
            >
              <span className="material-symbols-outlined text-lg">login</span>
              Login / Sign Up
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileDropdown;
