import Link from 'next/link'
import { Nav } from '@/components/sections/Nav'
import { Footer } from '@/components/sections/Footer'
import { Sparkles, Bug, Zap, Shield } from 'lucide-react'

export const metadata = {
  title: 'Changelog — ClipSync',
  description: 'See what’s new in ClipSync. Product updates, new features, and improvements.',
}

const entries = [
  {
    version: '1.2.0',
    date: '2025-01-28',
    highlights: [
      { type: 'feature', text: 'Global keyboard shortcuts (⌘+Shift+V) on all platforms' },
      { type: 'feature', text: 'Quick filters: filter by text, URL, or code' },
      { type: 'improvement', text: 'Faster sync: typical sync now under 500ms' },
    ],
  },
  {
    version: '1.1.0',
    date: '2025-01-15',
    highlights: [
      { type: 'feature', text: 'Favorites and pinned clips' },
      { type: 'feature', text: 'Export clipboard history as JSON or CSV' },
      { type: 'improvement', text: 'Reduced memory usage on Windows and macOS' },
      { type: 'fix', text: 'Fixed sync conflict when copying rapidly across devices' },
    ],
  },
  {
    version: '1.0.0',
    date: '2024-12-01',
    highlights: [
      { type: 'feature', text: 'Initial release: clipboard sync across Windows, macOS, Linux' },
      { type: 'feature', text: 'End-to-end encrypted sync' },
      { type: 'feature', text: 'Search and filter clipboard history' },
      { type: 'feature', text: 'Desktop apps for all supported platforms' },
    ],
  },
]

const iconMap = {
  feature: Sparkles,
  improvement: Zap,
  fix: Bug,
  security: Shield,
}

export default function ChangelogPage() {
  return (
    <>
      <Nav />
      <main id="main-content" className="min-h-screen">
        <section className="border-b border-[var(--border)] bg-[var(--surface)]/50 pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h1 className="font-display text-3xl font-bold text-[var(--text-primary)] md:text-4xl">
                Changelog
              </h1>
              <p className="mt-4 text-lg text-[var(--text-secondary)]">
                What’s new in ClipSync. We ship often and keep you in the loop.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              {/* Vertical timeline: line runs through node centers */}
              <div className="relative">
                <div
                  className="absolute left-6 top-0 bottom-0 w-px bg-[var(--border)]"
                  aria-hidden
                />
                <ul className="space-y-0">
                  {entries.map((release) => (
                    <li
                      key={release.version}
                      className="relative flex gap-8 pb-16 last:pb-0 md:gap-10 md:pb-20 md:last:pb-0"
                    >
                      {/* Node on timeline (centered on line) */}
                      <div className="relative z-10 flex w-12 shrink-0 justify-center pt-1">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--primary-from)] bg-[var(--background)] shadow-sm md:h-12 md:w-12"
                          aria-hidden
                        >
                          <span className="text-xs font-bold text-[var(--primary-from)] md:text-sm">
                            v{release.version.split('.')[0]}
                          </span>
                        </div>
                      </div>
                      {/* Content */}
                      <div className="min-w-0 flex-1 pt-0">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h2 className="font-display text-xl font-semibold text-[var(--text-primary)] md:text-2xl">
                            v{release.version}
                          </h2>
                          <time
                            dateTime={release.date}
                            className="text-sm text-[var(--text-secondary)]"
                          >
                            {new Date(release.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </time>
                        </div>
                        <ul className="mt-6 space-y-3">
                          {release.highlights.map((item, i) => {
                            const Icon = iconMap[item.type as keyof typeof iconMap] ?? Sparkles
                            return (
                              <li
                                key={i}
                                className="flex items-start gap-3 text-sm text-[var(--text-secondary)]"
                              >
                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-violet-100 text-[var(--primary-from)]">
                                  <Icon className="h-3 w-3" aria-hidden />
                                </span>
                                <span>{item.text}</span>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--border)] py-12">
          <div className="container mx-auto px-4 text-center">
            <p className="text-[var(--text-secondary)]">
              Want to request a feature?{' '}
              <Link
                href="/contact"
                className="font-medium text-[var(--primary-from)] hover:underline"
              >
                Get in touch
              </Link>
            </p>
          </div>
        </section>

        <Footer />
      </main>
    </>
  )
}
