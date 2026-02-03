'use client'

import { motion } from 'framer-motion'
import {
  Zap,
  Lock,
  Search,
  Star,
  Keyboard,
  Cloud,
  Smartphone,
  MessageSquare,
  Shield,
} from 'lucide-react'

const features = [
  {
    id: 'sync',
    title: 'Instant Sync',
    description: 'Copy on one device, paste on another. Real-time sync across all your devices.',
    icon: Zap,
    gradient: 'from-amber-500/15 to-orange-500/15',
    iconGradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'secure',
    title: 'Secure Notes',
    description: 'End-to-end encrypted vault for sensitive clips. Never stored in plain text.',
    icon: Shield,
    gradient: 'from-amber-500/10 to-orange-500/10',
    iconGradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'search',
    title: 'Search & Filter',
    description: 'Find any clip in milliseconds. Filter by type, date, or full-text.',
    icon: Search,
    gradient: 'from-orange-500/10 to-amber-500/10',
    iconGradient: 'from-orange-500 to-amber-600',
  },
  {
    id: 'favorites',
    title: 'Favorites',
    description: 'Star your go-to clips for quick access from the favorites view.',
    icon: Star,
    gradient: 'from-fuchsia-500/10 to-pink-500/10',
    iconGradient: 'from-fuchsia-500 to-pink-600',
  },
  {
    id: 'shortcuts',
    title: 'Global Shortcuts',
    description: 'Open clipboard anywhere with Ctrl+Shift+V or customizable shortcuts.',
    icon: Keyboard,
    gradient: 'from-amber-500/10 to-orange-500/10',
    iconGradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'backup',
    title: 'Version History',
    description: 'Automatic backup with version history. Never lose a clip.',
    icon: Cloud,
    gradient: 'from-emerald-500/10 to-teal-500/10',
    iconGradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'pairing',
    title: 'Device Pairing',
    description: 'Pair desktop with your phone via QR code. One account, all devices.',
    icon: Smartphone,
    gradient: 'from-violet-500/10 to-purple-500/10',
    iconGradient: 'from-violet-500 to-purple-600',
  },
  {
    id: 'messages',
    title: 'Synced Messages',
    description: 'Send clips between devices. See sync status and message history.',
    icon: MessageSquare,
    gradient: 'from-cyan-500/10 to-blue-500/10',
    iconGradient: 'from-cyan-500 to-blue-600',
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
}

export function FeaturesBento() {
  return (
    <section
      id="features"
      className="relative py-24 md:py-32"
      aria-labelledby="features-heading"
    >
      {/* Subtle section background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(124,58,237,0.04),transparent_70%)]" />
      <div className="container relative mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2
            id="features-heading"
            className="font-display text-3xl font-bold text-[var(--text-primary)] md:text-4xl lg:text-5xl"
          >
            Everything you need to{' '}
            <span className="gradient-text">stay in flow</span>
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-[var(--text-secondary)]">
            Powerful features that work the way you do. No bloat, no friction.
          </p>
        </motion.div>

        {/* Compact bento grid — equal cards, clean UI */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-40px' }}
          className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.id}
                variants={item}
                className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]/80 p-4 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-amber-300/50 hover:shadow-md dark:bg-zinc-800/80 dark:border-zinc-700 dark:hover:border-zinc-600"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:from-zinc-600/15 dark:to-zinc-500/10`}
                />
                <div className="relative flex flex-col gap-3">
                  <div
                    className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${feature.iconGradient} text-white shadow-sm transition-transform duration-200 group-hover:scale-105`}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </div>
                  <h3 className="font-display text-sm font-semibold leading-tight text-[var(--text-primary)]">
                    {feature.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
