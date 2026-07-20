import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Icon from './Icon';
import { showToast } from '../lib/toast';

const TeacherSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);

  const handleLogout = () => {
    navigate('/login');
    supabase.auth.signOut().catch(() =>
      showToast('Gagal logout. Silakan coba lagi.', 'error')
    );
  };

  const menuItems = [
    { name: 'Dashboard',   icon: 'dashboard',    path: '/teacher/dashboard' },
    { name: 'My Courses',  icon: 'auto_stories', path: '/teacher/courses'   },
    { name: 'Students',    icon: 'school',        path: '/teacher/students'  },
    { name: 'Analytics',   icon: 'monitoring',   path: '/teacher/analytics' },
    { name: 'Community',   icon: 'groups',        path: '/community'         },
    { name: 'Activity',    icon: 'history',       path: '/teacher/activity'  },
    { name: 'Settings',    icon: 'settings',      path: '/teacher/settings'  },
  ];

  // Mobile: 4 primary + More
  const bottomPrimary = menuItems.slice(0, 4);   // Dashboard, My Courses, Students, Analytics
  const moreItems     = menuItems.slice(4);       // Community, Activity, Settings

  const isActive = (path) => location.pathname === path;

  const handleNav = (path) => {
    navigate(path);
    setShowMore(false);
  };

  return (
    <>
      {/* ─── Desktop Side Navigation ───────────────────────────────────────── */}
      <nav className="hidden lg:flex flex-col h-screen overflow-y-auto p-6 border-r-4 border-on-surface bg-surface-container-lowest fixed left-0 top-0 w-[280px] z-[60] pointer-events-auto">
        <div className="mb-12 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-primary text-on-primary rounded-xl border-2 border-on-surface flex items-center justify-center font-black text-xl shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] group-hover:rotate-6 transition-transform">
              H
            </div>
            <div>
              <h1 className="text-2xl font-black text-on-surface leading-none tracking-tight">Harin<span className="text-primary font-black">.</span></h1>
              <p className="text-[9px] uppercase tracking-widest text-on-surface-variant font-black mt-0.5">INSTRUCTOR SUITE</p>
            </div>
          </div>
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
          <button onClick={handleLogout} className="w-full flex items-center gap-4 text-on-surface-variant p-4 hover:bg-surface-variant rounded-xl transition-all border-2 border-transparent hover:border-on-surface">
            <Icon name="logout" className="w-6 h-6" />
            <span className="font-black">Logout</span>
          </button>
        </div>
      </nav>

      {/* ─── Mobile Bottom Navigation Bar ─────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[150] bg-surface border-t-4 border-on-surface shadow-[0px_-4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-stretch h-16">
          {bottomPrimary.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNav(item.path)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-all ${
                isActive(item.path)
                  ? 'bg-primary-container text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <Icon
                name={item.icon}
                className={`w-5 h-5 shrink-0 ${isActive(item.path) ? 'text-primary' : ''}`}
              />
              <span className={`text-[9px] font-black leading-none mt-0.5 ${isActive(item.path) ? 'text-primary' : ''}`}>
                {item.name.replace('My ', '')}
              </span>
            </button>
          ))}

          {/* More button */}
          <button
            onClick={() => setShowMore(true)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-all ${
              showMore
                ? 'bg-primary-container text-primary'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <Icon name="more_horiz" className="w-5 h-5 shrink-0" />
            <span className="text-[9px] font-black leading-none mt-0.5">Lainnya</span>
          </button>
        </div>
      </nav>

      {/* ─── Mobile More Overlay ───────────────────────────────────────────── */}
      {showMore && (
        <div
          className="lg:hidden fixed inset-0 z-[200] bg-black/50 animate-fade-in flex items-end"
          onClick={() => setShowMore(false)}
        >
          <div
            className="w-full bg-surface rounded-t-3xl border-t-4 border-on-surface shadow-[0px_-6px_0px_0px_rgba(0,0,0,1)] animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 bg-on-surface/20 rounded-full" />
            </div>

            {/* Brand strip */}
            <div className="flex items-center gap-2 px-5 pt-2 pb-4 border-b-2 border-on-surface/10">
              <div className="w-8 h-8 bg-[#FF6B4A] text-white rounded-xl border-2 border-on-surface flex items-center justify-center font-black text-sm">
                H
              </div>
              <div>
                <p className="font-black text-on-surface leading-none">Instructor Suite</p>
                <p className="text-[9px] uppercase tracking-widest text-on-surface-variant font-black">HARIN.</p>
              </div>
            </div>

            {/* Menu grid */}
            <div className="px-5 pt-4 pb-2">
              <p className="text-[9px] uppercase tracking-widest font-black text-on-surface-variant mb-3">Menu Lainnya</p>
              <div className="grid grid-cols-4 gap-3">
                {moreItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleNav(item.path)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                      isActive(item.path)
                        ? 'bg-primary-container border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        : 'border-transparent bg-surface-container-low hover:border-on-surface/30'
                    }`}
                  >
                    <Icon
                      name={item.icon}
                      className={`w-6 h-6 shrink-0 ${isActive(item.path) ? 'text-primary' : 'text-on-surface-variant'}`}
                    />
                    <span className={`text-[10px] font-black text-center leading-tight ${isActive(item.path) ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {item.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="px-5 pt-2 pb-5 border-t-2 border-on-surface/10 mt-2 flex gap-3">
              <button
                onClick={() => handleNav('/teacher/courses/create')}
                className="flex-1 bg-[#FF6B4A] text-white font-black py-2.5 rounded-xl border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-sm flex items-center justify-center gap-2"
              >
                <Icon name="add_circle" className="w-4 h-4 shrink-0" />
                New Course
              </button>
              <button
                onClick={() => { handleLogout(); setShowMore(false); }}
                className="flex-1 py-2.5 rounded-xl border-2 border-error/30 text-error font-black text-sm flex items-center justify-center gap-2 hover:bg-error/10 transition-all"
              >
                <Icon name="logout" className="w-4 h-4 shrink-0" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TeacherSidebar;
