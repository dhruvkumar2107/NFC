"use client"
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isLoginPage = pathname === '/login' || pathname === '/register'

  useEffect(() => {
    if (isLoginPage) { setMounted(true); return }
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    if (!token || role !== 'customer') { router.push('/login'); return }
    setMounted(true)
  }, [router, isLoginPage])

  if (!mounted) return <div className="min-h-screen flex items-center justify-center bg-gray-50/80"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
  if (isLoginPage) return <>{children}</>

  const nav = [
    { href: '/dashboard', label: 'Dashboard', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg> },
    { href: '/dashboard/profile', label: 'Edit Profile', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg> },
    { href: '/dashboard/card', label: 'My Card', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg> },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/80">
      <aside className="fixed inset-y-0 left-0 w-64 glass-dark-strong z-30 hidden md:flex flex-col shadow-2xl shadow-black/20 border-r border-white/[0.06]">
        <Link href="/dashboard" className="flex items-center gap-2.5 px-5 py-5 text-lg font-bold text-white">
          <div className="w-8 h-8 rounded-xl bg-primary-500/20 flex items-center justify-center"><span className="text-primary-400 text-sm font-bold">M</span></div>
          MySmartCard
        </Link>
        <nav className="flex-1 px-3 space-y-1 mt-2">
          {nav.map((item) => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${active ? 'bg-white/[0.07] text-white border-l-2 border-primary-500' : 'text-white/50 hover:text-white hover:bg-white/[0.04]'}`}>
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="px-3 pb-4 mt-auto border-t border-white/[0.06] pt-4">
          <button onClick={() => { localStorage.clear(); router.push('/login') }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-red-400 hover:bg-white/[0.04] w-full transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
            Logout
          </button>
        </div>
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 glass-dark-strong z-50 flex flex-col shadow-2xl">
            <Link href="/dashboard" className="flex items-center gap-2.5 px-5 py-5 text-lg font-bold text-white border-b border-white/[0.06]">
              <div className="w-8 h-8 rounded-xl bg-primary-500/20 flex items-center justify-center"><span className="text-primary-400 text-sm font-bold">M</span></div>
              MySmartCard
            </Link>
            <nav className="flex-1 px-3 space-y-1 mt-4">
              {nav.map((item) => {
                const active = pathname === item.href
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'bg-white/[0.07] text-white border-l-2 border-primary-500' : 'text-white/50 hover:text-white hover:bg-white/[0.04]'}`}>
                    {item.icon}
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <div className="px-3 pb-4 border-t border-white/[0.06] pt-4">
              <button onClick={() => { localStorage.clear(); router.push('/login') }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-red-400 hover:bg-white/[0.04] w-full transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="md:ml-64">
        <header className="md:hidden glass sticky top-0 z-30 px-4 py-3 flex items-center justify-between border-b border-gray-100/50">
          <Link href="/dashboard" className="text-lg font-bold text-primary-600">MySmartCard</Link>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-xl hover:bg-gray-100/60 transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              {mobileMenuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />}
            </svg>
          </button>
        </header>
        <main className="p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
