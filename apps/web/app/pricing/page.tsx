import Link from 'next/link'
import { Nav } from '@/components/sections/Nav'
import { Pricing } from '@/components/sections/Pricing'
import { Footer } from '@/components/sections/Footer'

export const metadata = {
  title: 'Pricing — ClipSync',
  description: 'Simple, transparent pricing. Start free, upgrade when you need more.',
}

export default function PricingPage() {
  return (
    <>
      <Nav />
      <main id="main-content" className="min-h-screen">
        <section className="pt-24 pb-12">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-display text-3xl font-bold text-[var(--text-primary)] md:text-4xl">
              Pricing
            </h1>
            <p className="mt-4 text-lg text-[var(--text-secondary)]">
              Choose the plan that fits your workflow.
            </p>
          </div>
        </section>
        <Pricing />
        <section className="pb-24">
          <div className="container mx-auto px-4 text-center">
            <p className="text-[var(--text-secondary)]">
              Questions?{' '}
              <Link href="/contact" className="text-[var(--primary-from)] hover:underline">
                Contact us
              </Link>
            </p>
          </div>
        </section>
        <Footer />
      </main>
    </>
  )
}
