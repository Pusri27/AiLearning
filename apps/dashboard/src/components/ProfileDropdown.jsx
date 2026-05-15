import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Icon from './Icon';
import { useUserProfile } from '../context/UserProfileContext';

const ProfileDropdown = () => {
  const navigate = useNavigate();
  const { profile } = useUserProfile();

  const initials = profile.fullName
    ? profile.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="relative group">
      <button className="w-10 h-10 border-2 border-on-surface rounded-full overflow-hidden flex items-center justify-center bg-primary-container shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
        {profile.avatarUrl ? (
          <img 
            className="w-full h-full object-cover" 
            src={profile.avatarUrl} 
            alt="Profile" 
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <span className={`${profile.avatarUrl ? 'hidden' : 'flex'} text-xs font-black text-on-primary-container`}>
          {initials}
        </span>
      </button>

      {/* Dropdown Menu */}
      <div className="absolute right-0 mt-2 w-56 bg-surface border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100]">
        <div className="p-3 border-b-2 border-on-surface bg-surface-container-low rounded-t-lg">
          <p className="font-label-bold text-sm line-clamp-1">{profile.fullName || 'Guest User'}</p>
          <p className="text-xs text-on-surface-variant line-clamp-1">{profile.email || 'Not logged in'}</p>
        </div>
        <div className="p-1">
          {profile.email ? (
            <>
              <button
                onClick={() => navigate('/profile')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-primary-container hover:text-on-primary-container transition-colors text-left font-label-bold text-sm"
              >
                <Icon name="account_circle" className="w-5 h-5" />
                Profile
              </button>
              {profile.role === 'teacher' && (
                <button
                  onClick={() => navigate('/teacher/dashboard')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-primary-container hover:text-on-primary-container transition-colors text-left font-label-bold text-sm"
                >
                  <Icon name="dashboard" className="w-5 h-5" />
                  Teacher Dashboard
                </button>
              )}
              <button
                onClick={() => navigate('/settings')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-primary-container hover:text-on-primary-container transition-colors text-left font-label-bold text-sm"
              >
                <Icon name="settings" className="w-5 h-5" />
                Settings
              </button>
              <div className="border-t-2 border-on-surface my-1" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-error-container hover:text-error transition-colors text-left font-label-bold text-sm text-error"
              >
                <Icon name="logout" className="w-5 h-5" />
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-primary-container hover:text-on-primary-container transition-colors text-left font-label-bold text-sm"
            >
              <Icon name="arrow_forward" className="w-5 h-5" />
              Login / Sign Up
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileDropdown;
