'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'Is my data encrypted?',
    answer:
      'Yes. All clipboard data is encrypted end-to-end. We use industry-standard encryption so only you can read your clips. We never store plain-text content on our servers.',
  },
  {
    question: 'Which platforms are supported?',
    answer:
      'ClipSync runs on Windows 10+, macOS 10.15+, and most modern Linux distributions. We also offer a web app for quick access from any browser.',
  },
  {
    question: 'Can I use it offline?',
    answer:
      'Yes. Your recent clips are stored locally. When you go offline, you can still access and paste from your local history. Changes sync automatically when you’re back online.',
  },
  {
    question: 'How does syncing work?',
    answer:
      'When you copy something, ClipSync sends an encrypted copy to our sync service. Other devices signed into your account receive updates in real time. Sync typically completes in under a second.',
  },
  {
    question: 'What happens to my free data if I don\'t upgrade?',
    answer:
      'Free accounts keep the last 100 clips with 7-day retention. Older clips are automatically removed. You can export your data anytime. If you upgrade later, nothing is lost—we preserve your history.',
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section
      id="faq"
      className="relative py-24 md:py-32"
      aria-labelledby="faq-heading"
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2
            id="faq-heading"
            className="font-display text-3xl font-bold text-[var(--text-primary)] md:text-4xl"
          >
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg text-[var(--text-secondary)]">
            Everything you need to know about ClipSync.
          </p>
        </motion.div>

        <div className="mx-auto mt-16 max-w-3xl space-y-2">
          {faqs.map((faq, index) => (
            <motion.div
              key={faq.question}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex w-full items-center justify-between px-6 py-4 text-left font-medium text-[var(--text-primary)] hover:bg-amber-500/10 transition-colors"
                aria-expanded={openIndex === index}
              >
                {faq.question}
                <motion.span
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-5 w-5 text-[var(--text-secondary)]" aria-hidden />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="border-t border-[var(--border)] px-6 py-4 text-sm text-[var(--text-secondary)]">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
