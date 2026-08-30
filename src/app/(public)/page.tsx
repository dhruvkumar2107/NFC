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
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-gray-50 via-white to-gray-50 pt-8 pb-16">
        {/* Ambient glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary-200/15 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-purple-200/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-blue-100/10 rounded-full blur-[100px]" />
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

                {/* Frosted bottom edge */}
                <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-white/70 via-white/20 to-transparent pointer-events-none" />
                {/* Frosted top edge */}
                <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />

                {/* Buy Now - desktop */}
                <div className="absolute bottom-8 right-8 z-20 hidden sm:block">
                  <Link href="/order" className="btn-primary text-base px-8 py-3.5 shadow-lg shadow-primary-600/30 hover:shadow-xl hover:shadow-primary-600/40 inline-flex items-center gap-2">
                    Buy Now
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                </div>

                {/* Buy Now - mobile */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 sm:hidden">
                  <Link href="/order" className="btn-primary text-sm px-8 py-3 shadow-lg shadow-primary-600/30 inline-flex items-center gap-2">
                    Buy Now
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Outer glow ring on hover */}
              <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-r from-primary-200/20 via-purple-200/10 to-primary-200/20 blur-sm -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              {/* Reflection */}
              <div className="absolute -bottom-3 left-[10%] right-[10%] h-6 bg-primary-300/10 rounded-full blur-lg" />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-8 bg-gradient-to-b from-white to-gray-50/50">
        <div className="max-w-5xl mx-auto px-6">
          <ScrollReveal delay={200}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="py-4 text-center rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 hover:bg-white/80 transition-all duration-300">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{s.value}</div>
                  <div className="text-xs text-gray-400 font-medium tracking-wider uppercase">{s.label}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
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
