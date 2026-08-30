"use client"
import Link from 'next/link'
import { useState } from 'react'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-luxury-black">
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-6xl z-50 glass-dark-strong rounded-2xl shadow-float px-6 py-3 border border-white/[0.06]">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-lg font-bold tracking-tight">
            <span className="gold-text">MySmartCard</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link href="/cards" className="px-4 py-2 text-sm font-medium text-white/50 hover:text-white hover:bg-white/[0.04] rounded-xl transition-all duration-200">Cards</Link>
            <Link href="/order" className="px-4 py-2 text-sm font-medium text-white/50 hover:text-white hover:bg-white/[0.04] rounded-xl transition-all duration-200">Order Now</Link>
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-white/50 hover:text-white hover:bg-white/[0.04] rounded-xl transition-all duration-200">Login</Link>
            <Link href="/employee/login" className="px-4 py-2 text-sm font-medium text-white/50 hover:text-white hover:bg-white/[0.04] rounded-xl transition-all duration-200">Employee</Link>
            <Link href="/order" className="bg-primary-500 text-black px-5 py-2 rounded-xl text-sm font-bold hover:bg-primary-400 transition-all duration-200 ml-2 shadow-gold">Buy Now</Link>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-xl hover:bg-white/[0.04] transition-colors duration-200">
            <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute top-0 right-0 w-72 h-full glass-dark-strong shadow-float p-6 pt-20 animate-slide-up border-l border-white/[0.06]">
            <div className="space-y-1">
              <Link href="/cards" className="block px-4 py-3 text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.04] rounded-xl transition-all duration-200" onClick={() => setMobileMenuOpen(false)}>Cards</Link>
              <Link href="/order" className="block px-4 py-3 text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.04] rounded-xl transition-all duration-200" onClick={() => setMobileMenuOpen(false)}>Order Now</Link>
              <Link href="/login" className="block px-4 py-3 text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.04] rounded-xl transition-all duration-200" onClick={() => setMobileMenuOpen(false)}>Customer Login</Link>
              <Link href="/register" className="block px-4 py-3 text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.04] rounded-xl transition-all duration-200" onClick={() => setMobileMenuOpen(false)}>Register</Link>
              <Link href="/employee/login" className="block px-4 py-3 text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.04] rounded-xl transition-all duration-200" onClick={() => setMobileMenuOpen(false)}>Employee Login</Link>
              <div className="pt-3">
                <Link href="/order" className="bg-primary-500 text-black w-full block text-center text-sm font-bold py-3 rounded-xl hover:bg-primary-400 transition-all duration-200 shadow-gold" onClick={() => setMobileMenuOpen(false)}>Buy Now</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="pt-24">{children}</main>

      <footer className="bg-luxury-dark border-t border-white/[0.06] py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-lg font-bold tracking-tight gold-text">MySmartCard</p>
          <p className="mt-3 text-sm text-white/30">Tap. Connect. Get Paid.</p>
          <div className="w-16 h-px bg-primary-500/30 mx-auto mt-6 mb-4" />
          <p className="text-xs text-white/20">&copy; {new Date().getFullYear()} MySmartCard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
