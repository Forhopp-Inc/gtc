'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const navItems = [
  { name: 'Home', path: '/' },
  { name: 'Companies', path: '/companies' },
  { name: 'Products', path: '/products' },
  { name: 'Customers', path: '/customers' },
  { name: 'Orders', path: '/orders' },
  { name: 'Expenses', path: '/expenses' },
  { name: 'Reports', path: '/reports' },
]

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout failed', error)
    }
  }

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-primary-600">GTC</span>
            </Link>
            <span className="ml-2 text-sm text-gray-600">Management System</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  pathname === item.path
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.name}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="ml-4 px-4 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-200"
            >
              Logout
            </button>
          </div>

          <div className="md:hidden">
            <button className="text-gray-600 hover:text-gray-900 focus:outline-none">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
