import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Icon from './Icon';
import { useUserProfile } from '../context/UserProfileContext';

const ProfileDropdown = () => {
  const navigate = useNavigate();
  const { profile, logout } = useUserProfile();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const isGuest = profile.isGuest;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = profile.fullName
    ? profile.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/login');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 border-2 border-on-surface rounded-full overflow-hidden flex items-center justify-center bg-primary-container shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all focus:outline-none"
      >
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
      <div className={`absolute right-0 mt-2 w-56 bg-surface border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg transition-all duration-200 z-[100] ${isOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-[-4px]'}`}>
        <div className="p-3 border-b-2 border-on-surface bg-surface-container-low rounded-t-lg">
          <p className="font-label-bold text-sm line-clamp-1">{profile.fullName || { id: 'Tamu', en: 'Guest User', ja: 'ゲストユーザー', zh: '访客用户' }[profile.language || 'id']}</p>
          <p className="text-xs text-on-surface-variant line-clamp-1">{profile.email || { id: 'Belum masuk', en: 'Not logged in', ja: '未ログイン', zh: '未登录' }[profile.language || 'id']}</p>
        </div>
        <div className="p-1">
          {!isGuest && profile.email ? (
            <>
              <button
                onClick={() => {
                  navigate('/profile');
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-primary-container hover:text-on-primary-container transition-colors text-left font-label-bold text-sm"
              >
                <Icon name="account_circle" className="w-5 h-5" />
                {{ id: 'Profil', en: 'Profile', ja: 'プロフィール', zh: '个人资料' }[profile.language || 'id']}
              </button>
              {profile.role === 'teacher' && (
                <button
                  onClick={() => {
                    navigate('/teacher/dashboard');
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-primary-container hover:text-on-primary-container transition-colors text-left font-label-bold text-sm"
                >
                  <Icon name="dashboard" className="w-5 h-5" />
                  {{ id: 'Dashboard Pengajar', en: 'Teacher Dashboard', ja: '講師ダッシュボード', zh: '教师控制台' }[profile.language || 'id']}
                </button>
              )}
              <button
                onClick={() => {
                  navigate('/settings');
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-primary-container hover:text-on-primary-container transition-colors text-left font-label-bold text-sm"
              >
                <Icon name="settings" className="w-5 h-5" />
                {{ id: 'Pengaturan', en: 'Settings', ja: '設定', zh: '系统设置' }[profile.language || 'id']}
              </button>
              <button
                onClick={() => {
                  navigate('/help');
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-primary-container hover:text-on-primary-container transition-colors text-left font-label-bold text-sm"
              >
                <Icon name="help" className="w-5 h-5" />
                {{ id: 'Bantuan', en: 'Help', ja: 'ヘルプ', zh: '帮助支持' }[profile.language || 'id']}
              </button>
              <div className="border-t-2 border-on-surface my-1" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-error-container hover:text-error transition-colors text-left font-label-bold text-sm text-error"
              >
                <Icon name="logout" className="w-5 h-5" />
                {{ id: 'Keluar', en: 'Logout', ja: 'ログアウト', zh: '退出登录' }[profile.language || 'id']}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  navigate('/login');
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-primary-container hover:text-on-primary-container transition-colors text-left font-label-bold text-sm"
              >
                <Icon name="login" className="w-5 h-5" />
                {{ id: 'Masuk', en: 'Login', ja: 'ログイン', zh: '登录' }[profile.language || 'id']}
              </button>
              <button
                onClick={() => {
                  navigate('/signup');
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-primary-container hover:text-on-primary-container transition-colors text-left font-label-bold text-sm"
              >
                <Icon name="person_add" className="w-5 h-5" />
                {{ id: 'Daftar', en: 'Sign Up', ja: '新規登録', zh: '注册' }[profile.language || 'id']}
              </button>
              <button
                onClick={() => {
                  navigate('/help');
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-primary-container hover:text-on-primary-container transition-colors text-left font-label-bold text-sm"
              >
                <Icon name="help" className="w-5 h-5" />
                {{ id: 'Bantuan', en: 'Help', ja: 'ヘルプ', zh: '帮助支持' }[profile.language || 'id']}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileDropdown;
