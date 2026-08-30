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
  { title: 'Premium Designs', desc: 'Choose from Premium PVC, Black Matte, or Metal card designs.', icon: '✨' },
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
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            Tap. Connect. Get Paid.
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-primary-100 mb-8 max-w-2xl mx-auto">
            MySmartCard is your NFC-powered smart card. Share your profile instantly and receive payments with a simple tap or scan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/order" className="bg-white text-primary-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-primary-50 transition-colors">
              Buy Your MySmartCard
            </Link>
            <Link href="/cards" className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/10 transition-colors">
              View Card Designs
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {steps.map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">{s.step}</div>
                <h3 className="font-semibold mb-2">{s.title}</h3>
                <p className="text-gray-600 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How NFC Works */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">How NFC Technology Works</h2>
              <p className="text-gray-600 mb-4">
                NFC (Near Field Communication) is a wireless technology that allows two devices to communicate when they are within 4 cm of each other.
                Your MySmartCard contains a tiny NFC chip that stores a web URL.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">1️⃣</span>
                  <div>
                    <h4 className="font-semibold">Tap Your Card</h4>
                    <p className="text-gray-600 text-sm">Simply tap your MySmartCard on the back of any NFC-enabled smartphone.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">2️⃣</span>
                  <div>
                    <h4 className="font-semibold">Profile Opens Instantly</h4>
                    <p className="text-gray-600 text-sm">The phone reads the URL from the chip and opens your digital profile page.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">3️⃣</span>
                  <div>
                    <h4 className="font-semibold">Connect & Share</h4>
                    <p className="text-gray-600 text-sm">Your contacts can save your details, connect on social media, or pay you via UPI.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-8 text-center">
              <div className="bg-white rounded-xl shadow-lg p-6 max-w-xs mx-auto">
                <div className="text-6xl mb-4">📡</div>
                <div className="font-bold text-lg mb-2">NFC Enabled</div>
                <p className="text-gray-600 text-sm">Works with iPhone 7+ and most Android phones from 2012 onwards</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {features.map((f) => (
              <div key={f.title} className="card text-center">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QR + UPI Section */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm mx-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary-50 rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">📋</div>
                  <div className="font-semibold text-sm">QR #1</div>
                  <div className="text-xs text-gray-500">Profile</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">💳</div>
                  <div className="font-semibold text-sm">QR #2</div>
                  <div className="text-xs text-gray-500">UPI Payment</div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-6">Dual QR Code System</h2>
              <p className="text-gray-600 mb-6">
                Every MySmartCard comes with two QR codes on the back, giving your contacts two ways to connect with you.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📋</span>
                  <div>
                    <h4 className="font-semibold">QR #1 - Your Profile</h4>
                    <p className="text-gray-600 text-sm">Opens your digital profile with all your contact details, social links, and about information.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💳</span>
                  <div>
                    <h4 className="font-semibold">QR #2 - UPI Payment</h4>
                    <p className="text-gray-600 text-sm">Opens a UPI payment request with your UPI ID pre-filled. Anyone can scan and pay you instantly.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Card Designs */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Card Designs</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {designs.map((p, i) => (
              <div key={p.id} className={`card text-center ${i === 1 ? 'ring-2 ring-primary-600 relative' : ''}`}>
                {i === 1 && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-semibold">Popular</span>}
                <h3 className="font-semibold text-lg mb-2">{p.name}</h3>
                <div className="text-3xl font-bold mb-4">₹{p.price}</div>
                <ul className="text-sm text-gray-600 space-y-2 mb-6">
                  {['NFC Enabled', 'Profile QR', 'Payment QR', 'Digital Profile'].map((f) => <li key={f}>✓ {f}</li>)}
                </ul>
                <Link href={`/order?design=${p.id}`} className="btn-primary w-full block text-center">Order Now</Link>
              </div>
            ))}
            {designs.length === 0 && (
              <>
                {[{ name: 'Premium PVC', price: 999 }, { name: 'Black Matte', price: 1499, popular: true }, { name: 'Metal', price: 2499 }].map((p) => (
                  <div key={p.name} className={`card text-center ${(p as any).popular ? 'ring-2 ring-primary-600 relative' : ''}`}>
                    <h3 className="font-semibold text-lg mb-2">{p.name}</h3>
                    <div className="text-3xl font-bold mb-4">₹{p.price}</div>
                    <ul className="text-sm text-gray-600 space-y-2 mb-6">
                      {['NFC Enabled', 'Profile QR', 'Payment QR', 'Digital Profile'].map((f) => <li key={f}>✓ {f}</li>)}
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
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <div key={f.q} className="card">
                <h3 className="font-semibold mb-2">{f.q}</h3>
                <p className="text-gray-600 text-sm">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-primary-600 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to Go Digital?</h2>
          <p className="text-primary-100 mb-8">Get your MySmartCard today and start sharing your profile with a tap.</p>
          <Link href="/order" className="bg-white text-primary-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-primary-50 transition-colors inline-block">
            Order Now - Starting ₹999
          </Link>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
          <p className="text-gray-600 mb-8">Have questions? We&apos;re here to help.</p>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="card text-center">
              <div className="text-2xl mb-2">📧</div>
              <h3 className="font-semibold text-sm">Email</h3>
              <p className="text-gray-600 text-sm">support@mysmartcard.net</p>
            </div>
            <div className="card text-center">
              <div className="text-2xl mb-2">📱</div>
              <h3 className="font-semibold text-sm">Phone</h3>
              <p className="text-gray-600 text-sm">+91 98765 43210</p>
            </div>
            <div className="card text-center">
              <div className="text-2xl mb-2">💬</div>
              <h3 className="font-semibold text-sm">WhatsApp</h3>
              <p className="text-gray-600 text-sm">+91 98765 43210</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
