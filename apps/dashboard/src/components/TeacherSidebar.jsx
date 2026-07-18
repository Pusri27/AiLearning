import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Icon from './Icon';
import { showToast } from '../lib/toast';

const TeacherSidebar = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showToast('Gagal logout. Silakan coba lagi.', 'error');
    } else {
      navigate('/login');
    }
  };

  const menuItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/teacher/dashboard' },
    { name: 'My Courses', icon: 'auto_stories', path: '/teacher/courses' },
    { name: 'Students', icon: 'group', path: '/teacher/students' },
    { name: 'Analytics', icon: 'monitoring', path: '/teacher/analytics' },
    { name: 'Community', icon: 'groups', path: '/community' },
    { name: 'Activity', icon: 'history', path: '/teacher/activity' },
    { name: 'Settings', icon: 'settings', path: '/teacher/settings' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Desktop Side Navigation */}
      <nav className="hidden lg:flex flex-col h-full p-6 border-r-4 border-on-surface bg-surface-container-lowest fixed left-0 top-0 w-[280px] z-[60] pointer-events-auto">
        <div className="mb-12 cursor-pointer group" onClick={() => navigate('/teacher/dashboard')}>
          <div className="flex items-center gap-2">
            <Icon name="auto_awesome" className="w-10 h-10 text-primary group-hover:rotate-12 transition-transform" />
            <h1 className="text-3xl font-black text-primary">Harin</h1>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-black mt-1 ml-1">Instructor Suite</p>
        </div>

        <button 
          onClick={() => navigate('/teacher/courses/create')}
          className="mb-8 w-full bg-[#FF6B4A] hover:bg-[#ff5533] text-white font-black py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none border-2 border-on-surface z-[70] cursor-pointer"
        >
          <Icon name="add_circle" className="w-6 h-6" />
          NEW COURSE
        </button>

        <div className="flex-1 space-y-3">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(item.path);
              }}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border-2 cursor-pointer z-[70] ${
                isActive(item.path)
                  ? 'bg-primary-container text-on-primary-container font-black border-on-surface shadow-[4px_4px_0px_0px_#1c1b1b] translate-x-1'
                  : 'text-on-surface-variant border-transparent hover:bg-surface-variant hover:border-on-surface'
              }`}
            >
              <Icon name={item.icon} className={`w-6 h-6 ${isActive(item.path) ? 'fill-current' : ''}`} />
              <span className="font-black text-lg">{item.name}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto space-y-2 pt-6 border-t border-outline-variant">
          <button className="w-full flex items-center gap-4 text-on-surface-variant p-4 hover:bg-surface-variant rounded-xl transition-all">
            <Icon name="help" className="w-6 h-6" />
            <span className="font-bold">Help</span>
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-4 text-on-surface-variant p-4 hover:bg-surface-variant rounded-xl transition-all border-2 border-transparent hover:border-on-surface">
            <Icon name="logout" className="w-6 h-6" />
            <span className="font-black">Logout</span>
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2.5 bg-surface border-t-4 border-on-surface shadow-[0_-4px_0px_0px_rgba(0,0,0,1)]">
        {[
          { name: 'Home', icon: 'dashboard', path: '/teacher/dashboard' },
          { name: 'Courses', icon: 'auto_stories', path: '/teacher/courses' },
          { name: 'Students', icon: 'group', path: '/teacher/students' },
          { name: 'Analytics', icon: 'monitoring', path: '/teacher/analytics' },
        ].map((item) => (
          <button
            key={item.name}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center p-1 rounded-xl transition-all ${
              isActive(item.path)
                ? 'text-primary font-black scale-105'
                : 'text-on-surface-variant'
            }`}
          >
            <Icon name={item.icon} className="w-6 h-6" />
            <span className="text-[10px] font-black mt-0.5">{item.name}</span>
          </button>
        ))}
        {/* Menu Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center p-1 rounded-xl transition-all ${
            isMobileMenuOpen ? 'text-primary font-black' : 'text-on-surface-variant'
          }`}
        >
          <Icon name="menu" className="w-6 h-6" />
          <span className="text-[10px] font-black mt-0.5">Menu</span>
        </button>
      </nav>

      {/* Mobile Slide-out Drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        {/* Drawer Content */}
        <div
          className={`absolute left-0 top-0 h-full w-72 bg-surface border-r-4 border-on-surface p-6 flex flex-col shadow-[4px_0px_0px_0px_rgba(0,0,0,1)] transition-transform duration-300 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Brand Logo & Close Button */}
          <div className="flex justify-between items-center mb-6">
            <div className="cursor-pointer" onClick={() => { navigate('/teacher/dashboard'); setIsMobileMenuOpen(false); }}>
              <h1 className="font-headline-md text-headline-md font-black text-primary mb-1 tracking-tighter">Harin</h1>
              <p className="font-label-bold text-label-bold text-secondary text-[10px] uppercase tracking-widest">Instructor Suite</p>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1 rounded-lg border-2 border-on-surface bg-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-on-surface hover:text-error transition-colors cursor-pointer"
            >
              <Icon name="close" className="w-5 h-5" />
            </button>
          </div>

          <button 
            onClick={() => { navigate('/teacher/courses/create'); setIsMobileMenuOpen(false); }}
            className="mb-6 w-full bg-[#FF6B4A] hover:bg-[#ff5533] text-white font-black py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-on-surface cursor-pointer text-sm"
          >
            <Icon name="add_circle" className="w-5 h-5" />
            NEW COURSE
          </button>

          {/* Navigation Links inside Drawer */}
          <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
            {menuItems.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  navigate(item.path);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left cursor-pointer ${
                  isActive(item.path)
                    ? 'bg-primary-container border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]'
                    : 'border-transparent hover:bg-surface-container-high'
                }`}
              >
                <Icon name={item.icon} className="w-6 h-6 shrink-0" />
                <span className="font-label-bold text-sm">{item.name}</span>
              </button>
            ))}
          </nav>

          {/* Footer Actions inside Drawer */}
          <div className="mt-auto pt-6 border-t-4 border-on-surface space-y-4">
            <div className="space-y-1">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-surface-container-high transition-all text-left cursor-pointer"
              >
                <Icon name="help" className="w-6 h-6 shrink-0" />
                <span className="font-label-bold">Help</span>
              </button>
              <button
                onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-error/10 text-error transition-all text-left cursor-pointer border-2 border-transparent hover:border-on-surface"
              >
                <Icon name="logout" className="w-6 h-6 shrink-0" />
                <span className="font-label-bold">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TeacherSidebar;
