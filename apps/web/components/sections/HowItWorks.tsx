'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Download, Copy, Smartphone } from 'lucide-react'

const steps = [
  {
    number: '01',
    title: 'Download & Install',
    description: 'One-click install for Windows, macOS, or Linux. Get started in under a minute.',
    icon: Download,
  },
  {
    number: '02',
    title: 'Copy Anything',
    description: 'ClipSync runs in the background. Copy text, links, or code—it captures everything automatically.',
    icon: Copy,
  },
  {
    number: '03',
    title: 'Access Everywhere',
    description: 'Sign in once and your clipboard syncs across all your devices. Paste from any device, anytime.',
    icon: Smartphone,
  },
]

export function HowItWorks() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      ref={ref}
      className="relative py-24 md:py-32"
      aria-labelledby="how-it-works-heading"
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2
            id="how-it-works-heading"
            className="font-display text-3xl font-bold text-[var(--text-primary)] md:text-4xl"
          >
            How it works
          </h2>
          <p className="mt-4 text-lg text-[var(--text-secondary)]">
            Three steps to a synced clipboard. No complexity, no setup hassle.
          </p>
        </motion.div>

        <div className="mx-auto mt-20 max-w-4xl">
          <div className="grid gap-12 md:grid-cols-3 md:gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: index * 0.15, duration: 0.5 }}
                  className="relative flex flex-col items-center text-center md:items-start md:text-left"
                >
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                    <Icon className="h-10 w-10 text-[var(--primary-from)]" aria-hidden />
                  </div>
                  <span className="mt-4 font-mono text-sm font-medium text-[var(--primary-from)]">
                    {step.number}
                  </span>
                  <h3 className="mt-2 font-display text-xl font-semibold text-[var(--text-primary)]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    {step.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
