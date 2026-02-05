'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Download, Globe, Smartphone } from 'lucide-react'

const ANDROID_APK_URL =
  'https://github.com/hemanth5544/ClipSync/releases/download/v1.0.0/application-8644fd8a-e118-44bc-9437-475a307025a5.apk'
import { Button } from '@clipsync/ui'
import { HeroFloatingClips } from '@/components/animations/HeroFloatingClips'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

const sampleClip = 'Meeting at 3pm tomorrow'

export function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-24 pb-20"
      aria-label="Hero"
    >
      {/* Subtle background - no heavy gradients */}
      <div className="absolute inset-0 bg-[var(--background)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(217,119,6,0.06),transparent_50%)]" />
      <div className="dark:absolute dark:inset-0 dark:bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(245,158,11,0.04),transparent_50%)]" />

      <div className="container relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center gap-8"
        >
          <motion.h1
            variants={item}
            className="font-display text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl md:text-6xl"
          >
            Your clipboard,{' '}
            <span className="gradient-text">everywhere</span>
          </motion.h1>

          <motion.p
            variants={item}
            className="max-w-lg text-lg leading-relaxed text-[var(--text-secondary)]"
          >
            Never lose what you copy. Sync your clipboard across devices — secure, fast, and simple.
          </motion.p>

          <motion.div
            variants={item}
            className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4"
          >
            <Button
              asChild
              size="lg"
              className="h-12 min-w-[180px] bg-gradient-to-r from-[var(--primary-from)] to-[var(--primary-to)] px-8 text-base font-semibold text-white shadow-md transition-all hover:opacity-95"
            >
              <Link href="/#download" className="flex items-center justify-center gap-2">
                <Download className="h-5 w-5" aria-hidden />
                Get Started for Free
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 min-w-[140px] gap-2"
            >
              <a
                href="https://clipsync.up.railway.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                <Globe className="h-5 w-5" aria-hidden />
                Try Web
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 min-w-[140px] gap-2"
            >
              <a
                href={ANDROID_APK_URL}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
                aria-label="Download ClipSync Android APK"
              >
                <Smartphone className="h-5 w-5" aria-hidden />
                Download APK
              </a>
            </Button>
          </motion.div>

          <motion.p variants={item} className="text-sm text-[var(--text-secondary)]">
            Open-source • No credit card required
          </motion.p>
        </motion.div>

        {/* Floating clips - kept but will feel lighter with simpler hero above */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="relative mt-16 w-full max-w-4xl"
        >
          <HeroFloatingClips />
        </motion.div>
      </div>

      <motion.a
        href="#features"
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-[var(--text-secondary)] transition-colors hover:text-[var(--primary-from)]"
        aria-label="Scroll to features"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <span className="text-xs font-medium">Scroll</span>
        <motion.span
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="inline-block"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.span>
      </motion.a>
    </section>
  )
}
