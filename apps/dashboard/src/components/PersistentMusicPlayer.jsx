import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { showToast } from '../lib/toast';

const FALLBACK_AUDIO_URLS = {
  // Lo-fi Beats
  'jfKfPfyJRdk': 'https://archive.org/download/no-copyright-10-minutes-lofi-chill-instrumental-beat-mellow/%5BNo%20Copyright%5D%2010%20Minutes%20%E2%99%AB%20LOFI%20Chill%20Instrumental%20Beat%20-%20%EF%BC%82Mellow%EF%BC%82.mp3',
  // Deep Focus
  'S_MOd40zlYU': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  // Classical
  'CH66Z6q2xW0': 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Beethoven_Moonlight_1st_movement.ogg',
  // Nature Ambient
  'eKFTSSKCzWA': 'https://upload.wikimedia.org/wikipedia/commons/5/55/Garden_rainfall.ogg',
  // Jazz Cafe
  'HuFYqnbVbzY': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
  // White Noise
  'nMfPqeZjc2c': 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Gaussian_white_noise.ogg',
};

/**
 * PersistentMusicPlayer
 * Menggunakan YouTube IFrame API sebagai pemutar utama, dan secara otomatis
 * jatuh kembali (fallback) ke pemutar HTML5 Audio lokal jika diblokir oleh AdBlocker.
 */
const PersistentMusicPlayer = () => {
  const location = useLocation();
  const { activeMood, isPlaying, setIsPlaying, playbackMode, setPlaybackMode } = useMusicPlayer();
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const audioRef = useRef(null);
  const isPlayingRef = useRef(isPlaying);

  const isTeacherRoute = location.pathname.startsWith('/teacher');

  useEffect(() => {
    if (isTeacherRoute && isPlaying) {
      setIsPlaying(false);
    }
  }, [isTeacherRoute, isPlaying, setIsPlaying]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // 1. Load YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      tag.onerror = () => {
        console.error("Failed to load YouTube API script. Likely blocked by an adblocker or network issue.");
        window.youtubeApiBlocked = true;
        setPlaybackMode('fallback');
      };
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    } else if (window.youtubeApiBlocked) {
      setPlaybackMode('fallback');
    }
  }, [setPlaybackMode]);

  // 2. Initialize or Update YouTube Player (only if in youtube mode)
  useEffect(() => {
    if (playbackMode === 'fallback') return;

    let timeoutId;
    let retries = 0;
    const maxRetries = 25; // 25 * 200ms = 5 seconds max wait time
    
    const initPlayer = () => {
      if (window.youtubeApiBlocked) {
        console.warn("YouTube API is blocked. Switching to fallback audio.");
        setPlaybackMode('fallback');
        return;
      }

      if (!window.YT || !window.YT.Player) {
        retries++;
        if (retries >= maxRetries) {
          console.error("YouTube IFrame API failed to load after 5 seconds. Switching to fallback audio.");
          setPlaybackMode('fallback');
          return;
        }
        timeoutId = setTimeout(initPlayer, 200);
        return;
      }

      // If player already exists, just load new video
      if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
        try {
          if (isPlayingRef.current) {
            playerRef.current.loadVideoById(activeMood.youtubeId);
            playerRef.current.unMute(); // Ensure it's not muted
            playerRef.current.playVideo();
          } else if (typeof playerRef.current.cueVideoById === 'function') {
            playerRef.current.cueVideoById(activeMood.youtubeId);
          }
        } catch (e) {
          console.error("Error updating video:", e);
        }
        return;
      }

      // Create new player
      try {
        playerRef.current = new window.YT.Player('youtube-player', {
          height: '200',
          width: '200',
          videoId: activeMood.youtubeId,
          playerVars: {
            autoplay: isPlayingRef.current ? 1 : 0,
            controls: 0,
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
            origin: window.location.origin,
            widget_referrer: window.location.origin,
          },
          events: {
            onReady: (event) => {
              event.target.unMute();
              if (isPlayingRef.current) {
                event.target.playVideo();
              }
            },
            onStateChange: (event) => {
              if (event.data === window.YT.PlayerState.PLAYING) setIsPlaying(true);
              if (event.data === window.YT.PlayerState.PAUSED) setIsPlaying(false);
              
              // If it ended, loop
              if (event.data === window.YT.PlayerState.ENDED) {
                event.target.playVideo(); 
              }
            },
            onError: (event) => {
              console.error("YouTube Player Error:", event.data);
              setPlaybackMode('fallback');
            }
          }
        });
      } catch (e) {
        console.error("Error creating YouTube player:", e);
        setPlaybackMode('fallback');
      }
    };

    const timer = setTimeout(initPlayer, 100);
    return () => {
      clearTimeout(timer);
      clearTimeout(timeoutId);
    };
  }, [activeMood.youtubeId, playbackMode]);

  // 3. Control Play/Pause across platforms
  useEffect(() => {
    if (playbackMode === 'fallback') {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.play().catch(e => console.error("HTML5 Audio play error:", e));
        } else {
          audioRef.current.pause();
        }
      }
      // Ensure YouTube is paused
      if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        try { playerRef.current.pauseVideo(); } catch (e) {}
      }
    } else {
      // YouTube mode
      if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
        if (isPlaying) {
          playerRef.current.unMute();
          playerRef.current.playVideo();
        } else {
          playerRef.current.pauseVideo();
        }
      }
      // Ensure HTML5 Audio is paused
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, playbackMode]);

  // 4. Handle mood changes in fallback/audio mode
  useEffect(() => {
    if (playbackMode === 'fallback') {
      const url = FALLBACK_AUDIO_URLS[activeMood.youtubeId] || FALLBACK_AUDIO_URLS['jfKfPfyJRdk'];
      if (audioRef.current) {
        if (audioRef.current.src !== url) {
          audioRef.current.src = url;
          audioRef.current.load();
        }
        if (isPlaying) {
          audioRef.current.play().catch(e => console.error("HTML5 Audio play error:", e));
        } else {
          audioRef.current.pause();
        }
      }
      // Ensure YouTube is paused
      if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        try { playerRef.current.pauseVideo(); } catch (e) {}
      }
    }
  }, [activeMood.youtubeId, playbackMode, isPlaying]);

  if (isTeacherRoute) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        bottom: '0',
        right: '0',
        width: '200px',
        height: '200px',
        opacity: 0.001,
        pointerEvents: 'none',
        zIndex: -1,
        overflow: 'hidden'
      }}
    >
      <div id="youtube-player" ref={containerRef}></div>
      <audio
        ref={audioRef}
        loop
        preload="auto"
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default PersistentMusicPlayer;
