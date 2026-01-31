import { Nav } from '@/components/sections/Nav'
import { Footer } from '@/components/sections/Footer'
import { HowItWorks } from '@/components/sections/HowItWorks'

export const metadata = {
  title: 'About — ClipSync',
  description: 'We build ClipSync to help you never lose what you copy. Your clipboard, everywhere.',
}

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main id="main-content" className="min-h-screen">
        <section className="pt-24 pb-16">
          <div className="container mx-auto max-w-3xl px-4 text-center">
            <h1 className="font-display text-3xl font-bold text-[var(--text-primary)] md:text-4xl">
              About ClipSync
            </h1>
            <p className="mt-6 text-lg text-[var(--text-secondary)] leading-relaxed">
              We built ClipSync because we were tired of losing important snippets
              when switching between devices. Our mission is simple: your clipboard
              should follow you everywhere—secure, fast, and without friction.
            </p>
            <p className="mt-4 text-[var(--text-secondary)]">
              We’re a small team focused on productivity tools that just work.
              No bloat, no lock-in. Just a better way to copy and paste.
            </p>
          </div>
        </section>
        <HowItWorks />
        <Footer />
      </main>
    </>
  )
}
