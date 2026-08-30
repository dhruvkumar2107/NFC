"use client"
import Link from 'next/link'
import { useState } from 'react'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-bold text-primary-600">
              MySmartCard
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/cards" className="text-gray-600 hover:text-gray-900">Cards</Link>
              <Link href="/order" className="text-gray-600 hover:text-gray-900">Order Now</Link>
              <Link href="/login" className="text-gray-600 hover:text-gray-900">Login</Link>
              <Link href="/employee/login" className="text-gray-600 hover:text-gray-900">Employee</Link>
              <Link href="/admin/login" className="text-gray-600 hover:text-gray-900">Admin</Link>
              <Link href="/order" className="btn-primary">Buy Now</Link>
            </div>

            {/* Mobile hamburger */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-100 py-4 space-y-2">
              <Link href="/cards" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Cards</Link>
              <Link href="/order" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Order Now</Link>
              <Link href="/login" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Customer Login</Link>
              <Link href="/register" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Register</Link>
              <Link href="/employee/login" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Employee Login</Link>
              <Link href="/admin/login" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Admin Login</Link>
              <div className="px-4 pt-2">
                <Link href="/order" className="btn-primary w-full block text-center" onClick={() => setMobileMenuOpen(false)}>Buy Now</Link>
              </div>
            </div>
          )}
        </div>
      </nav>
      <main>{children}</main>
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} MySmartCard. All rights reserved.</p>
          <p className="mt-2 text-sm">Tap. Connect. Get Paid.</p>
        </div>
      </footer>
    </div>
  )
}
