import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const TeacherSidebar = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert('Error logging out: ' + error.message);
    } else {
      navigate('/login');
    }
  };

  const menuItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/teacher/dashboard' },
    { name: 'My Courses', icon: 'auto_stories', path: '/teacher/courses' },
    { name: 'Students', icon: 'group', path: '/teacher/students' },
    { name: 'Analytics', icon: 'monitoring', path: '/teacher/analytics' },
    { name: 'Activity', icon: 'history', path: '/teacher/activity' },
    { name: 'Settings', icon: 'settings', path: '/teacher/settings' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Desktop Side Navigation */}
      <nav className="hidden lg:flex flex-col h-full p-6 border-r-4 border-on-surface bg-surface-container-lowest fixed left-0 top-0 w-[280px] z-[60] pointer-events-auto">
        <div className="mb-12 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-4xl font-black group-hover:rotate-12 transition-transform">auto_awesome</span>
            <h1 className="text-3xl font-black text-primary">Lumina</h1>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-black mt-1 ml-1">Instructor Suite</p>
        </div>

        <button 
          onClick={() => navigate('/teacher/courses/create')}
          className="mb-8 w-full bg-[#FF6B4A] hover:bg-[#ff5533] text-white font-black py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none border-2 border-on-surface z-[70] cursor-pointer"
        >
          <span className="material-symbols-outlined font-black">add_circle</span>
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
              <span className={`material-symbols-outlined text-2xl ${isActive(item.path) ? 'icon-fill' : ''}`} style={{ fontVariationSettings: isActive(item.path) ? "'FILL' 1" : "" }}>
                {item.icon}
              </span>
              <span className="font-black text-lg">{item.name}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto space-y-2 pt-6 border-t border-outline-variant">
          <button className="w-full flex items-center gap-4 text-on-surface-variant p-4 hover:bg-surface-variant rounded-xl transition-all">
            <span className="material-symbols-outlined">help</span>
            <span className="font-bold">Help</span>
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-4 text-on-surface-variant p-4 hover:bg-surface-variant rounded-xl transition-all border-2 border-transparent hover:border-on-surface">
            <span className="material-symbols-outlined font-black">logout</span>
            <span className="font-black">Logout</span>
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 bg-surface border-t border-outline-variant shadow-lg rounded-t-2xl">
        {menuItems.slice(1, 5).map((item) => (
          <button
            key={item.name}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
              isActive(item.path)
                ? 'bg-secondary-container text-on-secondary-container px-4 py-1'
                : 'text-on-surface-variant'
            }`}
          >
            <span className={`material-symbols-outlined ${isActive(item.path) ? 'icon-fill' : ''}`} style={{ fontVariationSettings: isActive(item.path) ? "'FILL' 1" : "" }}>
              {item.icon}
            </span>
            <span className="text-[10px] font-bold">{item.name.replace('My ', '')}</span>
          </button>
        ))}
      </nav>
    </>
  );
};

export default TeacherSidebar;
