'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Button } from '@clipsync/ui'

const tiers = [
  {
    name: 'Free',
    price: { monthly: 0, yearly: 0 },
    description: 'Get started with the basics',
    features: [
      '100 clips history',
      '1 device',
      'Basic search',
      '7-day sync retention',
    ],
    cta: 'Get Started',
    href: '/#download',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: { monthly: 9, yearly: 86 },
    description: 'For power users who need more',
    features: [
      'Unlimited clips',
      'Unlimited devices',
      'Advanced search & filters',
      'Priority support',
      'Cloud backup',
      '30-day sync retention',
    ],
    cta: 'Start Free Trial',
    href: '/signup',
    highlighted: true,
  },
  {
    name: 'Team',
    price: { monthly: 19, yearly: 182 },
    description: 'For teams that share snippets',
    features: [
      'Everything in Pro',
      'Team workspace',
      'Shared snippets',
      'Admin controls',
      'SSO (coming soon)',
    ],
    cta: 'Contact Sales',
    href: '/contact',
    highlighted: false,
    badge: 'Coming Soon',
  },
]

export function Pricing() {
  const [yearly, setYearly] = useState(false)

  return (
    <section
      id="pricing"
      className="relative py-24 md:py-32"
      aria-labelledby="pricing-heading"
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2
            id="pricing-heading"
            className="font-display text-3xl font-bold text-[var(--text-primary)] md:text-4xl"
          >
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-[var(--text-secondary)]">
            Start free. Upgrade when you need more.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <span
              className={`text-sm font-medium ${
                !yearly ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
              }`}
            >
              Monthly
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={yearly}
              onClick={() => setYearly(!yearly)}
              className="relative h-7 w-12 rounded-full bg-[var(--surface)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary-from)] data-[state=checked]:bg-[var(--primary-from)]"
              style={{ backgroundColor: yearly ? 'var(--primary-from)' : 'var(--surface)' }}
            >
              <motion.span
                className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow"
                animate={{ x: yearly ? 24 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
            <span
              className={`text-sm font-medium ${
                yearly ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
              }`}
            >
              Yearly
            </span>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
              Save 20%
            </span>
          </div>
        </motion.div>

        <div className="mx-auto mt-16 grid max-w-6xl gap-8 md:grid-cols-3">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
className={`relative flex flex-col rounded-2xl border bg-[var(--surface)] p-8 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/15 ${
                  tier.highlighted
                  ? 'border-[var(--primary-from)] shadow-lg shadow-violet-500/25'
                  : 'border-[var(--border)]'
              }`}
            >
              {tier.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--border)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                  {tier.badge}
                </span>
              )}
              {tier.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[var(--primary-from)] to-[var(--primary-to)] px-3 py-1 text-xs font-medium text-white">
                  Most Popular
                </span>
              )}
              <h3 className="font-display text-xl font-semibold text-[var(--text-primary)]">
                {tier.name}
              </h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {tier.description}
              </p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold text-[var(--text-primary)]">
                  ${yearly ? tier.price.yearly : tier.price.monthly}
                </span>
                {tier.price.monthly > 0 && (
                  <span className="text-[var(--text-secondary)]">
                    /{yearly ? 'year' : 'month'}
                  </span>
                )}
              </div>
              <ul className="mt-8 flex-1 space-y-4">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check
                      className="h-5 w-5 shrink-0 text-[var(--primary-from)]"
                      aria-hidden
                    />
                    <span className="text-[var(--text-secondary)]">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className={`mt-8 w-full ${
                  tier.highlighted
                    ? 'bg-gradient-to-r from-[var(--primary-from)] to-[var(--primary-to)] text-white hover:opacity-90'
                    : ''
                }`}
                variant={tier.highlighted ? 'default' : 'outline'}
              >
                <Link href={tier.href}>{tier.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
