import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import Icon from './Icon';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { useUserProfile } from '../context/UserProfileContext';
import { 
  MusicIcon, 
  CrossIcon, 
  BrainIcon, 
  PianoIcon, 
  RainIcon, 
  CoffeeIcon, 
  FogIcon,
  PlayIcon,
  PauseIcon
} from './Icons';

const getMoodIcon = (iconName, className) => {
  switch (iconName) {
    case 'music': return <MusicIcon className={className} />;
    case 'brain': return <BrainIcon className={className} />;
    case 'piano': return <PianoIcon className={className} />;
    case 'rain': return <RainIcon className={className} />;
    case 'coffee': return <CoffeeIcon className={className} />;
    case 'fog': return <FogIcon className={className} />;
    default: return null;
  }
};

// Safe hook — sidebar might render before context in rare cases
const useMusicPlayerSafe = () => {
  try { return useMusicPlayer(); }
  catch { return null; }
};

const Sidebar = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const music     = useMusicPlayerSafe();
  const { profile, logout } = useUserProfile();
  const isGuest   = profile.isGuest;

  const navItems = [
    { to: '/',            iconName: 'dashboard',         label: 'Dashboard'    },
    { to: '/catalog',     iconName: 'search',            label: 'Catalog'      },
    { to: '/study',       iconName: 'music_note',        label: 'Study Space'  },
    { to: '/achievements',iconName: 'workspace_premium', label: 'Achievements', hidden: isGuest },
    { to: '/community',    iconName: 'groups',            label: 'Community'    },
    { to: '/courses',     iconName: 'school',            label: 'My Courses',   hidden: isGuest },
    { to: '/cart',        iconName: 'shopping_cart',     label: 'Cart'         },
    { to: '/blog',        iconName: 'article',           label: 'Blog Feed'    },
  ];

  const onStudyPage = location.pathname === '/study';
  const showPlayer  = music && music.isMiniPlayerVisible && !onStudyPage;

  return (
    <aside className="w-64 bg-surface border-r-4 border-on-surface p-6 flex flex-col h-screen overflow-y-auto hidden md:flex shrink-0 z-50 shadow-[4px_0px_0px_0px_rgba(0,0,0,1)] sticky top-0">
      {/* Brand Logo */}
      <div className="mb-10 px-2 cursor-pointer" onClick={() => navigate('/')}>
        <h1 className="font-headline-md text-headline-md font-black text-primary mb-1 tracking-tighter">Harin Learning</h1>
        <p className="font-label-bold text-label-bold text-secondary">{isGuest ? 'Guest Mode' : 'Student Portal'}</p>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.filter(i => !i.hidden).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/' || item.to === '/courses' || item.to === '/catalog'}
            className={({ isActive }) => {
              // Highlight Catalog even when viewing details /courses/:id
              const isCourseDetail = location.pathname.startsWith('/courses/') && location.pathname !== '/courses';
              const trulyActive = isActive || (item.to === '/catalog' && isCourseDetail);

              return `flex items-center gap-3 p-3 rounded-lg border-2 border-transparent transition-all ${
                trulyActive
                  ? 'bg-primary-container !border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]'
                  : 'hover:bg-surface-container-high'
              }`;
            }}
          >
            <Icon name={item.iconName} className="w-6 h-6 shrink-0" />
            <span className="font-label-bold">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* ── Sidebar Mini Music Player ───────────────────────────── */}
      {music && (
        <div className="mt-4">
          {showPlayer ? (
            /* Playing state — full mini card */
            <div
              className="border-2 border-on-surface rounded-xl overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-300"
              style={{ backgroundColor: music.activeMood.accent + '18' }}
            >
              {/* Thumbnail strip */}
              <div
                className="relative h-20 bg-cover bg-center border-b-2 border-on-surface"
                style={{ backgroundImage: `url("${music.activeMood.img}")` }}
              >
                <div className="absolute inset-0 bg-black/40" />
                {/* Play/pause overlay */}
                <button
                  onClick={() => music.setIsPlaying(p => !p)}
                  className="absolute inset-0 flex items-center justify-center group"
                >
                  <div
                    className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-white text-sm font-black group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: music.activeMood.accent + 'cc' }}
                  >
                    {music.isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                  </div>
                </button>
                {/* Equalizer top-right */}
                <div className="absolute top-2 right-2 flex items-end gap-[2px] h-4">
                  {[70,40,90,55,75].map((h, i) => (
                    <div
                      key={i}
                      className="w-[2px] rounded-sm"
                      style={{
                        backgroundColor: 'white',
                        height: `${h}%`,
                        animation: music.isPlaying
                          ? `equalizerBounce ${0.3 + i * 0.08}s ease-in-out infinite alternate`
                          : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Info row */}
              <div
                className="px-3 py-2 flex items-center justify-between gap-2"
                style={{ backgroundColor: music.activeMood.accent + '28' }}
              >
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-widest text-on-surface opacity-50">{music.isPlaying ? 'Now Playing' : 'Paused'}</p>
                  <p className="text-xs font-black text-on-surface truncate flex items-center gap-1">
                    {getMoodIcon(music.activeMood.iconName, "w-3 h-3")} {music.activeMood.title}
                  </p>
                </div>
                <button
                  onClick={() => {
                    music.setIsPlaying(false);
                    music.setIsMiniPlayerVisible(false);
                  }}
                  className="shrink-0 w-6 h-6 rounded border-2 border-on-surface/30 flex items-center justify-center text-on-surface-variant hover:text-error hover:border-error transition-colors"
                >
                  <CrossIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Mood pills — horizontal scroll */}
              <div className="flex gap-1.5 px-3 py-2 overflow-x-auto scrollbar-hide border-t border-on-surface/10">
                {music.moods.map(mood => {
                  const active = music.activeMood.youtubeId === mood.youtubeId;
                  return (
                    <button
                      key={mood.youtubeId}
                      onClick={() => music.play(mood)}
                      className="shrink-0 text-base hover:scale-125 transition-transform"
                      title={mood.title}
                      style={active ? { filter: `drop-shadow(0 0 4px ${mood.accent})` } : {}}
                    >
                      {getMoodIcon(mood.iconName, "w-4 h-4")}
                    </button>
                  );
                })}
              </div>

              {/* Go to Study Space */}
              <button
                onClick={() => navigate('/study')}
                className="w-full py-1.5 text-[9px] font-black uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors border-t-2 border-on-surface/20 text-center"
              >
                Buka Study Space →
              </button>
            </div>
          ) : (
            /* Stopped state — compact Start Music button */
            <button
              onClick={() => { 
                music.setIsPlaying(true); 
                music.setIsMiniPlayerVisible(true);
                navigate('/study'); 
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-on-surface/20 hover:border-on-surface text-on-surface-variant hover:text-on-surface transition-all text-xs font-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] group"
            >
              <MusicIcon className="w-4 h-4" />
              <span>Study Music</span>
              <PlayIcon className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Footer Actions */}
      <div className="mt-4 pt-6 border-t-4 border-on-surface space-y-4">
        {isGuest ? (
          <div className="bg-primary-container p-4 rounded-xl border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
            <p className="text-xs font-bold text-on-primary-container">Ingin fitur lengkap? Daftar sekarang!</p>
            <button
              onClick={() => navigate('/signup')}
              className="w-full bg-primary text-white brutal-border py-2 text-sm font-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              Daftar Gratis
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-surface text-on-surface border-2 border-on-surface py-2 text-sm font-black rounded-lg hover:bg-surface-container-high transition-all"
            >
              Masuk
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => navigate('/pricing')}
              className="w-full bg-secondary text-on-secondary brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg py-3 px-4 font-label-bold flex items-center justify-center gap-2 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0 active:translate-y-0 active:shadow-none"
            >
              <Icon name="bolt" className="w-5 h-5 shrink-0" />
              Upgrade to Pro
            </button>
            <div className="space-y-1">
              <NavLink
                to="/help"
                className={({ isActive }) =>
                  `flex items-center gap-3 p-3 rounded-lg border-2 border-transparent transition-all ${
                    isActive
                      ? 'bg-primary-container !border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]'
                      : 'hover:bg-surface-container-high'
                  }`
                }
              >
                <Icon name="help" className="w-6 h-6 shrink-0" />
                <span className="font-label-bold">Help</span>
              </NavLink>
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-error/10 text-error transition-all"
              >
                <Icon name="logout" className="w-6 h-6 shrink-0" />
                <span className="font-label-bold">Logout</span>
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
