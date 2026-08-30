import Link from 'next/link'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const steps = [
  { step: '1', title: 'Choose Your Design', desc: 'Pick from our premium card designs.' },
  { step: '2', title: 'Enter Your Details', desc: 'Add your profile, contact info, and payment details.' },
  { step: '3', title: 'Preview & Pay', desc: 'Review your digital profile and complete payment.' },
  { step: '4', title: 'Receive Your Card', desc: 'Get your NFC card delivered to your doorstep.' },
]

const features = [
  { title: 'Instant Profile Sharing', desc: 'Tap your card and share your complete profile instantly via NFC.', icon: '📡' },
  { title: 'QR Code Access', desc: 'Two QR codes - one for your profile, one for payments.', icon: '📱' },
  { title: 'Receive Payments', desc: 'Get paid directly via UPI when someone scans your payment QR.', icon: '💰' },
  { title: 'Always Updated', desc: 'Edit your profile online - your card always shows the latest info.', icon: '🔄' },
  { title: 'Premium Designs', desc: 'Choose from Premium PVC, Premium Wood, or Premium Metal card designs.', icon: '✨' },
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

export default async function HomePage() {
  let designs: any[] = []
  try {
    designs = await prisma.cardDesign.findMany({ where: { active: true }, orderBy: { price: 'asc' } })
  } catch {}

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero text-white py-32 sm:py-40">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-400/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-8 tracking-tight leading-[1.1]">
            Tap. Connect.<br />Get Paid.
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed">
            Your NFC-powered smart card. Share your profile instantly and receive payments with a simple tap or scan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/order" className="glass-strong text-gray-900 px-10 py-4 rounded-2xl font-semibold text-lg hover:bg-white transition-all duration-300 shadow-glass-lg hover:shadow-glass-xl hover:-translate-y-0.5">
              Buy Your MySmartCard
            </Link>
            <Link href="/cards" className="glass text-white px-10 py-4 rounded-2xl font-semibold text-lg hover:bg-white/20 transition-all duration-300 hover:-translate-y-0.5">
              View Card Designs
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 sm:py-32 gradient-mesh relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100/40 rounded-full blur-3xl -translate-y-1/2" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary-600 tracking-wide uppercase mb-3">Simple Process</p>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">How It Works</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {steps.map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 bg-primary-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-5 shadow-apple">{s.step}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How NFC Works */}
      <section className="py-24 sm:py-32 bg-gray-50/80 relative">
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-50/60 rounded-full blur-3xl translate-y-1/2" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-semibold text-primary-600 tracking-wide uppercase mb-3">Technology</p>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-8">How NFC Technology Works</h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                NFC (Near Field Communication) is a wireless technology that allows two devices to communicate when they are within 4 cm of each other.
                Your MySmartCard contains a tiny NFC chip that stores a web URL.
              </p>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center text-sm font-bold shrink-0">1</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Tap Your Card</h4>
                    <p className="text-gray-500 text-sm mt-1 leading-relaxed">Simply tap your MySmartCard on the back of any NFC-enabled smartphone.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center text-sm font-bold shrink-0">2</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Profile Opens Instantly</h4>
                    <p className="text-gray-500 text-sm mt-1 leading-relaxed">The phone reads the URL from the chip and opens your digital profile page.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center text-sm font-bold shrink-0">3</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Connect & Share</h4>
                    <p className="text-gray-500 text-sm mt-1 leading-relaxed">Your contacts can save your details, connect on social media, or pay you via UPI.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="glass-strong rounded-3xl p-10 shadow-apple-lg">
              <div className="glass rounded-2xl p-8 max-w-xs mx-auto text-center">
                <div className="w-20 h-20 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
                  </svg>
                </div>
                <div className="font-bold text-lg text-gray-900 mb-2">NFC Enabled</div>
                <p className="text-gray-500 text-sm leading-relaxed">Works with iPhone 7+ and most Android phones from 2012 onwards</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 sm:py-32 gradient-mesh relative">
        <div className="absolute top-20 left-0 w-72 h-72 bg-primary-100/30 rounded-full blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary-600 tracking-wide uppercase mb-3">Capabilities</p>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">Features</h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card text-center group">
                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QR + UPI Section */}
      <section className="py-24 sm:py-32 bg-gray-50/80 relative">
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-primary-50/60 rounded-full blur-3xl translate-y-1/2" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="glass-strong rounded-3xl p-10 shadow-apple-lg max-w-sm mx-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="glass rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                    </svg>
                  </div>
                  <div className="font-semibold text-sm text-gray-900">QR #1</div>
                  <div className="text-xs text-gray-500 mt-1">Profile</div>
                </div>
                <div className="glass rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                    </svg>
                  </div>
                  <div className="font-semibold text-sm text-gray-900">QR #2</div>
                  <div className="text-xs text-gray-500 mt-1">UPI Payment</div>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-primary-600 tracking-wide uppercase mb-3">Dual QR</p>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-8">Dual QR Code System</h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Every MySmartCard comes with two QR codes on the back, giving your contacts two ways to connect with you.
              </p>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">QR #1 - Your Profile</h4>
                    <p className="text-gray-500 text-sm mt-1 leading-relaxed">Opens your digital profile with all your contact details, social links, and about information.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-50 text-green-700 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">QR #2 - UPI Payment</h4>
                    <p className="text-gray-500 text-sm mt-1 leading-relaxed">Opens a UPI payment request with your UPI ID pre-filled. Anyone can scan and pay you instantly.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Card Designs */}
      <section className="py-24 sm:py-32 gradient-mesh relative">
        <div className="absolute top-10 right-10 w-80 h-80 bg-primary-100/30 rounded-full blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary-600 tracking-wide uppercase mb-3">Collection</p>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">Card Designs</h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {designs.map((p, i) => (
              <div key={p.id} className={`card text-center ${i === 1 ? 'ring-2 ring-primary-500/40 relative' : ''}`}>
                {i === 1 && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-xs font-semibold shadow-apple">Popular</span>}
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{p.name}</h3>
                <div className="text-4xl font-bold text-gray-900 mb-6">₹{p.price}</div>
                <ul className="text-sm text-gray-500 space-y-3 mb-8">
                  {['NFC Enabled', 'Profile QR', 'Payment QR', 'Digital Profile'].map((f) => (
                    <li key={f} className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 text-primary-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={`/order?design=${p.id}`} className="btn-primary w-full block text-center">Order Now</Link>
              </div>
            ))}
            {designs.length === 0 && (
              <>
                {[{ name: 'Premium PVC', price: 999 }, { name: 'Premium Wood', price: 1499, popular: true }, { name: 'Premium Metal', price: 2499 }].map((p) => (
                  <div key={p.name} className={`card text-center ${(p as any).popular ? 'ring-2 ring-primary-500/40 relative' : ''}`}>
                    {(p as any).popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-xs font-semibold shadow-apple">Popular</span>}
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">{p.name}</h3>
                    <div className="text-4xl font-bold text-gray-900 mb-6">₹{p.price}</div>
                    <ul className="text-sm text-gray-500 space-y-3 mb-8">
                      {['NFC Enabled', 'Profile QR', 'Payment QR', 'Digital Profile'].map((f) => (
                        <li key={f} className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4 text-primary-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link href="/order" className="btn-primary w-full block text-center">Order Now</Link>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 sm:py-32 bg-gray-50/80 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-50/40 rounded-full blur-3xl" />
        <div className="relative max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary-600 tracking-wide uppercase mb-3">FAQ</p>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((f) => (
              <div key={f.q} className="card">
                <h3 className="font-semibold text-gray-900 mb-3">{f.q}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden gradient-hero text-white py-24 sm:py-32">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-20 w-80 h-80 bg-primary-300/20 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">Ready to Go Digital?</h2>
          <p className="text-white/70 mb-10 text-lg leading-relaxed">Get your MySmartCard today and start sharing your profile with a tap.</p>
          <Link href="/order" className="glass-strong text-gray-900 px-10 py-4 rounded-2xl font-semibold text-lg hover:bg-white transition-all duration-300 shadow-glass-lg hover:shadow-glass-xl hover:-translate-y-0.5 inline-block">
            Order Now - Starting ₹999
          </Link>
        </div>
      </section>

      {/* Contact */}
      <section className="py-24 sm:py-32 gradient-mesh relative">
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-100/30 rounded-full blur-3xl translate-y-1/2" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <p className="text-sm font-semibold text-primary-600 tracking-wide uppercase mb-3">Get in Touch</p>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">Contact Us</h2>
          <p className="text-gray-500 mb-12 text-lg">Have questions? We&apos;re here to help.</p>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="card text-center group">
              <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">Email</h3>
              <p className="text-gray-500 text-sm mt-1">support@mysmartcard.net</p>
            </div>
            <div className="card text-center group">
              <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">Phone</h3>
              <p className="text-gray-500 text-sm mt-1">+91 98765 43210</p>
            </div>
            <div className="card text-center group">
              <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">WhatsApp</h3>
              <p className="text-gray-500 text-sm mt-1">+91 98765 43210</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
