'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Navigation Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        
        <Link href="/companies" className="group bg-white rounded-lg border border-gray-200 p-6 hover:border-black transition-all duration-300 hover:shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 p-3 rounded-full bg-gray-50 group-hover:bg-black transition-colors duration-300">
              <svg className="w-6 h-6 text-black group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">Companies</h2>
            <p className="text-xs text-gray-500 leading-relaxed">Manage manufacturers</p>
          </div>
        </Link>

        <Link href="/products" className="group bg-white rounded-lg border border-gray-200 p-6 hover:border-black transition-all duration-300 hover:shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 p-3 rounded-full bg-gray-50 group-hover:bg-black transition-colors duration-300">
              <svg className="w-6 h-6 text-black group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">Products</h2>
            <p className="text-xs text-gray-500 leading-relaxed">Manage inventory</p>
          </div>
        </Link>

        <Link href="/customers" className="group bg-white rounded-lg border border-gray-200 p-6 hover:border-black transition-all duration-300 hover:shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 p-3 rounded-full bg-gray-50 group-hover:bg-black transition-colors duration-300">
              <svg className="w-6 h-6 text-black group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">Customers</h2>
            <p className="text-xs text-gray-500 leading-relaxed">Manage accounts</p>
          </div>
        </Link>

        <Link href="/orders" className="group bg-white rounded-lg border border-gray-200 p-6 hover:border-black transition-all duration-300 hover:shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 p-3 rounded-full bg-gray-50 group-hover:bg-black transition-colors duration-300">
              <svg className="w-6 h-6 text-black group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">Orders</h2>
            <p className="text-xs text-gray-500 leading-relaxed">Track sales</p>
          </div>
        </Link>

        <Link href="/expenses" className="group bg-white rounded-lg border border-gray-200 p-6 hover:border-black transition-all duration-300 hover:shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 p-3 rounded-full bg-gray-50 group-hover:bg-black transition-colors duration-300">
              <svg className="w-6 h-6 text-black group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">Expenses</h2>
            <p className="text-xs text-gray-500 leading-relaxed">Track expenses</p>
          </div>
        </Link>

        <Link href="/investors" className="group bg-white rounded-lg border border-gray-200 p-6 hover:border-black transition-all duration-300 hover:shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 p-3 rounded-full bg-gray-50 group-hover:bg-black transition-colors duration-300">
              <svg className="w-6 h-6 text-black group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">Investors</h2>
            <p className="text-xs text-gray-500 leading-relaxed">Manage investors</p>
          </div>
        </Link>

        <Link href="/bank-accounts" className="group bg-white rounded-lg border border-gray-200 p-6 hover:border-black transition-all duration-300 hover:shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 p-3 rounded-full bg-gray-50 group-hover:bg-black transition-colors duration-300">
              <svg className="w-6 h-6 text-black group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">Bank Accounts</h2>
            <p className="text-xs text-gray-500 leading-relaxed">Manage accounts</p>
          </div>
        </Link>

        <Link href="/reports" className="group bg-white rounded-lg border border-gray-200 p-6 hover:border-black transition-all duration-300 hover:shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 p-3 rounded-full bg-gray-50 group-hover:bg-black transition-colors duration-300">
              <svg className="w-6 h-6 text-black group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">Reports</h2>
            <p className="text-xs text-gray-500 leading-relaxed">View analytics</p>
          </div>
        </Link>

      </div>
    </div>
  )
}
