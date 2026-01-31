'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@clipsync/ui'

export function FinalCTA() {
  return (
    <section
      id="download"
      className="relative py-24 md:py-32"
      aria-labelledby="cta-heading"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary-from)]/15 via-[var(--primary-to)]/10 to-violet-200/20" />
      <div className="absolute inset-0 noise-overlay" />
      <div className="container relative mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl"
        >
          <h2
            id="cta-heading"
            className="font-display text-3xl font-bold text-[var(--text-primary)] md:text-4xl lg:text-5xl"
          >
            Start organizing your clipboard today
          </h2>
          <p className="mt-6 text-lg text-[var(--text-secondary)]">
            Join thousands of users who never lose their clips. Get started in
            under a minute.
          </p>
          <div className="mt-10">
            <Button
              asChild
              size="lg"
              className="h-14 bg-gradient-to-r from-[var(--primary-from)] to-[var(--primary-to)] px-10 text-lg font-semibold text-white shadow-lg shadow-violet-500/35 transition-all hover:opacity-90 hover:shadow-violet-500/45"
            >
              <Link href="/#download">Download for Free</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-[var(--text-secondary)]">
            No credit card required • Free forever for personal use
          </p>
        </motion.div>
      </div>
    </section>
  )
}
