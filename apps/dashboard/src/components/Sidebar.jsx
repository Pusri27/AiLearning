import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();

  const navItems = [
    { to: '/', icon: 'dashboard', label: 'Dashboard' },
    { to: '/catalog', icon: 'explore', label: 'Catalog' },
    { to: '/study', icon: 'music_note', label: 'Study Space' },
    { to: '/achievements', icon: 'workspace_premium', label: 'Achievements' },
    { to: '/courses', icon: 'school', label: 'My Courses' },
    { to: '/wishlist', icon: 'favorite', label: 'Wishlist' },
    { to: '/cart', icon: 'shopping_cart', label: 'Cart' },
    { to: '/blog', icon: 'article', label: 'Blog Feed' },
  ];

  return (
    <aside className="w-64 bg-surface border-r-4 border-on-surface p-6 flex flex-col h-screen overflow-y-auto hidden md:flex shrink-0 z-50 shadow-[4px_0px_0px_0px_rgba(0,0,0,1)] sticky top-0">
      {/* Brand Logo */}
      <div className="mb-10 px-2 cursor-pointer" onClick={() => navigate('/')}>
        <h1 className="font-headline-md text-headline-md font-black text-primary mb-1 tracking-tighter">Lumina Learning</h1>
        <p className="font-label-bold text-label-bold text-secondary">Student Portal</p>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink 
            key={item.to}
            to={item.to} 
            className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg border-2 border-transparent transition-all ${isActive ? 'bg-primary-container !border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]' : 'hover:bg-surface-container-high'}`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-label-bold">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Actions */}
      <div className="mt-auto pt-6 border-t-4 border-on-surface space-y-4">
        <button 
          onClick={() => navigate('/pricing')}
          className="w-full bg-secondary text-on-secondary brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg py-3 px-4 font-label-bold flex items-center justify-center gap-2 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0 active:translate-y-0 active:shadow-none"
        >
          <span className="material-symbols-outlined">bolt</span>
          Upgrade to Pro
        </button>
        <div className="space-y-1">
          <NavLink to="/help" className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg border-2 border-transparent transition-all ${isActive ? 'bg-primary-container !border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]' : 'hover:bg-surface-container-high'}`}>
            <span className="material-symbols-outlined">help</span>
            <span className="font-label-bold">Help</span>
          </NavLink>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
