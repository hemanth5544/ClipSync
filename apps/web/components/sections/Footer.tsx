'use client'

import Link from 'next/link'
import { Clipboard, Twitter, Github, Linkedin } from 'lucide-react'

const columns = [
  {
    title: 'Product',
    links: [
      { href: '/#features', label: 'Features' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/#download', label: 'Download' },
      { href: '/changelog', label: 'Changelog' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/blog', label: 'Blog' },
      { href: '/careers', label: 'Careers' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { href: '/#docs', label: 'Docs' },
      { href: '/api', label: 'API' },
      { href: '/support', label: 'Support' },
      { href: '/community', label: 'Community' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
      { href: '/security', label: 'Security' },
    ],
  },
]

const social = [
  { href: 'https://twitter.com', icon: Twitter, label: 'Twitter' },
  { href: 'https://github.com', icon: Github, label: 'GitHub' },
  { href: 'https://linkedin.com', icon: Linkedin, label: 'LinkedIn' },
]

export function Footer() {
  return (
    <footer
      className="border-t border-[var(--border)] bg-[var(--surface)] py-16"
      role="contentinfo"
    >
      <div className="container mx-auto px-4">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-semibold text-[var(--text-primary)]"
              aria-label="ClipSync Home"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--primary-from)] to-[var(--primary-to)]">
                <Clipboard className="h-5 w-5 text-white" aria-hidden />
              </div>
              <span className="font-display">ClipSync</span>
            </Link>
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              Your clipboard, everywhere. Never lose what you copy.
            </p>
            <div className="mt-6 flex gap-4">
              {social.map((s) => {
                const Icon = s.icon
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                    aria-label={s.label}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </a>
                )
              })}
            </div>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="font-display text-sm font-semibold text-[var(--text-primary)]">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] pt-8 md:flex-row">
          <p className="text-sm text-[var(--text-secondary)]">
            © {new Date().getFullYear()} ClipSync. All rights reserved.
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            Made with ❤️ for productivity
          </p>
        </div>
      </div>
    </footer>
  )
}
