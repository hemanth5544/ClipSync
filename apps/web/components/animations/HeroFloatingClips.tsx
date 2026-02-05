'use client'

import { motion } from 'framer-motion'

const clips = [
  { text: 'const api = "https://api.clipsync.dev"', delay: 0, x: -12, size: 'wide' as const },
  { text: 'Meeting at 3pm tomorrow', delay: 0.15, x: 8, size: 'normal' as const },
  { text: ' Copy once, paste anywhere', delay: 0.3, x: -8, size: 'normal' as const },
  { text: 'git clone https://github.com/...', delay: 0.45, x: 12, size: 'wide' as const },
]

export function HeroFloatingClips() {
  return (
    <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
      {clips.map((clip, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 1.1 + clip.delay,
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1],
          }}
          whileHover={{ scale: 1.02, y: -4 }}
          className={`group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white/90 px-5 py-4 shadow-lg backdrop-blur-md transition-all duration-300 hover:border-amber-300 hover:shadow-xl hover:shadow-amber-500/20 dark:bg-zinc-800/95 dark:border-zinc-700 dark:hover:border-zinc-500 dark:hover:shadow-zinc-500/10 ${
            clip.size === 'wide' ? 'sm:col-span-2' : ''
          }`}
          style={{
            boxShadow: '0 20px 40px -15px rgba(217, 119, 6, 0.12), 0 0 0 1px rgba(217, 119, 6, 0.05)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-zinc-500/10" />
          <motion.p
            className="relative font-mono text-sm text-[var(--text-primary)] sm:text-base"
            animate={{ x: [0, clip.x, 0] }}
            transition={{
              duration: 5 + i * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {clip.text}
          </motion.p>
        </motion.div>
      ))}
    </div>
  )
}
