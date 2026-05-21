import React from 'react';

const IconBase = ({ children, className = "w-5 h-5", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {children}
  </svg>
);

export const CloudIcon = (props) => (
  <IconBase {...props}>
    <path d="M17.5 19c.706 0 1.399-.143 2.035-.421A5.002 5.002 0 0 0 18 9h-1.264A8.188 8.188 0 0 0 9 3 9 9 0 0 0 2 12c0 3.866 3.134 7 7 7" />
    <path d="M17.5 19a3.5 3.5 0 1 1 0-7c.108 0 .214.005.32.014a5.002 5.002 0 0 1 9.36 2.565 5.002 5.002 0 0 1-5.68 4.421H17.5z" />
  </IconBase>
);

export const WarningIcon = (props) => (
  <IconBase {...props}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </IconBase>
);

export const MusicIcon = (props) => (
  <IconBase {...props}>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </IconBase>
);

export const BrainIcon = (props) => (
  <IconBase {...props}>
    <path d="M9.5 2A5.43 5.43 0 0 0 4 7c0 4 3 6 3 9s-1.5 2-1.5 2c0 2 1.5 2 1.5 2h9c0 0 1.5 0 1.5-2c0 0-1.5 0-1.5-2s3-5 3-9a5.43 5.43 0 0 0-5.5-5M9 14s1.5-2 1.5-5M15 14s-1.5-2-1.5-5" />
  </IconBase>
);

export const PianoIcon = (props) => (
  <IconBase {...props}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="6" y1="5" x2="6" y2="19" />
    <line x1="10" y1="5" x2="10" y2="19" />
    <line x1="14" y1="5" x2="14" y2="19" />
    <line x1="18" y1="5" x2="18" y2="19" />
    <line x1="2" y1="13" x2="22" y2="13" />
  </IconBase>
);

export const RainIcon = (props) => (
  <IconBase {...props}>
    <path d="M17.5 19c.706 0 1.399-.143 2.035-.421A5.002 5.002 0 0 0 18 9h-1.264A8.188 8.188 0 0 0 9 3 9 9 0 0 0 2 12c0 3.866 3.134 7 7 7" />
    <line x1="8" y1="19" x2="8" y2="21" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="16" y1="19" x2="16" y2="21" />
  </IconBase>
);

export const CoffeeIcon = (props) => (
  <IconBase {...props}>
    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
    <line x1="6" y1="1" x2="6" y2="4" />
    <line x1="10" y1="1" x2="10" y2="4" />
    <line x1="14" y1="1" x2="14" y2="4" />
  </IconBase>
);

export const FogIcon = (props) => (
  <IconBase {...props}>
    <line x1="4" y1="8" x2="20" y2="8" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="16" x2="20" y2="16" />
    <line x1="8" y1="20" x2="16" y2="20" />
    <line x1="10" y1="4" x2="14" y2="4" />
  </IconBase>
);

export const TadaIcon = (props) => (
  <IconBase {...props}>
    <path d="M2 22 22 2" />
    <path d="M8 8 9.5 9.5" />
    <path d="M11 11 12.5 12.5" />
    <path d="M14 14 15.5 15.5" />
    <path d="M18 18 19.5 19.5" />
    <circle cx="5" cy="5" r="1" />
    <circle cx="19" cy="19" r="1" />
  </IconBase>
);

export const HourglassIcon = (props) => (
  <IconBase {...props}>
    <path d="M5 22h14" />
    <path d="M5 2h14" />
    <path d="M17 22c0-4.105-2.553-7.5-6-8.5V2h2" />
    <path d="M7 22c0-4.105 2.553-7.5 6-8.5V2h-2" />
    <path d="M17 2c0 4.105-2.553 7.5-6 8.5V22h2" />
    <path d="M7 2c0 4.105 2.553 7.5 6 8.5V22h-2" />
  </IconBase>
);

export const LockIcon = (props) => (
  <IconBase {...props}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </IconBase>
);

export const WaveIcon = (props) => (
  <IconBase {...props}>
    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5" />
    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v6" />
    <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4.5" />
    <path d="M18 8a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-1c0 0-1 4-4 4s-4-4-4-4h-1a2 2 0 0 1-2-2v0a2 2 0 0 1 2-2" />
  </IconBase>
);

export const HaiIcon = (props) => (
  <IconBase {...props}>
    {/* Waving hand */}
    <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v5" />
    <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v6" />
    <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v4.5" />
    <path d="M18 8a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-1c0 0-1 4-4 4s-4-4-4-4h-1a2 2 0 0 1-2-2v0a2 2 0 0 1 2-2" />
    {/* Dynamic Greeting/Waving Lines */}
    <path d="M22 2a4 4 0 0 1 0 6" />
    <path d="M24 0a6 6 0 0 1 0 10" />
  </IconBase>
);

export const BulbIcon = (props) => (
  <IconBase {...props}>
    <path d="M15 21H9" />
    <path d="M15 17a3 3 0 1 1-6 0" />
    <path d="M12 2a7 7 0 0 0-7 7c0 2.316 1.132 4.368 2.872 5.64L8 17h8l.128-2.36C17.868 13.368 19 11.316 19 9a7 7 0 0 0-7-7z" />
  </IconBase>
);

export const TrophyIcon = (props) => (
  <IconBase {...props}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55.47.98.97 1.21C11.47 18.44 12 19 12 19s.53-.56 1.03-.79c.5-.23.97-.66.97-1.21v-2.34" />
    <path d="M12 9V5" />
    <path d="M12 17a5 5 0 0 1-5-5V5h10v7a5 5 0 0 1-5 5z" />
  </IconBase>
);

export const SmileIcon = (props) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </IconBase>
);

export const CheckIcon = (props) => (
  <IconBase {...props}>
    <polyline points="20 6 9 17 4 12" />
  </IconBase>
);

export const SparklesIcon = (props) => (
  <IconBase {...props}>
    <path d="M12 3v1" />
    <path d="M12 20v1" />
    <path d="M21 12h-1" />
    <path d="M4 12H3" />
    <path d="M18.364 5.636l-.707.707" />
    <path d="M6.343 17.657l-.707.707" />
    <path d="M5.636 5.636l.707.707" />
    <path d="M17.657 17.657l.707.707" />
  </IconBase>
);

export const CrossIcon = (props) => (
  <IconBase {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </IconBase>
);

export const PlayIcon = (props) => (
  <IconBase {...props} fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </IconBase>
);

export const PauseIcon = (props) => (
  <IconBase {...props} fill="currentColor">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </IconBase>
);

export const UserIcon = (props) => (
  <IconBase {...props}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </IconBase>
);
