'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'

interface DashboardStats {
  counts: {
    totalCompanies: number
    totalProducts: number
    totalCustomers: number
    totalOrders: number
    pendingOrders: number
    completedOrders: number
  }
  financial: {
    totalCustomerDebt: number
  }
  recentOrders: Array<{
    id: string
    orderNumber: string
    customer: { name: string }
    totalAmount: string
    orderDate: string
  }>
  monthlyRevenue: Array<{
    month: string
    revenue: number
    collected: number
  }>
  topProducts: Array<{
    product: {
      name: string
      company: { name: string }
    }
    totalQuantity: string
    totalRevenue: string
  }>
  recentExpenses: Array<{
    category: string
    description: string
    amount: string
    expenseDate: string
  }>
}

export default function ReportsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

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
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading reports...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-2">Business insights and detailed reports</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'sales', 'inventory', 'financial'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card bg-blue-50 border-blue-200">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Total Companies</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.counts.totalCompanies}</p>
            </div>
            <div className="card bg-green-50 border-green-200">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Total Products</h3>
              <p className="text-3xl font-bold text-green-600">{stats.counts.totalProducts}</p>
            </div>
            <div className="card bg-purple-50 border-purple-200">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Total Customers</h3>
              <p className="text-3xl font-bold text-purple-600">{stats.counts.totalCustomers}</p>
            </div>
            <div className="card bg-orange-50 border-orange-200">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Total Orders</h3>
              <p className="text-3xl font-bold text-orange-600">{stats.counts.totalOrders}</p>
            </div>
          </div>

          {/* Order Status */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Order Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.counts.pendingOrders}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed Orders</p>
                <p className="text-2xl font-bold text-green-600">{stats.counts.completedOrders}</p>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
            <div className="space-y-3">
              {stats.recentOrders.map((order) => (
                <div key={order.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-sm text-gray-600">{order.customer.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Rs. {Number(order.totalAmount).toLocaleString()}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(order.orderDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sales Tab */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Monthly Revenue (Last 6 Months)</h3>
            <div className="space-y-3">
              {stats.monthlyRevenue.map((data: any) => (
                <div key={data.month} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{data.month}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">Rs. {data.revenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Collected: Rs. {data.collected.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>
            <div className="space-y-3">
              {stats.topProducts.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-gray-600">{item.product.company.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Qty: {Number(item.totalQuantity).toLocaleString()}</p>
                    <p className="text-sm text-green-600">Rs. {Number(item.totalRevenue).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Inventory Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded">
                <p className="text-sm text-gray-600">Total Companies</p>
                <p className="text-2xl font-bold text-blue-600">{stats.counts.totalCompanies}</p>
              </div>
              <div className="p-4 bg-green-50 rounded">
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-green-600">{stats.counts.totalProducts}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Top Products by Sales</h3>
            <div className="table-container">
              <table className="min-w-full">
                <thead className="table-header">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Company</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Quantity Sold</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topProducts.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-3 text-sm">{item.product.name}</td>
                      <td className="px-4 py-3 text-sm">{item.product.company.name}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        {Number(item.totalQuantity).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                        Rs. {Number(item.totalRevenue).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Financial Tab */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card bg-red-50 border-red-200">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Total Customer Debt (Udhar)</h3>
              <p className="text-3xl font-bold text-red-600">
                Rs. {stats.financial.totalCustomerDebt.toLocaleString()}
              </p>
            </div>
            <div className="card bg-blue-50 border-blue-200">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Total Customers</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.counts.totalCustomers}</p>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Recent Expenses</h3>
            <div className="table-container">
              <table className="min-w-full">
                <thead className="table-header">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentExpenses.map((expense, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-3 text-sm">
                        {format(new Date(expense.expenseDate), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{expense.description}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">
                        Rs. {Number(expense.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Revenue vs Collection (Last 6 Months)</h3>
            <div className="space-y-3">
              {stats.monthlyRevenue.map((data: any) => (
                <div key={data.month} className="p-4 bg-gray-50 rounded">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{data.month}</span>
                    <span className="text-sm text-gray-600">
                      Collection Rate: {data.revenue > 0 ? Math.round((data.collected / data.revenue) * 100) : 0}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Revenue</p>
                      <p className="text-lg font-semibold text-blue-600">
                        Rs. {data.revenue.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Collected</p>
                      <p className="text-lg font-semibold text-green-600">
                        Rs. {data.collected.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}