'use client'

/** Isometric-style illustrations for the features section (Raycast-inspired). Amber glow accents. */

export function SyncIllustration() {
  return (
    <div className="relative flex h-full min-h-[200px] items-center justify-center md:min-h-[260px]">
      <svg viewBox="0 0 200 160" className="h-full w-full max-w-[280px]" aria-hidden>
        <defs>
          <linearGradient id="sync-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d97706" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.6" />
          </linearGradient>
          <filter id="sync-blur">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feFlood floodColor="#d97706" floodOpacity="0.4" />
            <feComposite in2="blur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="blur" />
            </feMerge>
          </filter>
        </defs>
        {/* Two device-like rectangles (isometric feel) */}
        <rect x="30" y="70" width="50" height="36" rx="6" fill="#1e1b4b" stroke="rgba(217,119,6,0.4)" strokeWidth="1.5" />
        <rect x="120" y="70" width="50" height="36" rx="6" fill="#1e1b4b" stroke="rgba(217,119,6,0.4)" strokeWidth="1.5" />
        {/* Connection arc with glow */}
        <path d="M 80 88 Q 100 50 120 88" fill="none" stroke="url(#sync-glow)" strokeWidth="3" strokeLinecap="round" filter="url(#sync-blur)" opacity="0.9" />
        <path d="M 120 88 Q 100 126 80 88" fill="none" stroke="url(#sync-glow)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        {/* Glowing dots on "devices" */}
        <circle cx="55" cy="88" r="4" fill="#d97706" opacity="0.9" />
        <circle cx="145" cy="88" r="4" fill="#f59e0b" opacity="0.9" />
      </svg>
    </div>
  )
}

export function SecureIllustration() {
  return (
    <div className="relative flex h-full min-h-[200px] items-center justify-center md:min-h-[260px]">
      <svg viewBox="0 0 200 160" className="h-full w-full max-w-[280px]" aria-hidden>
        <defs>
          <linearGradient id="secure-glow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0.7" />
          </linearGradient>
          <filter id="secure-blur">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="#d97706" floodOpacity="0.3" />
            <feComposite in2="blur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="blur" />
            </feMerge>
          </filter>
        </defs>
        {/* Shield shape */}
        <path d="M 100 40 L 140 55 L 140 95 Q 100 120 60 95 L 60 55 Z" fill="#1e1b4b" stroke="rgba(217,119,6,0.5)" strokeWidth="1.5" />
        {/* Lock body */}
        <rect x="85" y="75" width="30" height="28" rx="4" fill="url(#secure-glow)" filter="url(#secure-blur)" />
        <path d="M 92 75 L 92 68 Q 92 60 100 60 Q 108 60 108 68 L 108 75" fill="none" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  )
}

export function SearchIllustration() {
  return (
    <div className="relative flex h-full min-h-[200px] items-center justify-center md:min-h-[260px]">
      <svg viewBox="0 0 200 160" className="h-full w-full max-w-[280px]" aria-hidden>
        <defs>
          <linearGradient id="search-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d97706" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.5" />
          </linearGradient>
          <filter id="search-blur">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feFlood floodColor="#f59e0b" floodOpacity="0.4" />
            <feComposite in2="blur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="blur" />
            </feMerge>
          </filter>
        </defs>
        {/* Magnifier circle */}
        <circle cx="85" cy="75" r="32" fill="none" stroke="rgba(217,119,6,0.6)" strokeWidth="3" />
        <circle cx="85" cy="75" r="20" fill="#1e1b4b" />
        {/* Handle */}
        <line x1="110" y1="100" x2="135" y2="125" stroke="rgba(217,119,6,0.6)" strokeWidth="4" strokeLinecap="round" />
        {/* Search beam / highlight */}
        <ellipse cx="140" cy="90" rx="35" ry="12" fill="url(#search-glow)" filter="url(#search-blur)" opacity="0.7" />
      </svg>
    </div>
  )
}

export function OrganizeIllustration() {
  return (
    <div className="relative flex h-full min-h-[200px] items-center justify-center md:min-h-[260px]">
      <svg viewBox="0 0 200 160" className="h-full w-full max-w-[280px]" aria-hidden>
        <defs>
          <linearGradient id="organize-glow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d97706" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        {/* Stacked folder-like shapes */}
        <path d="M 55 75 L 55 115 L 115 115 L 145 95 L 145 75 Z" fill="#1e1b4b" stroke="rgba(217,119,6,0.4)" strokeWidth="1.5" />
        <path d="M 65 85 L 65 120 L 120 120 L 148 102 L 148 85 Z" fill="#252240" stroke="rgba(245,158,11,0.35)" strokeWidth="1" />
        <path d="M 75 95 L 75 125 L 125 125 L 150 108 L 150 95 Z" fill="#2e2a4a" stroke="rgba(251,191,36,0.3)" strokeWidth="1" />
        {/* Tab glow */}
        <rect x="55" y="65" width="35" height="12" rx="2" fill="url(#organize-glow)" opacity="0.9" />
      </svg>
    </div>
  )
}

export function ShortcutsIllustration() {
  return (
    <div className="relative flex h-full min-h-[200px] items-center justify-center md:min-h-[260px]">
      <svg viewBox="0 0 200 160" className="h-full w-full max-w-[280px]" aria-hidden>
        <defs>
          <linearGradient id="key-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        {/* Keyboard key shapes */}
        <rect x="70" y="70" width="60" height="28" rx="6" fill="#1e1b4b" stroke="rgba(217,119,6,0.4)" strokeWidth="1.5" />
        <text x="100" y="90" textAnchor="middle" fill="#f59e0b" fontSize="14" fontFamily="system-ui, sans-serif" fontWeight="600">⌘V</text>
        <rect x="80" y="108" width="40" height="22" rx="4" fill="#252240" stroke="rgba(245,158,11,0.35)" strokeWidth="1" />
        <rect x="128" y="108" width="40" height="22" rx="4" fill="#252240" stroke="rgba(245,158,11,0.35)" strokeWidth="1" />
        {/* Glow behind main key */}
        <rect x="70" y="70" width="60" height="28" rx="6" fill="url(#key-glow)" opacity="0.2" />
      </svg>
    </div>
  )
}

export function BackupIllustration() {
  return (
    <div className="relative flex h-full min-h-[200px] items-center justify-center md:min-h-[260px]">
      <svg viewBox="0 0 200 160" className="h-full w-full max-w-[280px]" aria-hidden>
        <defs>
          <linearGradient id="cloud-glow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#d97706" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.4" />
          </linearGradient>
          <filter id="cloud-blur">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feFlood floodColor="#f59e0b" floodOpacity="0.3" />
            <feComposite in2="blur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="blur" />
            </feMerge>
          </filter>
        </defs>
        {/* Cloud shape */}
        <ellipse cx="100" cy="95" rx="45" ry="28" fill="#1e1b4b" stroke="rgba(217,119,6,0.4)" strokeWidth="1.5" />
        <ellipse cx="75" cy="92" rx="28" ry="22" fill="#252240" />
        <ellipse cx="125" cy="92" rx="28" ry="22" fill="#252240" />
        {/* Glow */}
        <ellipse cx="100" cy="95" rx="42" ry="24" fill="url(#cloud-glow)" filter="url(#cloud-blur)" opacity="0.6" />
        {/* Up arrow (upload) */}
        <path d="M 100 65 L 100 85 M 92 73 L 100 65 L 108 73" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
