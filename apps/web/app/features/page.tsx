import { Nav } from '@/components/sections/Nav'
import { FeaturesBento } from '@/components/sections/FeaturesBento'
import { ProductShowcase } from '@/components/sections/ProductShowcase'
import { Footer } from '@/components/sections/Footer'

export const metadata = {
  title: 'Features — ClipSync',
  description: 'Instant sync, secure & private, lightning search, smart organization, and more.',
}

export default function FeaturesPage() {
  return (
    <>
      <Nav />
      <main id="main-content" className="min-h-screen">
        <section className="pt-24 pb-12">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-display text-3xl font-bold text-[var(--text-primary)] md:text-4xl">
              Features
            </h1>
            <p className="mt-4 text-lg text-[var(--text-secondary)]">
              Everything you need to keep your clipboard in sync.
            </p>
          </div>
        </section>
        <FeaturesBento />
        <ProductShowcase />
        <Footer />
      </main>
    </>
  )
}
