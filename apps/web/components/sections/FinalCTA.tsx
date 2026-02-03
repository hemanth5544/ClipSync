'use client'

import { motion } from 'framer-motion'
import { Button } from '@clipsync/ui'
import { Download, Monitor, Laptop, Terminal, Clock, Globe } from 'lucide-react'

// Files in web app public/releases/ — put built desktop installers there
const RELEASES_PATH = '/releases'
const WEB_APP_URL = 'https://clipsync.up.railway.app'

const desktopFiles = {
  windows: 'ClipSync Setup 1.0.0.exe',
  macArm: 'ClipSync-1.0.0-arm64.dmg',
  macIntel: 'ClipSync-1.0.0-x64.dmg',
  linuxAppImage: 'ClipSync-1.0.0.AppImage',
  linuxDeb: 'clipsync-desktop_1.0.0_amd64.deb',
} as const

function downloadUrl(filename: string) {
  return `${RELEASES_PATH}/${filename}`
}

export function FinalCTA() {
  return (
    <section
      id="download"
      className="relative py-24 md:py-32"
      aria-labelledby="cta-heading"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary-from)]/15 via-[var(--primary-to)]/10 to-amber-200/20" />
      <div className="absolute inset-0 noise-overlay" />
      <div className="container relative mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-4xl"
        >
          <h2
            id="cta-heading"
            className="font-display text-3xl font-bold text-[var(--text-primary)] md:text-4xl lg:text-5xl"
          >
            Start organizing your clipboard today
          </h2>
          <p className="mt-6 text-lg text-[var(--text-secondary)]">
            Join thousands of users who never lose their clips. Download the
            desktop app for your platform.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {/* Windows — Coming soon */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]/60 p-5 opacity-80">
              <div className="flex items-center justify-center gap-2 text-[var(--text-secondary)]">
                <Monitor className="h-5 w-5" aria-hidden />
                <span className="font-medium">Windows</span>
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)]/50 py-3 text-sm text-[var(--text-secondary)]">
                <Clock className="h-4 w-4" aria-hidden />
                Coming soon
              </div>
            </div>

            {/* macOS — Coming soon */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]/60 p-5 opacity-80">
              <div className="flex items-center justify-center gap-2 text-[var(--text-secondary)]">
                <Laptop className="h-5 w-5" aria-hidden />
                <span className="font-medium">macOS</span>
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)]/50 py-3 text-sm text-[var(--text-secondary)]">
                <Clock className="h-4 w-4" aria-hidden />
                Coming soon
              </div>
            </div>

            {/* Linux: AppImage + DEB */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]/80 p-5 shadow-sm backdrop-blur">
              <div className="flex items-center justify-center gap-2 text-[var(--text-secondary)]">
                <Terminal className="h-5 w-5" aria-hidden />
                <span className="font-medium">Linux</span>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <Button
                  asChild
                  size="lg"
                  className="w-full bg-gradient-to-r from-[var(--primary-from)] to-[var(--primary-to)] text-white hover:opacity-90"
                >
                  <a
                    href={downloadUrl(desktopFiles.linuxAppImage)}
                    download
                    aria-label={`Download ClipSync AppImage (${desktopFiles.linuxAppImage})`}
                  >
                    <Download className="mr-2 h-4 w-4" aria-hidden />
                    AppImage
                  </a>
                </Button>
                <Button asChild size="lg" className="w-full" variant="outline">
                  <a
                    href={downloadUrl(desktopFiles.linuxDeb)}
                    download
                    aria-label={`Download ClipSync DEB (${desktopFiles.linuxDeb})`}
                  >
                    DEB (.deb)
                  </a>
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-4">
            <Button asChild variant="outline" size="lg" className="gap-2">
              <a href={WEB_APP_URL} target="_blank" rel="noopener noreferrer" aria-label="Try ClipSync in the browser">
                <Globe className="h-4 w-4" aria-hidden />
                Try Web
              </a>
            </Button>
          </div>
          <p className="mt-6 text-sm text-[var(--text-secondary)]">
            Desktop builds are alpha — early release. No credit card required.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
