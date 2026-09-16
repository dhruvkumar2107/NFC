import Link from 'next/link'
import ScrollReveal from '../ScrollReveal'

const designs = [
  {
    name: 'Velvet Premium Pvc Card',
    front: '/photos/velvet-front.jpeg',
    back: '/photos/velvet-back.jpeg',
    tag: 'Premium',
  },
  {
    name: 'Pink Butterfly Premium Pvc Card',
    front: '/photos/pink-butterfly-front.jpeg',
    back: '/photos/pink-butterfly-back.jpeg',
    tag: 'Premium',
  },
  {
    name: 'Green Leaf Glass Premium Pvc Card',
    front: '/photos/green-leaf-glass-front.jpeg',
    back: '/photos/green-leaf-glass-back.jpeg',
    tag: 'Premium',
  },
  {
    name: 'Glass Transparent Premium Pvc Card',
    front: '/photos/glass-transparent-front.jpeg',
    back: '/photos/glass-transparent-back.jpeg',
    tag: 'Premium',
  },
  {
    name: 'Wooden Premium Pvc Card',
    front: '/photos/wooden-front.jpeg',
    back: '/photos/wooden-back.jpeg',
    tag: 'Premium',
  },
  {
    name: 'Golden Car Premium Pvc Card',
    front: '/photos/golden-car-front.jpeg',
    back: '/photos/golden-car-back.jpeg',
    tag: 'Premium',
  },
  {
    name: 'Fire Lion Premium Pvc Card',
    front: '/photos/fire-lion-front.jpeg',
    back: '/photos/fire-lion-back.jpeg',
    tag: 'Premium',
  },
  {
    name: 'Fish Aquarium Premium Pvc Card',
    front: '/photos/fish-aquarium-front.jpeg',
    back: '/photos/fish-aquarium-back.jpeg',
    tag: 'Premium',
  },
  {
    name: 'Silver Premium Pvc Card',
    front: '/photos/silver-front.jpeg',
    back: '/photos/silver-back.jpeg',
    tag: 'Premium',
  },
  {
    name: 'Golden Lion Premium Pvc Card',
    front: '/photos/golden-lion-front.jpeg',
    back: '/photos/golden-lion-back.jpeg',
    tag: 'Premium',
  },
  {
    name: 'Diamond Premium Pvc Card',
    front: '/photos/diamond-front.jpeg',
    back: '/photos/diamond-back.jpeg',
    tag: 'Premium',
  },
]

const benefits = [
  {
    title: 'Lifetime Access',
    desc: 'One purchase, yours forever. No expiry.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
  {
    title: 'Works on iOS & Android',
    desc: 'Tap on any NFC-enabled smartphone.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
      </svg>
    ),
  },
  {
    title: 'No Yearly Renewals',
    desc: 'Pay once. Never worry about renewals.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
      </svg>
    ),
  },
  {
    title: 'One-Time Payment',
    desc: '₹699 only. No hidden charges ever.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
  },
  {
    title: 'Instant Activation',
    desc: 'Your digital profile goes live immediately.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    title: 'Collect Leads',
    desc: 'Grow your network with every tap and scan.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
]

export const metadata = {
  title: 'Card Designs - MySmartCard',
  description: 'Choose from our premium NFC-enabled smart card designs. One-time payment, lifetime access.',
}

export default function CardsPage() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* ─── Hero / Offer Section ─── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-gray-50/50 to-white">
        {/* Subtle ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary-100/20 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-24">
          <ScrollReveal>
            <div className="text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-100 text-primary-700 text-xs font-semibold tracking-wide px-4 py-2 rounded-full mb-6">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                LIMITED OFFER
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-4 leading-[1.1]">
                Lifetime Access.
                <br />
                <span className="text-primary-600">One Payment.</span>
              </h1>

              <p className="text-gray-500 text-lg sm:text-xl max-w-lg mx-auto mb-10 leading-relaxed">
                Get your premium NFC smart card with a digital profile that lasts forever. No renewals. No hidden fees.
              </p>

              {/* Price Block */}
              <div className="flex flex-col items-center gap-3 mb-8">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-xl line-through decoration-2">₹1999</span>
                  <span className="inline-flex items-center bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-full border border-green-100">
                    SAVE 65%
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-gray-500 text-2xl font-semibold">₹</span>
                  <span className="text-6xl sm:text-7xl font-extrabold text-gray-900 tracking-tight">699</span>
                </div>
              </div>

              {/* Sub-messages */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm text-gray-500 mb-10">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  One-Time Payment
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Lifetime Access
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  No Renewals. Ever.
                </div>
              </div>

              {/* CTA */}
              <Link
                href="/order"
                className="inline-flex items-center gap-2.5 bg-primary-600 text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:bg-primary-700 hover:-translate-y-0.5 shadow-lg shadow-primary-600/25 hover:shadow-xl hover:shadow-primary-600/35"
              >
                Buy Now &ndash; Just ₹699
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>

              {/* Trust strip */}
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 text-xs text-gray-400">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Free Delivery
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  NFC Enabled
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  7-Day Refund
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  10K+ Cards Delivered
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Benefits Section ─── */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-primary-600 tracking-widest uppercase mb-3">Why MySmartCard</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">Everything You Need</h2>
              <div className="w-16 h-0.5 bg-gradient-to-r from-primary-400 to-primary-600 mx-auto mt-5 rounded-full" />
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefits.map((b, i) => (
              <ScrollReveal key={b.title} delay={i * 70} direction="up">
                <div className="group flex items-start gap-4 p-6 rounded-2xl border border-gray-100 bg-white hover:border-primary-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 group-hover:bg-primary-100 transition-colors duration-300">
                    {b.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{b.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Product / Visual Showcase ─── */}
      <section className="py-20 sm:py-28 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-primary-600 tracking-widest uppercase mb-3">Our Collection</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">Premium Card Designs</h2>
              <p className="text-gray-400 mt-4 max-w-md mx-auto">Hover over any card to see the back design. Each card comes with NFC + QR code.</p>
              <div className="w-16 h-0.5 bg-gradient-to-r from-primary-400 to-primary-600 mx-auto mt-5 rounded-full" />
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {designs.map((d, i) => (
              <ScrollReveal key={d.name} delay={i * 60} direction="up">
                <div className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-400">
                  {/* Image flip container */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
                    {/* Front image */}
                    <img
                      src={d.front}
                      alt={`${d.name} - Front`}
                      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0"
                    />
                    {/* Back image */}
                    <img
                      src={d.back}
                      alt={`${d.name} - Back`}
                      className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    />
                    {/* Hover hint */}
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] font-medium px-2.5 py-1 rounded-full opacity-100 group-hover:opacity-0 transition-opacity duration-300 backdrop-blur-sm">
                      Hover to see back
                    </div>
                  </div>

                  {/* Card info */}
                  <div className="p-5">
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug">{d.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2.5 py-0.5 rounded-full">{d.tag}</span>
                      <span className="text-xs text-gray-400">NFC + QR</span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
        {/* Decorative glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-primary-600/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <ScrollReveal>
            <p className="text-sm font-semibold text-primary-400 tracking-widest uppercase mb-4">Limited Time Offer</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4 leading-tight">
              Get Lifetime Access
              <br />
              <span className="text-primary-400">for Just ₹699</span>
            </h2>
            <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto leading-relaxed">
              One-time payment. No renewals. Ever. Your premium NFC smart card with a digital profile that lasts forever.
            </p>

            {/* Price recap */}
            <div className="flex items-center justify-center gap-3 mb-10">
              <span className="text-gray-500 text-lg line-through">₹1999</span>
              <span className="text-white text-4xl sm:text-5xl font-extrabold">₹699</span>
              <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2.5 py-1 rounded-full border border-green-500/20">SAVE 65%</span>
            </div>

            <Link
              href="/order"
              className="inline-flex items-center gap-2.5 bg-white text-gray-900 px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:bg-gray-100 hover:-translate-y-0.5 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30"
            >
              Buy Now &ndash; Just ₹699
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>

            <p className="text-gray-500 text-xs mt-6">Secure payment via Razorpay. 7-day money-back guarantee.</p>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
