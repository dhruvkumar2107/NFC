"use client"
import Link from 'next/link'
import { useState } from 'react'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50/50">
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-6xl z-50 glass-strong rounded-2xl shadow-apple px-6 py-3">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-lg font-bold text-primary-700 tracking-tight">
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
          <div className="absolute top-0 right-0 w-72 h-full glass-strong shadow-float p-6 pt-20 animate-slide-up">
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

      <footer className="glass-dark text-gray-300 py-16 mt-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-lg font-semibold text-white/90 tracking-tight">MySmartCard</p>
          <p className="mt-3 text-sm text-gray-400">Tap. Connect. Get Paid.</p>
          <p className="mt-6 text-xs text-gray-500">&copy; {new Date().getFullYear()} MySmartCard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
