import { Nav } from '@/components/sections/Nav'
import { Hero } from '@/components/sections/Hero'
import { SocialProof } from '@/components/sections/SocialProof'
import { FeaturesBento } from '@/components/sections/FeaturesBento'
import { ProductShowcase } from '@/components/sections/ProductShowcase'
import { HowItWorks } from '@/components/sections/HowItWorks'
import { Pricing } from '@/components/sections/Pricing'
import { FAQ } from '@/components/sections/FAQ'
import { FinalCTA } from '@/components/sections/FinalCTA'
import { Footer } from '@/components/sections/Footer'

export default function HomePage() {
  return (
    <>
      <Nav />
      <main id="main-content">
        <Hero />
        <SocialProof />
        <FeaturesBento />
        <ProductShowcase />
        <HowItWorks />
        <Pricing />
        <FAQ />
        <FinalCTA />
        <Footer />
      </main>
    </>
  )
}
