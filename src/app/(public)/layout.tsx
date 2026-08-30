"use client"
import Link from 'next/link'
import { useState } from 'react'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Premium floating navbar */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-6xl z-50 rounded-2xl px-6 py-3 transition-all duration-300"
        style={{
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(24px) saturate(200%)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%)',
          border: '1px solid rgba(255,255,255,0.6)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02), 0 4px 16px -4px rgba(0,0,0,0.06), 0 8px 32px -8px rgba(0,0,0,0.04)',
        }}
      >
        <div className="flex justify-between items-center">
          <Link href="/" className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
              </svg>
            </div>
            MySmartCard
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link href="/cards" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 rounded-xl transition-all duration-200">Cards</Link>
            <Link href="/order" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 rounded-xl transition-all duration-200">Order Now</Link>
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 rounded-xl transition-all duration-200">Login</Link>
            <Link href="/employee/login" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 rounded-xl transition-all duration-200">Employee</Link>
            <Link href="/order" className="btn-primary text-sm ml-2">Buy Now</Link>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-xl hover:bg-gray-100/60 transition-colors duration-200">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute top-0 right-0 w-72 h-full p-6 pt-20 animate-slide-up"
            style={{
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(40px) saturate(200%)',
              WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              borderLeft: '1px solid rgba(255,255,255,0.5)',
              boxShadow: '-8px 0 32px rgba(0,0,0,0.08)',
            }}
          >
            <div className="space-y-1">
              <Link href="/cards" className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100/60 rounded-xl transition-all duration-200" onClick={() => setMobileMenuOpen(false)}>Cards</Link>
              <Link href="/order" className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100/60 rounded-xl transition-all duration-200" onClick={() => setMobileMenuOpen(false)}>Order Now</Link>
              <Link href="/login" className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100/60 rounded-xl transition-all duration-200" onClick={() => setMobileMenuOpen(false)}>Customer Login</Link>
              <Link href="/register" className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100/60 rounded-xl transition-all duration-200" onClick={() => setMobileMenuOpen(false)}>Register</Link>
              <Link href="/employee/login" className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100/60 rounded-xl transition-all duration-200" onClick={() => setMobileMenuOpen(false)}>Employee Login</Link>
              <div className="pt-3">
                <Link href="/order" className="btn-primary w-full block text-center text-sm" onClick={() => setMobileMenuOpen(false)}>Buy Now</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="pt-24">{children}</main>

      {/* Premium Footer */}
      <footer className="relative mt-20 overflow-hidden">
        <div className="absolute inset-0 bg-gray-900" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 0.5px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="relative max-w-6xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-primary-600/20 border border-primary-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white/90 tracking-tight">MySmartCard</span>
          </div>
          <p className="text-sm text-gray-400 mb-8">Smart Connection, Strong Impression</p>
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mx-auto mb-8" />
          <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} MySmartCard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
