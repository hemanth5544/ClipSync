'use client'

import { motion } from 'framer-motion'

const testimonials = [
  'ClipSync changed how I work across my laptop and desktop.',
  'Finally, clipboard sync that just works.',
  'The search is incredibly fast. I find anything in seconds.',
  'Best productivity tool I\'ve added in years.',
]

export function SocialProof() {
  return (
    <section
      className="relative border-y border-[var(--border)] bg-[var(--surface)]/60 py-12 md:py-14"
      aria-label="Social proof"
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-10"
        >
    

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
