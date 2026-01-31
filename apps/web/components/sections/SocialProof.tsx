'use client'

import { motion } from 'framer-motion'

const stats = [
  { value: '50,000+', label: 'Active users' },
  { value: '10M+', label: 'Clips synced daily' },
  { value: '99.9%', label: 'Uptime' },
]

const testimonials = [
  'ClipSync changed how I work across my laptop and desktop.',
  'Finally, clipboard sync that just works.',
  'The search is incredibly fast. I find anything in seconds.',
  'Best productivity tool I\'ve added in years.',
]

export function SocialProof() {
  return (
    <section
      className="relative border-y border-[var(--border)] bg-[var(--surface)]/60 py-16"
      aria-label="Social proof"
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-12"
        >
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {stats.map((stat, i) => (
              <div key={stat.label} className="text-center">
                <p className="font-display text-3xl font-bold text-[var(--text-primary)] md:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="glass relative w-full max-w-4xl overflow-hidden rounded-2xl border border-[var(--border)] p-2">
            <motion.div
              className="flex gap-8"
              animate={{
                x: [0, -1200],
              }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: 'loop',
                  duration: 25,
                  ease: 'linear',
                },
              }}
            >
              {[...testimonials, ...testimonials].map((quote, i) => (
                <div
                  key={i}
                  className="flex shrink-0 items-center gap-4 rounded-xl bg-[var(--surface)]/80 px-6 py-4"
                >
                  <p className="whitespace-nowrap text-sm text-[var(--text-secondary)] italic">
                    &ldquo;{quote}&rdquo;
                  </p>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
