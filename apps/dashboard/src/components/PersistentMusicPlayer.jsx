import React, { useEffect, useRef } from 'react';
import { useMusicPlayer } from '../context/MusicPlayerContext';

/**
 * PersistentMusicPlayer
 * Menggunakan YouTube IFrame API untuk kontrol play/pause tanpa reload/restart video.
 */
const PersistentMusicPlayer = () => {
  const { activeMood, isPlaying, setIsPlaying } = useMusicPlayer();
  const playerRef = useRef(null);
  const containerRef = useRef(null);

  // 1. Load YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // 2. Initialize or Update Player
  useEffect(() => {
    let timeoutId;
    
    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) {
        timeoutId = setTimeout(initPlayer, 200);
        return;
      }

      // If player already exists, just load new video
      if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
        try {
          playerRef.current.loadVideoById(activeMood.youtubeId);
          playerRef.current.unMute(); // Ensure it's not muted
          if (isPlaying) {
            playerRef.current.playVideo();
          } else {
            playerRef.current.pauseVideo();
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
            autoplay: isPlaying ? 1 : 0,
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
              if (isPlaying) event.target.playVideo();
            },
            onStateChange: (event) => {
              // Sync state if user interacts with player directly (though hidden)
              if (event.data === window.YT.PlayerState.PLAYING) setIsPlaying(true);
              if (event.data === window.YT.PlayerState.PAUSED) setIsPlaying(false);
              
              // If it ended, maybe loop? (Optional, but good for study music)
              if (event.data === window.YT.PlayerState.ENDED) {
                event.target.playVideo(); 
              }
            },
            onError: (event) => {
              console.error("YouTube Player Error:", event.data);
            }
          }
        });
      } catch (e) {
        console.error("Error creating YouTube player:", e);
      }
    };

    // Small delay so YT API fully registers origin before first postMessage
    const timer = setTimeout(initPlayer, 100);
    return () => {
      clearTimeout(timer);
      clearTimeout(timeoutId);
    };
  }, [activeMood.youtubeId]);

  // 3. Control Play/Pause without reload
  useEffect(() => {
    if (playerRef.current && playerRef.current.playVideo) {
      if (isPlaying) {
        playerRef.current.unMute();
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    }
  }, [isPlaying]);

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
    </div>
  );
};

export default PersistentMusicPlayer;
