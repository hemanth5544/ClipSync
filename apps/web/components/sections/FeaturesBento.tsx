'use client'

import { motion } from 'framer-motion'
import {
  Zap,
  Lock,
  Search,
  FolderOpen,
  Keyboard,
  Cloud,
} from 'lucide-react'

const features = [
  {
    id: 'sync',
    title: 'Instant Sync Across Devices',
    description: 'Copy on one device, paste on another. Your clipboard follows you everywhere in real time. No setup, no delay.',
    icon: Zap,
    size: 'large' as const,
    gradient: 'from-violet-500/15 to-purple-500/15',
    iconGradient: 'from-violet-500 to-purple-600',
  },
  {
    id: 'secure',
    title: 'Secure & Private',
    description: 'End-to-end encryption. Your clips are never stored in plain text.',
    icon: Lock,
    size: 'small' as const,
    gradient: 'from-violet-500/10 to-indigo-500/10',
    iconGradient: 'from-violet-500 to-indigo-600',
  },
  {
    id: 'search',
    title: 'Lightning Fast Search',
    description: 'Find any clip in milliseconds. Filter by type, date, or full-text.',
    icon: Search,
    size: 'small' as const,
    gradient: 'from-purple-500/10 to-violet-500/10',
    iconGradient: 'from-purple-500 to-violet-600',
  },
  {
    id: 'organize',
    title: 'Smart Organization',
    description: 'Tags, favorites, and folders. Keep your clipboard tidy and easy to navigate.',
    icon: FolderOpen,
    size: 'small' as const,
    gradient: 'from-fuchsia-500/10 to-pink-500/10',
    iconGradient: 'from-fuchsia-500 to-pink-600',
  },
  {
    id: 'shortcuts',
    title: 'Global Shortcuts',
    description: 'Access your clipboard from anywhere with customizable keyboard shortcuts.',
    icon: Keyboard,
    size: 'small' as const,
    gradient: 'from-amber-500/10 to-orange-500/10',
    iconGradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'backup',
    title: 'Cloud Backup',
    description: 'Never lose a clip. Automatic backup with version history.',
    icon: Cloud,
    size: 'small' as const,
    gradient: 'from-emerald-500/10 to-teal-500/10',
    iconGradient: 'from-emerald-500 to-teal-600',
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

        {/* Asymmetric bento grid: 4 cols, 3 rows. Sync = 2x3, rest = 1x1 */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-40px' }}
          className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 md:grid-rows-3 md:gap-5"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon
            const isLarge = feature.size === 'large'
            return (
              <motion.div
                key={feature.id}
                variants={item}
                className={`group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-500/15 dark:bg-zinc-800/90 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:shadow-zinc-500/10 ${
                  isLarge
                    ? 'md:col-span-2 md:row-span-3 md:flex md:flex-col md:justify-center md:p-8'
                    : ''
                }`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-zinc-600/20 dark:to-zinc-500/10`}
                />
                <div className="relative flex h-full flex-col">
                  <motion.div
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.iconGradient} text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}
                    whileHover={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.4 }}
                  >
                    <Icon className="h-6 w-6" aria-hidden />
                  </motion.div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-[var(--text-primary)] md:mt-5">
                    {feature.title}
                  </h3>
                  <p
                    className={`mt-2 text-sm leading-relaxed text-[var(--text-secondary)] ${
                      isLarge ? 'mt-3 max-w-md text-base' : ''
                    }`}
                  >
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
