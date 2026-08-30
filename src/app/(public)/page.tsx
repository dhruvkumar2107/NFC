import Link from 'next/link'
import { prisma } from '@/lib/db'
import ScrollReveal from './ScrollReveal'
import LuxuryParticles from './LuxuryParticles'

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
    <div className="bg-luxury-black">
      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero text-white py-28 sm:py-36 min-h-[90vh] flex items-center">
        <LuxuryParticles />

        {/* Rotating ring decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] opacity-[0.04] animate-rotate-slow pointer-events-none">
          <div className="w-full h-full rounded-full border border-primary-500/30" />
          <div className="absolute inset-8 rounded-full border border-primary-500/20" />
          <div className="absolute inset-16 rounded-full border border-primary-500/10" />
        </div>

        {/* Glowing orbs */}
        <div className="absolute top-20 left-10 w-80 h-80 bg-primary-500/10 rounded-full blur-[120px] animate-glow-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-400/8 rounded-full blur-[150px] animate-glow-pulse" style={{ animationDelay: '1.5s' }} />

        <div className="relative max-w-6xl mx-auto px-6 w-full">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="text-center md:text-left">
              <ScrollReveal delay={0} direction="up">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary-500/20 bg-primary-500/5 mb-8">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                  <span className="text-xs font-medium text-primary-400 tracking-wider uppercase">NFC Smart Card</span>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={100} direction="up">
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 tracking-tight leading-[1.05]">
                  <span className="text-white">Tap.</span>{' '}
                  <span className="gold-text">Connect.</span><br />
                  <span className="text-white">Get Paid.</span>
                </h1>
              </ScrollReveal>

              <ScrollReveal delay={200} direction="up">
                <p className="text-lg sm:text-xl text-white/50 mb-10 max-w-lg leading-relaxed">
                  Your NFC-powered smart card. Share your profile instantly and receive payments with a simple tap or scan.
                </p>
              </ScrollReveal>

              <ScrollReveal delay={300} direction="up">
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <Link href="/order" className="group relative overflow-hidden bg-primary-500 text-black px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-500 hover:shadow-gold-lg hover:-translate-y-0.5 text-center">
                    <span className="relative z-10">Buy Your MySmartCard</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-300 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </Link>
                  <Link href="/cards" className="px-10 py-4 rounded-2xl font-semibold text-lg border border-white/10 text-white/70 hover:text-white hover:border-primary-500/30 hover:bg-primary-500/5 transition-all duration-500 text-center">
                    View Card Designs
                  </Link>
                </div>
              </ScrollReveal>
            </div>

            <div className="hidden md:flex justify-center items-center relative">
              <ScrollReveal delay={200} direction="scale">
                <div className="relative">
                  {/* Gold glow behind cards */}
                  <div className="absolute -inset-10 bg-primary-500/10 rounded-full blur-[80px] animate-glow-pulse" />

                  <div className="relative flex gap-4">
                    <img
                      src="/photos/h1.jpeg"
                      alt="MySmartCard Premium Metal"
                      className="w-64 rounded-2xl shadow-float animate-float"
                      style={{ animationDelay: '0s' }}
                    />
                    <img
                      src="/photos/h2.jpeg"
                      alt="MySmartCard Premium PVC"
                      className="w-64 rounded-2xl shadow-float animate-float-reverse"
                      style={{ animationDelay: '0.5s' }}
                    />
                  </div>

                  {/* Floating badge */}
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-luxury-charcoal/90 backdrop-blur-xl border border-primary-500/20 px-6 py-2.5 rounded-full animate-float" style={{ animationDelay: '1s' }}>
                    <span className="text-sm font-semibold gold-text">NFC Enabled</span>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-luxury-black to-transparent" />
      </section>

      {/* Stats Bar */}
      <section className="relative -mt-16 z-10">
        <div className="max-w-5xl mx-auto px-6">
          <ScrollReveal direction="up">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="card-dark text-center py-6 px-4">
                  <div className="text-3xl font-bold gold-text mb-1">{s.value}</div>
                  <div className="text-xs text-white/40 font-medium tracking-wider uppercase">{s.label}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-28 sm:py-36 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-[120px]" />
        <div className="relative max-w-6xl mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-20">
              <p className="text-sm font-semibold text-primary-500 tracking-widest uppercase mb-4">Simple Process</p>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">How It Works</h2>
              <div className="w-20 h-0.5 gradient-gold mx-auto mt-6 rounded-full" />
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <ScrollReveal key={s.step} delay={i * 100} direction="up">
                <div className="text-center group">
                  <div className="relative inline-block mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-luxury-charcoal border border-primary-500/20 flex items-center justify-center text-xl font-bold gold-text group-hover:border-primary-500/40 group-hover:shadow-gold transition-all duration-500">
                      {s.step}
                    </div>
                    {i < steps.length - 1 && (
                      <div className="hidden md:block absolute top-1/2 left-full w-full h-px bg-gradient-to-r from-primary-500/30 to-transparent -translate-y-1/2" />
                    )}
                  </div>
                  <h3 className="font-semibold text-white mb-2 text-lg">{s.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* How NFC Works */}
      <section className="py-28 sm:py-36 bg-luxury-dark relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-500/5 rounded-full blur-[120px]" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <ScrollReveal direction="left">
              <div>
                <p className="text-sm font-semibold text-primary-500 tracking-widest uppercase mb-4">Technology</p>
                <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-8 text-white">How NFC Works</h2>
                <p className="text-white/40 mb-10 leading-relaxed text-lg">
                  NFC (Near Field Communication) is a wireless technology that allows two devices to communicate when they are within 4 cm of each other.
                  Your MySmartCard contains a tiny NFC chip that stores a web URL.
                </p>
                <div className="space-y-8">
                  {[
                    { num: '01', title: 'Tap Your Card', desc: 'Simply tap your MySmartCard on the back of any NFC-enabled smartphone.' },
                    { num: '02', title: 'Profile Opens Instantly', desc: 'The phone reads the URL from the chip and opens your digital profile page.' },
                    { num: '03', title: 'Connect & Share', desc: 'Your contacts can save your details, connect on social media, or pay you via UPI.' },
                  ].map((item, i) => (
                    <div key={item.num} className="flex items-start gap-5 group">
                      <div className="w-12 h-12 rounded-xl bg-luxury-charcoal border border-primary-500/20 flex items-center justify-center text-sm font-bold gold-text group-hover:border-primary-500/40 group-hover:shadow-gold transition-all duration-500 shrink-0">
                        {item.num}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                        <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right">
              <div className="relative">
                <div className="absolute -inset-10 bg-primary-500/5 rounded-full blur-[80px]" />
                <div className="card-dark rounded-3xl p-10 relative">
                  <div className="bg-luxury-charcoal rounded-2xl p-8 max-w-xs mx-auto text-center gold-border">
                    <div className="w-20 h-20 bg-luxury-gray rounded-2xl flex items-center justify-center mx-auto mb-6 gold-border">
                      <svg className="w-10 h-10 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
                      </svg>
                    </div>
                    <div className="font-bold text-lg text-white mb-2">NFC Enabled</div>
                    <p className="text-white/40 text-sm leading-relaxed">Works with iPhone 7+ and most Android phones from 2012 onwards</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-28 sm:py-36 relative overflow-hidden">
        <div className="absolute top-20 left-0 w-72 h-72 bg-primary-500/5 rounded-full blur-[120px]" />
        <div className="relative max-w-6xl mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-20">
              <p className="text-sm font-semibold text-primary-500 tracking-widest uppercase mb-4">Capabilities</p>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">Features</h2>
              <div className="w-20 h-0.5 gradient-gold mx-auto mt-6 rounded-full" />
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 80} direction="up">
                <div className="card-dark text-center group hover:border-primary-500/30 transition-all duration-500">
                  <div className="w-16 h-16 bg-luxury-charcoal rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 group-hover:scale-110 group-hover:shadow-gold transition-all duration-500 border border-primary-500/10">
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-white mb-2 text-lg">{f.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* QR + UPI Section */}
      <section className="py-28 sm:py-36 bg-luxury-dark relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-primary-500/5 rounded-full blur-[120px]" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <ScrollReveal direction="left">
              <div className="relative">
                <div className="absolute -inset-8 bg-primary-500/5 rounded-3xl blur-[60px]" />
                <div className="card-dark rounded-3xl p-10 relative gold-border max-w-sm mx-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-luxury-charcoal rounded-2xl p-6 text-center gold-border">
                      <div className="w-12 h-12 bg-luxury-gray rounded-xl flex items-center justify-center mx-auto mb-3 border border-primary-500/10">
                        <svg className="w-6 h-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                        </svg>
                      </div>
                      <div className="font-semibold text-sm text-white">QR #1</div>
                      <div className="text-xs text-white/30 mt-1">Profile</div>
                    </div>
                    <div className="bg-luxury-charcoal rounded-2xl p-6 text-center gold-border">
                      <div className="w-12 h-12 bg-luxury-gray rounded-xl flex items-center justify-center mx-auto mb-3 border border-primary-500/10">
                        <svg className="w-6 h-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                        </svg>
                      </div>
                      <div className="font-semibold text-sm text-white">QR #2</div>
                      <div className="text-xs text-white/30 mt-1">UPI Payment</div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right">
              <div>
                <p className="text-sm font-semibold text-primary-500 tracking-widest uppercase mb-4">Dual QR</p>
                <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-8 text-white">Dual QR Code System</h2>
                <p className="text-white/40 mb-10 leading-relaxed text-lg">
                  Every MySmartCard comes with two QR codes on the back, giving your contacts two ways to connect with you.
                </p>
                <div className="space-y-8">
                  <div className="flex items-start gap-5 group">
                    <div className="w-12 h-12 rounded-xl bg-luxury-charcoal border border-primary-500/20 flex items-center justify-center shrink-0 group-hover:border-primary-500/40 transition-all duration-500">
                      <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">QR #1 - Your Profile</h4>
                      <p className="text-white/40 text-sm leading-relaxed">Opens your digital profile with all your contact details, social links, and about information.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-5 group">
                    <div className="w-12 h-12 rounded-xl bg-luxury-charcoal border border-primary-500/20 flex items-center justify-center shrink-0 group-hover:border-primary-500/40 transition-all duration-500">
                      <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">QR #2 - UPI Payment</h4>
                      <p className="text-white/40 text-sm leading-relaxed">Opens a UPI payment request with your UPI ID pre-filled. Anyone can scan and pay you instantly.</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Card Designs */}
      <section className="py-28 sm:py-36 relative overflow-hidden">
        <div className="absolute top-10 right-10 w-80 h-80 bg-primary-500/5 rounded-full blur-[120px]" />
        <div className="relative max-w-6xl mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-20">
              <p className="text-sm font-semibold text-primary-500 tracking-widest uppercase mb-4">Collection</p>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">Card Designs</h2>
              <div className="w-20 h-0.5 gradient-gold mx-auto mt-6 rounded-full" />
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {designs.map((p, i) => (
              <ScrollReveal key={p.id} delay={i * 100} direction="up">
                <div className={`card-dark text-center group hover:border-primary-500/30 transition-all duration-500 ${i === 1 ? 'ring-1 ring-primary-500/30 relative' : ''}`}>
                  {i === 1 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <span className="bg-primary-500 text-black px-5 py-1 rounded-full text-xs font-bold tracking-wider shadow-gold">
                        POPULAR
                      </span>
                    </div>
                  )}

                  {p.imageUrl && (
                    <div className="h-48 rounded-2xl mb-6 overflow-hidden bg-luxury-charcoal border border-white/5 group-hover:border-primary-500/20 transition-all duration-500">
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    </div>
                  )}

                  <h3 className="font-semibold text-lg text-white mb-2">{p.name}</h3>
                  <div className="text-4xl font-bold gold-text mb-6">₹{p.price}</div>
                  <ul className="text-sm text-white/40 space-y-3 mb-8">
                    {['NFC Enabled', 'Profile QR', 'Payment QR', 'Digital Profile'].map((f) => (
                      <li key={f} className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 text-primary-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href={`/order?design=${p.id}`} className="block w-full py-3.5 rounded-2xl font-bold text-center bg-primary-500 text-black hover:bg-primary-400 transition-all duration-300 shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5">
                    Order Now
                  </Link>
                </div>
              </ScrollReveal>
            ))}

            {designs.length === 0 && (
              <>
                {[{ name: 'Premium PVC Card', price: 999 }, { name: 'Premium Wood', price: 1499, popular: true }, { name: 'Premium Metal', price: 2499 }].map((p, i) => (
                  <ScrollReveal key={p.name} delay={i * 100} direction="up">
                    <div className={`card-dark text-center ${(p as any).popular ? 'ring-1 ring-primary-500/30 relative' : ''}`}>
                      {(p as any).popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                          <span className="bg-primary-500 text-black px-5 py-1 rounded-full text-xs font-bold tracking-wider shadow-gold">POPULAR</span>
                        </div>
                      )}
                      <h3 className="font-semibold text-lg text-white mb-2">{p.name}</h3>
                      <div className="text-4xl font-bold gold-text mb-6">₹{p.price}</div>
                      <ul className="text-sm text-white/40 space-y-3 mb-8">
                        {['NFC Enabled', 'Profile QR', 'Payment QR', 'Digital Profile'].map((f) => (
                          <li key={f} className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4 text-primary-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                            {f}
                          </li>
                        ))}
                      </ul>
                      <Link href="/order" className="block w-full py-3.5 rounded-2xl font-bold text-center bg-primary-500 text-black hover:bg-primary-400 transition-all duration-300 shadow-gold hover:shadow-gold-lg">Order Now</Link>
                    </div>
                  </ScrollReveal>
                ))}
              </>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-28 sm:py-36 bg-luxury-dark relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-500/5 rounded-full blur-[120px]" />
        <div className="relative max-w-3xl mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-20">
              <p className="text-sm font-semibold text-primary-500 tracking-widest uppercase mb-4">FAQ</p>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">Frequently Asked Questions</h2>
              <div className="w-20 h-0.5 gradient-gold mx-auto mt-6 rounded-full" />
            </div>
          </ScrollReveal>

          <div className="space-y-4">
            {faqs.map((f, i) => (
              <ScrollReveal key={f.q} delay={i * 60} direction="up">
                <div className="card-dark hover:border-primary-500/20 transition-all duration-300">
                  <h3 className="font-semibold text-white mb-3">{f.q}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{f.a}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden gradient-hero text-white py-28 sm:py-36">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-20 w-72 h-72 bg-primary-500/10 rounded-full blur-[120px] animate-glow-pulse" />
          <div className="absolute bottom-10 left-20 w-80 h-80 bg-primary-400/8 rounded-full blur-[120px] animate-glow-pulse" style={{ animationDelay: '1.5s' }} />
        </div>

        {/* Decorative rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-[0.03] animate-rotate-slow pointer-events-none">
          <div className="w-full h-full rounded-full border border-primary-500/40" />
          <div className="absolute inset-12 rounded-full border border-primary-500/30" />
        </div>

        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <ScrollReveal>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
              Ready to Go <span className="gold-text">Digital?</span>
            </h2>
            <p className="text-white/40 mb-12 text-lg leading-relaxed max-w-xl mx-auto">
              Get your MySmartCard today and start sharing your profile with a tap.
            </p>
            <Link href="/order" className="inline-block bg-primary-500 text-black px-12 py-5 rounded-2xl font-bold text-lg hover:bg-primary-400 transition-all duration-500 shadow-gold-lg hover:shadow-gold hover:-translate-y-1">
              Order Now - Starting ₹999
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* Contact */}
      <section className="py-28 sm:py-36 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-500/5 rounded-full blur-[120px]" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <ScrollReveal>
            <p className="text-sm font-semibold text-primary-500 tracking-widest uppercase mb-4">Get in Touch</p>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-white">Contact Us</h2>
            <p className="text-white/40 mb-16 text-lg">Have questions? We&apos;re here to help.</p>
          </ScrollReveal>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>, label: 'Email', value: 'support@mysmartcard.net' },
              { icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>, label: 'Phone', value: '+91 98765 43210' },
              { icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>, label: 'WhatsApp', value: '+91 98765 43210' },
            ].map((c, i) => (
              <ScrollReveal key={c.label} delay={i * 100} direction="up">
                <div className="card-dark text-center group hover:border-primary-500/30 transition-all duration-500 py-8">
                  <div className="w-16 h-16 bg-luxury-charcoal rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 group-hover:shadow-gold transition-all duration-500 gold-border text-primary-500">
                    {c.icon}
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-1">{c.label}</h3>
                  <p className="text-white/40 text-sm">{c.value}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
