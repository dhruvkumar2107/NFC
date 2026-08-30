"use client"
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isLoginPage = pathname === '/employee/login'

  useEffect(() => {
    if (isLoginPage) {
      setMounted(true)
      return
    }
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    if (!token || role !== 'employee') {
      router.push('/employee/login')
      return
    }
    setMounted(true)
  }, [router, isLoginPage])

  if (!mounted) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  if (isLoginPage) return <>{children}</>

  const nav = [
    { href: '/employee/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/employee/customers', label: 'My Customers', icon: '👥' },
    { href: '/employee/orders', label: 'My Orders', icon: '📦' },
    { href: '/employee/new-order', label: 'New Order', icon: '➕' },
    { href: '/employee/reports', label: 'Reports', icon: '📈' },
    { href: '/employee/wallet', label: 'My Wallet', icon: '💰' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <aside className="w-64 bg-gray-900 text-white min-h-screen p-4 hidden md:block">
          <Link href="/employee/dashboard" className="text-lg font-bold text-primary-400 block mb-8">
            MySmartCard
          </Link>
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-3 px-3">Sales Executive</div>
          <nav className="space-y-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  pathname === item.href
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-8 pt-8 border-t border-gray-800">
            <button
              onClick={() => { localStorage.clear(); router.push('/employee/login') }}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 w-full"
            >
              <span>🚪</span> Logout
            </button>
          </div>
        </aside>
        <main className="flex-1 p-4 md:p-8">
          <div className="md:hidden flex items-center justify-between mb-6">
            <Link href="/employee/dashboard" className="text-lg font-bold text-primary-600">MySmartCard</Link>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg hover:bg-gray-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden mb-6 bg-white rounded-lg border border-gray-200 overflow-hidden">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 ${
                    pathname === item.href ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
              <button
                onClick={() => { localStorage.clear(); router.push('/employee/login') }}
                className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 w-full"
              >
                <span>🚪</span> Logout
              </button>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}
