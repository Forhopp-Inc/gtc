'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Stats {
  counts: {
    totalCompanies: number
    totalProducts: number
    totalCustomers: number
    pendingOrders: number
  }
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Welcome to GTC Management System
        </h1>
        <p className="text-lg text-gray-600">
          Ghous Trading Company - Pesticides & Fertilizers Management
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Companies Card */}
        <Link href="/companies" className="card hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 ml-4">Companies</h2>
          </div>
          <p className="text-gray-600">Manage pesticide and fertilizer manufacturers</p>
        </Link>

        {/* Products Card */}
        <Link href="/products" className="card hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center mb-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 ml-4">Products</h2>
          </div>
          <p className="text-gray-600">Browse and manage product inventory</p>
        </Link>

        {/* Customers Card */}
        <Link href="/customers" className="card hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center mb-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 ml-4">Customers</h2>
          </div>
          <p className="text-gray-600">Manage customer accounts and debts</p>
        </Link>

        {/* Orders Card */}
        <Link href="/orders" className="card hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center mb-4">
            <div className="bg-orange-100 p-3 rounded-lg">
              <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 ml-4">Orders</h2>
          </div>
          <p className="text-gray-600">Create and track sales orders</p>
        </Link>

        {/* Expenses Card */}
        <Link href="/expenses" className="card hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center mb-4">
            <div className="bg-red-100 p-3 rounded-lg">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 ml-4">Expenses</h2>
          </div>
          <p className="text-gray-600">Track business expenses</p>
        </Link>

        {/* Reports Card */}
        <Link href="/reports" className="card hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center mb-4">
            <div className="bg-indigo-100 p-3 rounded-lg">
              <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 ml-4">Reports</h2>
          </div>
          <p className="text-gray-600">Analytics and detailed reports</p>
        </Link>
      </div>

      <div className="mt-12 card bg-primary-50 border-primary-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Stats</h3>
        {stats?.counts ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div>
              <p className="text-sm text-gray-600">Total Companies</p>
              <p className="text-2xl font-bold text-primary-600">
                {stats.counts.totalCompanies}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-primary-600">
                {stats.counts.totalProducts}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-primary-600">
                {stats.counts.totalCustomers}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Orders</p>
              <p className="text-2xl font-bold text-primary-600">
                {stats.counts.pendingOrders}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ Please set up your database connection in the .env file and run:
            </p>
            <code className="text-xs block mt-2 bg-yellow-100 p-2 rounded">
              npm run prisma:generate && npm run prisma:migrate
            </code>
          </div>
        )}
      </div>
    </div>
  )
}