'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Clipboard, Menu, X } from 'lucide-react'
import { Button } from '@clipsync/ui'
import { ThemeToggle } from '@/components/ThemeToggle'

const navLinks = [
  { href: '/#features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/#download', label: 'Download' },
  { href: '/changelog', label: 'Changelog' },
  { href: '/#docs', label: 'Docs' },
]

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'pt-3 px-4 md:pt-4 md:px-6' : ''
      }`}
    >
      <div
        className={`transition-all duration-300 ease-out ${
          scrolled
            ? 'mx-auto max-w-4xl rounded-2xl border border-[var(--border)] shadow-lg dark:shadow-black/20 glass md:rounded-2xl'
            : ''
        }`}
      >
        <nav className="flex h-14 md:h-16 items-center justify-between px-4 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold text-[var(--text-primary)] transition-opacity hover:opacity-90"
          aria-label="ClipSync Home"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--primary-from)] to-[var(--primary-to)]">
            <Clipboard className="h-5 w-5 text-[var(--primary-foreground)]" aria-hidden />
          </div>
          <span className="font-display font-semibold">ClipSync</span>
        </Link>

        <div className="hidden md:flex md:items-center md:gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative inline-block text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-[var(--primary-from)] after:transition-[width] after:duration-200 after:content-[''] hover:after:w-full"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex md:items-center md:gap-3">
          <ThemeToggle />
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild className="bg-gradient-to-r from-[var(--primary-from)] to-[var(--primary-to)] text-[var(--primary-foreground)] hover:opacity-90">
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>

        <button
          type="button"
          className="md:hidden rounded-lg p-2 text-[var(--text-primary)] hover:bg-violet-500/10"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        </nav>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className={`md:hidden ${scrolled ? 'mx-4 mt-2 rounded-2xl border border-[var(--border)] glass' : 'glass border-t border-[var(--border)]'}`}
          >
            <div className={`flex flex-col gap-2 px-4 py-4 ${scrolled ? 'mx-auto max-w-4xl' : 'container mx-auto'}`}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-[var(--text-primary)] hover:bg-violet-500/10"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-[var(--border)] pt-4">
                <div className="flex justify-center">
                  <ThemeToggle />
                </div>
                <Button variant="ghost" asChild className="justify-center">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild className="bg-gradient-to-r from-[var(--primary-from)] to-[var(--primary-to)] text-[var(--primary-foreground)]">
                  <Link href="/signup">Get Started</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
