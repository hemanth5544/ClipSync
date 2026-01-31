'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { History, Search, RefreshCw, Zap } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@clipsync/ui'

const tabs = [
  {
    id: 'history',
    label: 'Clipboard History',
    icon: History,
    content: (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 font-mono text-sm">
        <div className="space-y-2">
          {['const x = 42', 'Meeting notes...', 'https://clipsync.dev'].map(
            (line, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg bg-[var(--background)]/50 px-3 py-2"
              >
                <span className="text-[var(--text-secondary)]">{i + 1}.</span>
                <span className="text-[var(--text-primary)]">{line}</span>
              </div>
            )
          )}
        </div>
      </div>
    ),
  },
  {
    id: 'search',
    label: 'Search & Filter',
    icon: Search,
    content: (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-[var(--text-secondary)]">
          Search clips...
        </div>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
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
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex items-center gap-2 text-[var(--primary-from)]">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">Synced • 3 devices</span>
        </div>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
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
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 font-mono text-sm">
          ⌘ + Shift + V
        </div>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Open clipboard anywhere
        </p>
      </div>
    ),
  },
]

export function ProductShowcase() {
  const [active, setActive] = useState('history')

  return (
    <section
      className="relative py-24 md:py-32"
      aria-labelledby="showcase-heading"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(124,58,237,0.08),transparent)]" />
      <div className="container relative mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2
            id="showcase-heading"
            className="font-display text-3xl font-bold text-[var(--text-primary)] md:text-4xl"
          >
            Built for how you work
          </h2>
          <p className="mt-4 text-lg text-[var(--text-secondary)]">
            Switch between views and see your clipboard in action.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-16 max-w-3xl"
        >
          <Tabs value={active} onValueChange={setActive} className="w-full">
            <TabsList className="mb-6 flex w-full flex-wrap justify-center gap-2 rounded-xl bg-[var(--surface)] p-2 border border-[var(--border)]">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center gap-2 data-[state=active]:bg-[var(--background)] data-[state=active]:text-[var(--text-primary)]"
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </TabsTrigger>
                )
              })}
            </TabsList>
            <div className="min-h-[200px]">
              <AnimatePresence mode="wait">
                {tabs
                  .filter((tab) => tab.id === active)
                  .map((tab) => (
                    <motion.div
                      key={tab.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
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
