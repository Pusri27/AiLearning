import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUserProfile } from './UserProfileContext';

const MOODS = [
  { title: 'Lo-fi Beats',    desc: 'Chill rhythmic loops to keep momentum going.',  iconName: 'music', accent: '#a78bfa', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400', youtubeId: 'jfKfPfyJRdk' },
  { title: 'Deep Focus',     desc: 'Synthwave & electronic textures for deep work.', iconName: 'brain', accent: '#60a5fa', img: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=400', youtubeId: 'S_MOd40zlYU' },
  { title: 'Classical',      desc: 'Timeless piano for reading & problem solving.', iconName: 'piano', accent: '#f59e0b', img: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&q=80&w=400', youtubeId: 'CH66Z6q2xW0' },
  { title: 'Nature Ambient', desc: 'Rain & ocean waves to block distractions.',     iconName: 'rain', accent: '#34d399', img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=400', youtubeId: 'eKFTSSKCzWA' },
  { title: 'Jazz Cafe',      desc: 'Smooth jazz for a cozy café atmosphere.',       iconName: 'coffee', accent: '#f97316', img: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?auto=format&fit=crop&q=80&w=400', youtubeId: 'HuFYqnbVbzY' },
  { title: 'White Noise',    desc: 'Pure steady noise to drown out distractions.',  iconName: 'fog', accent: '#94a3b8', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&q=80&w=400', youtubeId: 'nMfPqeZjc2c' },
];

const MusicPlayerContext = createContext(null);

export const MusicPlayerProvider = ({ children }) => {
  const [activeMood, setActiveMood] = useState(MOODS[0]);
  const [isPlaying,  setIsPlaying]  = useState(false);
  const [playbackMode, setPlaybackMode] = useState('youtube'); // 'youtube' | 'fallback'
  const [iframeKey,  setIframeKey]  = useState(0);
  const [isMiniPlayerVisible, setIsMiniPlayerVisible] = useState(false);
  const { profile } = useUserProfile();
  const [customPlaylists, setCustomPlaylists] = useState([]);

  useEffect(() => {
    const key = profile && profile.id && !profile.isGuest 
      ? `harin_custom_music_${profile.id}` 
      : 'harin_custom_music_guest';
    const saved = localStorage.getItem(key);
    setCustomPlaylists(saved ? JSON.parse(saved) : []);
  }, [profile?.id, profile?.isGuest]);

  const play = (mood) => {
    setPlaybackMode('youtube');
    if (mood && mood.youtubeId !== activeMood.youtubeId) {
      setActiveMood(mood);
      setIframeKey(k => k + 1);
    }
    setIsPlaying(true);
    setIsMiniPlayerVisible(true);
  };

  const playCustom = (url) => {
    let videoId = '';
    try {
      if (url.includes('v=')) {
        videoId = url.split('v=')[1].split('&')[0];
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
      } else if (url.includes('embed/')) {
        videoId = url.split('embed/')[1].split('?')[0];
      } else {
        videoId = url; // assume it's already an ID
      }

      if (videoId) {
        setPlaybackMode('youtube');
        // Initial mood object
        const newMood = {
          title: 'Loading Title...',
          desc: 'Your personalized study soundtrack.',
          iconName: 'music',
          accent: '#ec4899',
          img: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          youtubeId: videoId
        };

        setActiveMood(newMood);
        setIframeKey(k => k + 1);
        setIsPlaying(true);
        setIsMiniPlayerVisible(true);

        // Fetch actual title via oEmbed (public API, no key needed)
        fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
          .then(res => res.json())
          .then(data => {
            const finalMood = { ...newMood, title: data.title || 'Custom Stream' };
            setActiveMood(finalMood);

            // Update custom playlists (max 5, FIFO) with the real title
            setCustomPlaylists(prev => {
              const filtered = prev.filter(p => p.youtubeId !== videoId);
              const updated = [finalMood, ...filtered].slice(0, 5);
              const key = profile && profile.id && !profile.isGuest 
                ? `harin_custom_music_${profile.id}` 
                : 'harin_custom_music_guest';
              localStorage.setItem(key, JSON.stringify(updated));
              return updated;
            });
          })
          .catch(() => {
            // Fallback if oEmbed fails
            const fallbackMood = { ...newMood, title: 'Custom Stream' };
            setActiveMood(fallbackMood);
            setCustomPlaylists(prev => {
              const filtered = prev.filter(p => p.youtubeId !== videoId);
              const updated = [fallbackMood, ...filtered].slice(0, 5);
              const key = profile && profile.id && !profile.isGuest 
                ? `harin_custom_music_${profile.id}` 
                : 'harin_custom_music_guest';
              localStorage.setItem(key, JSON.stringify(updated));
              return updated;
            });
          });
      }
    } catch (e) {
      console.error('Invalid YouTube URL', e);
    }
  };

  const stop = () => setIsPlaying(false);
  const toggle = () => setIsPlaying(p => !p);

  return (
    <MusicPlayerContext.Provider value={{ 
      activeMood, isPlaying, iframeKey, moods: MOODS, 
      play, playCustom, stop, toggle, setIsPlaying,
      isMiniPlayerVisible, setIsMiniPlayerVisible,
      customPlaylists, playbackMode, setPlaybackMode
    }}>
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
