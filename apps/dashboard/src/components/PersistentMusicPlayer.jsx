import React from 'react';
import { useMusicPlayer } from '../context/MusicPlayerContext';

/**
 * PersistentMusicPlayer
 * Hanya bertugas menjaga YouTube iframe tetap mounted di DOM sepanjang waktu.
 * Semua UI (mini player, controls) ada di Sidebar.jsx.
 */
const PersistentMusicPlayer = () => {
  const { activeMood, isPlaying, iframeKey } = useMusicPlayer();

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: '-9999px',
        left: '-9999px',
        width: 1,
        height: 1,
        opacity: 0,
        pointerEvents: 'none',
      }}
    >
      <iframe
        key={iframeKey}
        src={
          isPlaying
            ? `https://www.youtube.com/embed/${activeMood.youtubeId}?autoplay=1&rel=0&modestbranding=1`
            : `https://www.youtube.com/embed/${activeMood.youtubeId}?autoplay=0`
        }
        title="Study Music"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        width="1"
        height="1"
      />
    </div>
  );
};

export default PersistentMusicPlayer;
