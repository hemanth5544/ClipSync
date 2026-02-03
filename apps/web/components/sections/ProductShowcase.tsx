'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { History, Search, RefreshCw, Zap } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@clipsync/ui'

const sampleClips = [
  'const x = 42',
  'Meeting notes...',
  'https://clipsync.dev',
]

const tabs = [
  {
    id: 'history',
    label: 'Clipboard History',
    icon: History,
    content: (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]/80 p-4 shadow-sm backdrop-blur">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
          Recent clips
        </p>
        <ul className="space-y-2">
          {sampleClips.map((text, i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--background)]/60 px-3 py-2.5 transition-colors hover:bg-[var(--surface)]/80"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[var(--primary)]/10 text-xs font-medium text-[var(--primary)]">
                {i + 1}
              </span>
              <span className="truncate font-mono text-sm text-[var(--text-primary)]">
                {text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: 'search',
    label: 'Search & Filter',
    icon: Search,
    content: (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]/80 p-4 shadow-sm backdrop-blur">
        <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)]/60 px-3 py-2.5 text-[var(--text-secondary)]">
          <Search className="h-4 w-4 shrink-0" aria-hidden />
          <span className="text-sm">Search clips...</span>
        </div>
        <p className="mt-3 text-xs text-[var(--text-secondary)]">
          Instant results as you type
        </p>
      </div>
    ),
  },
  {
    id: 'sync',
    label: 'Sync Dashboard',
    icon: RefreshCw,
    content: (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]/80 p-4 shadow-sm backdrop-blur">
        <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-emerald-500/10 px-3 py-2.5 text-emerald-600 dark:text-emerald-400">
          <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
          <span className="text-sm font-medium">Synced • 3 devices</span>
        </div>
        <p className="mt-3 text-xs text-[var(--text-secondary)]">
          All devices up to date
        </p>
      </div>
    ),
  },
  {
    id: 'shortcuts',
    label: 'Quick Access',
    icon: Zap,
    content: (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]/80 p-4 shadow-sm backdrop-blur">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--background)]/60 px-4 py-3 font-mono text-sm text-[var(--text-primary)]">
          ⌘ + Shift + V
        </div>
        <p className="mt-3 text-xs text-[var(--text-secondary)]">
          Open clipboard from anywhere
        </p>
      </div>
    ),
  },
]

export function ProductShowcase() {
  const [active, setActive] = useState('history')

  return (
    <section
      className="relative py-20 md:py-28"
      aria-labelledby="showcase-heading"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(217,119,6,0.06),transparent_60%)]" />
      <div className="container relative mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2
            id="showcase-heading"
            className="font-display text-2xl font-bold text-[var(--text-primary)] md:text-3xl"
          >
            Built for how you work
          </h2>
          <p className="mt-3 text-base text-[var(--text-secondary)]">
            Switch between views and see your clipboard in action.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="mx-auto mt-12 max-w-2xl"
        >
          <Tabs value={active} onValueChange={setActive} className="w-full">
            <TabsList className="mb-4 flex w-full flex-wrap justify-center gap-1.5 rounded-lg bg-[var(--surface)]/80 p-1.5 border border-[var(--border)]">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm data-[state=active]:bg-[var(--background)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:shadow-sm"
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {tab.label}
                  </TabsTrigger>
                )
              })}
            </TabsList>
            <div className="min-h-[180px]">
              <AnimatePresence mode="wait">
                {tabs
                  .filter((tab) => tab.id === active)
                  .map((tab) => (
                    <motion.div
                      key={tab.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                    >
                      {tab.content}
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>
          </Tabs>
        </motion.div>
      </div>
    </section>
  )
}
