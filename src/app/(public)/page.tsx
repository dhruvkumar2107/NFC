import Link from 'next/link'
import { prisma } from '@/lib/db'
import ScrollReveal from './ScrollReveal'

export const dynamic = 'force-dynamic'

const steps = [
  { step: '01', title: 'Choose Your Design', desc: 'Pick from our premium card designs crafted with precision.' },
  { step: '02', title: 'Enter Your Details', desc: 'Add your profile, contact info, and payment details.' },
  { step: '03', title: 'Preview & Pay', desc: 'Review your digital profile and complete secure payment.' },
  { step: '04', title: 'Receive Your Card', desc: 'Get your NFC card delivered to your doorstep.' },
]

const features = [
  { title: 'Instant Profile Sharing', desc: 'Tap your card and share your complete profile instantly via NFC.', icon: '📡' },
  { title: 'QR Code Access', desc: 'Two QR codes - one for your profile, one for payments.', icon: '📱' },
  { title: 'Receive Payments', desc: 'Get paid directly via UPI when someone scans your payment QR.', icon: '💰' },
  { title: 'Always Updated', desc: 'Edit your profile online - your card always shows the latest info.', icon: '🔄' },
  { title: 'Premium Designs', desc: 'Choose from Premium PVC Card, Premium Wood, or Premium Metal card designs.', icon: '✨' },
  { title: 'Digital + Physical', desc: 'Get a physical NFC card plus a shareable digital profile link.', icon: '🔗' },
]

const faqs = [
  { q: 'How does NFC work?', a: 'Simply tap your MySmartCard on any NFC-enabled smartphone. It instantly opens your digital profile page with all your contact details, social links, and payment information.' },
  { q: 'Can I update my profile after buying?', a: 'Yes! Your physical card never changes - it just contains a URL. You can update your profile anytime from your dashboard, and the changes appear instantly.' },
  { q: 'How do I receive payments?', a: 'The QR code on the back of your card links to your UPI payment address. Anyone can scan it to send you money directly.' },
  { q: 'What is the return policy?', a: 'We offer a full refund within 7 days of delivery if you are not satisfied with your card.' },
  { q: 'How long does delivery take?', a: 'Cards are typically delivered within 5-7 business days across India. You will receive tracking information once your card is shipped.' },
  { q: 'Is my data secure?', a: 'Your NFC chip only stores a URL, never personal data. Your profile page is publicly accessible but contains only the information you choose to share.' },
]

const stats = [
  { value: '10K+', label: 'Cards Delivered' },
  { value: '500+', label: 'Businesses Trust Us' },
  { value: '99.9%', label: 'Uptime' },
  { value: '4.9★', label: 'Customer Rating' },
]

export default async function HomePage() {
  let designs: any[] = []
  try {
    designs = await prisma.cardDesign.findMany({ where: { active: true }, orderBy: { price: 'asc' } })
  } catch {}

  return (
    <div>
      {/* Hero - Premium Glass Banner */}
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-gray-50 via-white to-gray-50 pt-4 pb-4">
        {/* Ambient glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary-200/15 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <div className="relative group">
              {/* Glass container */}
              <div className="relative rounded-3xl overflow-hidden shadow-hero border border-white/60 bg-white/40 backdrop-blur-sm">
                {/* Top glass highlight */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent z-10" />

                {/* The banner image */}
                <img
                  src="/photos/hero-banner.jpeg"
                  alt="MySmartCard Collections"
                  className="w-full h-auto object-cover"
                />

                {/* White glass overlay on image */}
                <div className="absolute inset-0 bg-white/[0.07]" />

                {/* Frosted edges */}
                <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
              </div>

              {/* Outer glow ring on hover */}
              <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-r from-primary-200/20 via-purple-200/10 to-primary-200/20 blur-sm -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              {/* Reflection */}
              <div className="absolute -bottom-2 left-[10%] right-[10%] h-4 bg-primary-300/10 rounded-full blur-lg" />
            </div>
          </ScrollReveal>

          {/* Buy Now + Detailed Description */}
          <div className="mt-4 relative z-30">
            {/* Buy Now Button */}
            <div className="flex justify-center mb-6">
              <Link href="/order" className="btn-primary text-base px-10 py-3.5 shadow-lg shadow-primary-600/30 hover:shadow-xl hover:shadow-primary-600/40 inline-flex items-center gap-2 min-h-[48px]">
                Buy Now - Starting ₹999
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>

            {/* Detailed Feature Description */}
            <div className="glass rounded-2xl p-5 sm:p-6">
              <div className="text-center mb-5">
                <h3 className="text-lg font-bold text-gray-900">What&apos;s Inside Your MySmartCard</h3>
                <p className="text-sm text-gray-400 mt-1">One card. Everything you need to share and get paid.</p>
              </div>

              {/* Feature grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                {[
                  { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0" /></svg>, title: 'NFC Tap', desc: 'Tap phone to share' },
                  { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" /></svg>, title: 'Profile QR', desc: 'Scan to view profile' },
                  { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>, title: 'Payment QR', desc: 'Receive UPI payments' },
                  { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" /></svg>, title: 'Digital Profile', desc: 'Editable online page' },
                ].map((f) => (
                  <div key={f.title} className="text-center">
                    <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-2 text-primary-600">
                      {f.icon}
                    </div>
                    <div className="text-xs font-semibold text-gray-900">{f.title}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{f.desc}</div>
                  </div>
                ))}
              </div>

              {/* Tap Connect Share */}
              <div className="flex items-center justify-center gap-3 sm:gap-6 text-xs text-gray-500 mb-5">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                    <svg className="w-3 h-3 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0" /></svg>
                  </div>
                  <span className="font-medium">Tap</span>
                </div>
                <svg className="w-3 h-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                    <svg className="w-3 h-3 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                  </div>
                  <span className="font-medium">Connect</span>
                </div>
                <svg className="w-3 h-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                    <svg className="w-3 h-3 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>
                  </div>
                  <span className="font-medium">Share</span>
                </div>
              </div>

              {/* Social links preview */}
              <div className="flex items-center justify-center gap-3 mb-5">
                {[
                  { name: 'Instagram', color: 'bg-pink-50 text-pink-500', icon: <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg> },
                  { name: 'LinkedIn', color: 'bg-blue-50 text-blue-600', icon: <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg> },
                  { name: 'WhatsApp', color: 'bg-green-50 text-green-500', icon: <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg> },
                  { name: 'Website', color: 'bg-gray-50 text-gray-500', icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg> },
                ].map((s) => (
                  <div key={s.name} className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color}`}>
                    {s.icon}
                  </div>
                ))}
              </div>

              {/* Trust bar */}
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-[11px] text-gray-400 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Free Delivery
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  NFC Enabled
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  7-Day Refund
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  10K+ Cards Delivered
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-28 sm:py-36 gradient-mesh relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100/40 rounded-full blur-3xl -translate-y-1/2" />
        <div className="relative max-w-6xl mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-20">
              <p className="text-sm font-semibold text-primary-600 tracking-widest uppercase mb-4">Simple Process</p>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">How It Works</h2>
              <div className="w-20 h-1 bg-gradient-to-r from-primary-400 to-primary-600 mx-auto mt-6 rounded-full" />
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <ScrollReveal key={s.step} delay={i * 100} direction="up">
                <div className="text-center group">
                  <div className="relative inline-block mb-6">
                    <div className="w-16 h-16 bg-primary-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary-200 transition-all duration-300">
                      {s.step}
                    </div>
                    {i < steps.length - 1 && (
                      <div className="hidden md:block absolute top-1/2 left-full w-full h-0.5 bg-gradient-to-r from-primary-300 to-transparent -translate-y-1/2" />
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-lg">{s.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* How NFC Works */}
      <section className="py-28 sm:py-36 bg-white relative">
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-50/60 rounded-full blur-3xl translate-y-1/2" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <ScrollReveal direction="left">
              <div>
                <p className="text-sm font-semibold text-primary-600 tracking-widest uppercase mb-4">Technology</p>
                <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-8 text-gray-900">How NFC Works</h2>
                <p className="text-gray-500 mb-10 leading-relaxed text-lg">
                  NFC (Near Field Communication) is a wireless technology that allows two devices to communicate when they are within 4 cm of each other.
                  Your MySmartCard contains a tiny NFC chip that stores a web URL.
                </p>
                <div className="space-y-8">
                  {[
                    { num: '01', title: 'Tap Your Card', desc: 'Simply tap your MySmartCard on the back of any NFC-enabled smartphone.' },
                    { num: '02', title: 'Profile Opens Instantly', desc: 'The phone reads the URL from the chip and opens your digital profile page.' },
                    { num: '03', title: 'Connect & Share', desc: 'Your contacts can save your details, connect on social media, or pay you via UPI.' },
                  ].map((item) => (
                    <div key={item.num} className="flex items-start gap-5 group">
                      <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center text-sm font-bold group-hover:bg-primary-600 group-hover:text-white transition-all duration-300 shrink-0">
                        {item.num}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                        <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="right">
              <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-3xl p-10 border border-primary-100/50">
                <div className="bg-white rounded-2xl p-8 max-w-xs mx-auto text-center shadow-card">
                  <div className="w-20 h-20 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
                    </svg>
                  </div>
                  <div className="font-bold text-lg text-gray-900 mb-2">NFC Enabled</div>
                  <p className="text-gray-400 text-sm leading-relaxed">Works with iPhone 7+ and most Android phones from 2012 onwards</p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-28 sm:py-36 gradient-mesh relative">
        <div className="absolute top-20 left-0 w-72 h-72 bg-primary-100/30 rounded-full blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-20">
              <p className="text-sm font-semibold text-primary-600 tracking-widest uppercase mb-4">Capabilities</p>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">Features</h2>
              <div className="w-20 h-1 bg-gradient-to-r from-primary-400 to-primary-600 mx-auto mt-6 rounded-full" />
            </div>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 80} direction="up">
                <div className="card text-center group">
                  <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 group-hover:scale-110 group-hover:bg-primary-100 transition-all duration-300">
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-lg">{f.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* QR + UPI Section */}
      <section className="py-28 sm:py-36 bg-white relative">
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-primary-50/60 rounded-full blur-3xl translate-y-1/2" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <ScrollReveal direction="left">
              <div className="bg-gradient-to-br from-gray-50 to-primary-50 rounded-3xl p-10 border border-gray-100 max-w-sm mx-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl p-6 text-center shadow-card border border-gray-50">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                      </svg>
                    </div>
                    <div className="font-semibold text-sm text-gray-900">QR #1</div>
                    <div className="text-xs text-gray-400 mt-1">Profile</div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 text-center shadow-card border border-gray-50">
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                      </svg>
                    </div>
                    <div className="font-semibold text-sm text-gray-900">QR #2</div>
                    <div className="text-xs text-gray-400 mt-1">UPI Payment</div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="right">
              <div>
                <p className="text-sm font-semibold text-primary-600 tracking-widest uppercase mb-4">Dual QR</p>
                <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-8 text-gray-900">Dual QR Code System</h2>
                <p className="text-gray-500 mb-10 leading-relaxed text-lg">
                  Every MySmartCard comes with two QR codes on the back, giving your contacts two ways to connect with you.
                </p>
                <div className="space-y-8">
                  <div className="flex items-start gap-5 group">
                    <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">QR #1 - Your Profile</h4>
                      <p className="text-gray-400 text-sm leading-relaxed">Opens your digital profile with all your contact details, social links, and about information.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-5 group">
                    <div className="w-12 h-12 bg-green-50 text-green-700 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-green-500 group-hover:text-white transition-all duration-300">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">QR #2 - UPI Payment</h4>
                      <p className="text-gray-400 text-sm leading-relaxed">Opens a UPI payment request with your UPI ID pre-filled. Anyone can scan and pay you instantly.</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-28 sm:py-36 gradient-mesh relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-50/40 rounded-full blur-3xl" />
        <div className="relative max-w-3xl mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-20">
              <p className="text-sm font-semibold text-primary-600 tracking-widest uppercase mb-4">FAQ</p>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">Frequently Asked Questions</h2>
              <div className="w-20 h-1 bg-gradient-to-r from-primary-400 to-primary-600 mx-auto mt-6 rounded-full" />
            </div>
          </ScrollReveal>
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <ScrollReveal key={f.q} delay={i * 60} direction="up">
                <div className="card">
                  <h3 className="font-semibold text-gray-900 mb-3">{f.q}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.a}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden gradient-hero text-white py-28 sm:py-36">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-20 w-80 h-80 bg-primary-300/20 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <ScrollReveal>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">Ready to Go Digital?</h2>
            <p className="text-white/70 mb-12 text-lg leading-relaxed">Get your MySmartCard today and start sharing your profile with a tap.</p>
            <Link href="/order" className="glass-strong text-gray-900 px-12 py-5 rounded-2xl font-bold text-lg hover:bg-white transition-all duration-300 shadow-glass-lg hover:shadow-glass-xl hover:-translate-y-0.5 inline-block">
              Order Now - Starting ₹999
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* Contact */}
      <section className="py-28 sm:py-36 bg-white relative">
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-100/30 rounded-full blur-3xl translate-y-1/2" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <ScrollReveal>
            <p className="text-sm font-semibold text-primary-600 tracking-widest uppercase mb-4">Get in Touch</p>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-gray-900">Contact Us</h2>
            <p className="text-gray-500 mb-16 text-lg">Have questions? We&apos;re here to help.</p>
          </ScrollReveal>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>, label: 'Email', value: 'support@mysmartcard.net' },
              { icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>, label: 'Phone', value: '+91 98765 43210' },
              { icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>, label: 'WhatsApp', value: '+91 98765 43210' },
            ].map((c, i) => (
              <ScrollReveal key={c.label} delay={i * 100} direction="up">
                <div className="card text-center group py-8">
                  <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 group-hover:bg-primary-100 transition-all duration-300 text-primary-600">
                    {c.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{c.label}</h3>
                  <p className="text-gray-400 text-sm">{c.value}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
