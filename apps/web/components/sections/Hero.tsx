'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Download, Play, ChevronDown } from 'lucide-react'
import { Button } from '@clipsync/ui'
import { HeroFloatingClips } from '@/components/animations/HeroFloatingClips'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
}

const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
}

export function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-20 pb-24"
      aria-label="Hero"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 hero-gradient-mesh" />
      <div className="absolute inset-0 spotlight" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_-20%,rgba(124,58,237,0.1),transparent_50%)]" />
      <div className="absolute inset-0 noise-overlay" />

      <div className="container relative z-10 mx-auto flex max-w-5xl flex-col items-center text-center">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center gap-10"
        >
          <motion.p
            variants={item}
            className="rounded-full border border-[var(--border)] bg-white/70 px-5 py-2 text-sm font-medium text-[var(--text-secondary)] shadow-sm backdrop-blur-sm"
          >
            Loved by 50,000+ users worldwide
          </motion.p>

          <motion.h1
            variants={item}
            className="font-display text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl md:text-6xl lg:text-7xl lg:leading-[1.1]"
          >
            Your Clipboard,{' '}
            <span className="gradient-text">Everywhere</span>
          </motion.h1>

          <motion.p
            variants={item}
            className="max-w-2xl text-lg leading-relaxed text-[var(--text-secondary)] sm:text-xl"
          >
            Never lose what you copy. Sync your clipboard across Windows, macOS, and Linux
            instantly. Secure, fast, and beautifully simple.
          </motion.p>

          <motion.div
            variants={item}
            className="flex flex-col items-center gap-4 sm:flex-row sm:gap-4"
          >
            <Button
              asChild
              size="lg"
              className="h-12 w-full min-w-[200px] bg-gradient-to-r from-[var(--primary-from)] to-[var(--primary-to)] px-8 text-base font-semibold text-white shadow-lg shadow-violet-500/30 transition-all duration-300 hover:scale-[1.02] hover:opacity-95 hover:shadow-violet-500/40 sm:w-auto"
            >
              <Link href="/#download" className="flex items-center justify-center gap-2">
                <Download className="h-5 w-5" aria-hidden />
                Download for Free
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="h-12 w-full min-w-[160px] gap-2 rounded-xl border border-[var(--border)] bg-white/60 text-[var(--text-primary)] backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-violet-300 hover:bg-violet-500/10 sm:w-auto"
            >
              <Link href="/#demo" className="flex items-center justify-center gap-2">
                <Play className="h-5 w-5" aria-hidden />
                Watch Demo
              </Link>
            </Button>
          </motion.div>

          <motion.p
            variants={item}
            className="text-sm text-[var(--text-secondary)]"
          >
            Works on Windows, macOS, and Linux • No credit card required
          </motion.p>
        </motion.div>

        {/* Floating clipboard snippets - premium bento-style */}
        <motion.div
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          className="relative mt-20 w-full max-w-4xl"
        >
          <HeroFloatingClips />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.a
        href="#features"
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 rounded-full px-4 py-2 text-[var(--text-secondary)] transition-colors hover:bg-violet-500/10 hover:text-[var(--primary-from)]"
        aria-label="Scroll to features"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
      >
        <span className="text-xs font-medium">Scroll</span>
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="h-5 w-5" aria-hidden />
        </motion.span>
      </motion.a>
    </section>
  )
}
