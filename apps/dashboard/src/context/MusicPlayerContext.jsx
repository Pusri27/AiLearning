import React, { createContext, useContext, useState } from 'react';

const MOODS = [
  { title: 'Lo-fi Beats',    desc: 'Chill rhythmic loops to keep momentum going.',  emoji: '🎵', accent: '#a78bfa', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400', youtubeId: 'jfKfPfyJRdk' },
  { title: 'Deep Focus',     desc: 'Binaural beats & soft drones for deep work.',   emoji: '🧠', accent: '#60a5fa', img: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=400', youtubeId: '5qap5aO4i9A' },
  { title: 'Classical',      desc: 'Timeless piano for reading & problem solving.', emoji: '🎹', accent: '#f59e0b', img: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&q=80&w=400', youtubeId: 'mDX8QrcDI_g' },
  { title: 'Nature Ambient', desc: 'Rain & ocean waves to block distractions.',     emoji: '🌧️', accent: '#34d399', img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=400', youtubeId: 'eKFTSSKCzWA' },
  { title: 'Jazz Cafe',      desc: 'Smooth jazz for a cozy café atmosphere.',       emoji: '☕', accent: '#f97316', img: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?auto=format&fit=crop&q=80&w=400', youtubeId: 'HuFYqnbVbzY' },
  { title: 'White Noise',    desc: 'Pure steady noise to drown out distractions.',  emoji: '🌫️', accent: '#94a3b8', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&q=80&w=400', youtubeId: 'nMfPqeZjc2c' },
];

const MusicPlayerContext = createContext(null);

export const MusicPlayerProvider = ({ children }) => {
  const [activeMood, setActiveMood] = useState(MOODS[0]);
  const [isPlaying,  setIsPlaying]  = useState(false);
  const [iframeKey,  setIframeKey]  = useState(0);

  const play = (mood) => {
    if (mood && mood.youtubeId !== activeMood.youtubeId) {
      setActiveMood(mood);
      setIframeKey(k => k + 1);
    }
    setIsPlaying(true);
  };

  const stop = () => setIsPlaying(false);
  const toggle = () => setIsPlaying(p => !p);

  return (
    <MusicPlayerContext.Provider value={{ activeMood, isPlaying, iframeKey, moods: MOODS, play, stop, toggle, setIsPlaying }}>
      {children}
    </MusicPlayerContext.Provider>
  );
};

export const useMusicPlayer = () => {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) throw new Error('useMusicPlayer must be used inside MusicPlayerProvider');
  return ctx;
};

export { MOODS };
