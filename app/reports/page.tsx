'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns'

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
    totalRevenue: number
    totalCollected: number
    totalCost: number
    totalExpenses: number
    grossProfit: number
    netProfit: number
    inventoryValue: number
  }
  cashFlow: {
    totalCashIn: number
    totalCashOut: number
    netCashFlow: number
    breakdown: {
        customerPayments: number
        investorInvestments: number
        expenses: number
        investorWithdrawals: number
        customerWithdrawals: number
        purchasePayments: number
    }
  }
  recentOrders: Array<{
    id: string
    orderNumber: string
    customer: { name: string }
    totalAmount: string
    paidAmount: string
    remainingAmount: string
    status: string
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
    totalProfit: string
  }>
  topCustomers: Array<{
    id: string
    name: string
    phone: string
    balance: string
    totalPurchases: string
    totalPaid: string
    orderCount: string
  }>
  recentExpenses: Array<{
    category: string
    description: string
    amount: string
    expenseDate: string
  }>
  expensesByCategory: Array<{
    category: string
    totalAmount: string
    count: string
  }>
  lowStockProducts: Array<{
    id: string
    name: string
    stockQuantity: number
    price: string
    companyName: string
  }>
  companyBalances: Array<{
    id: string
    name: string
    totalPurchases: string
    totalPaid: string
    balance: string
  }>
}

export default function ReportsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Date Filter State
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        startDate,
        endDate
      })
      const response = await fetch(`/api/dashboard/stats?${queryParams}`)
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDatePreset = (preset: string) => {
    const today = new Date()
    let start = new Date()
    let end = new Date()

    switch (preset) {
        case 'today':
            start = today
            end = today
            break
        case 'last7Days':
            start = new Date(today)
            start.setDate(today.getDate() - 7)
            end = today
            break
        case 'thisMonth':
            start = startOfMonth(today)
            end = endOfMonth(today)
            break
        case 'lastMonth':
            start = startOfMonth(subMonths(today, 1))
            end = endOfMonth(subMonths(today, 1))
            break
        case 'last3Months':
            start = subMonths(today, 3)
            end = today
            break
        case 'thisYear':
            start = startOfYear(today)
            end = today
            break
        case 'allTime':
            start = new Date(2020, 0, 1)
            end = today
            break
    }
    setStartDate(format(start, 'yyyy-MM-dd'))
    setEndDate(format(end, 'yyyy-MM-dd'))
  }

  const handlePrintReport = () => {
    const printContent = document.getElementById('report-content')
    if (printContent) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Report - ${activeTab.toUpperCase()} - ${format(new Date(startDate), 'MMM d, yyyy')} to ${format(new Date(endDate), 'MMM d, yyyy')}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; font-size: 11px; }
                table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
                th { background-color: #f3f4f6; font-weight: 600; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                .font-bold { font-weight: bold; }
                .text-green-600 { color: #15803d; }
                .text-red-600 { color: #dc2626; }
                .text-blue-600 { color: #1d4ed8; }
                .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
                .summary-box { display: inline-block; padding: 10px; margin: 5px; background: #f9fafb; border-radius: 5px; }
                @media print { body { margin: 10px; } }
              </style>
            </head>
            <body>
              <div class="header">
                <h2 style="margin:0">Ghous Trading Company</h2>
                <p style="margin:5px 0">Report: ${activeTab.replace('-', ' ').toUpperCase()}</p>
                <p style="margin:5px 0;font-size:10px;">Period: ${format(new Date(startDate), 'MMM d, yyyy')} - ${format(new Date(endDate), 'MMM d, yyyy')}</p>
                <p style="margin:5px 0;font-size:10px;">Generated: ${format(new Date(), 'MMM d, yyyy h:mm a')}</p>
              </div>
              ${printContent.innerHTML}
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  if (loading && !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-2">Business performance and financial insights</p>
        </div>
        
        {/* Date Filter Controls */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex flex-col lg:flex-row gap-4 items-end lg:items-center">
                <div className="flex gap-2">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
                        <input 
                            type="date" 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="input-field text-sm py-1.5"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
                        <input 
                            type="date" 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="input-field text-sm py-1.5"
                        />
                    </div>
                </div>
                <div className="flex flex-wrap gap-1">
                    <button onClick={() => handleDatePreset('today')} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">Today</button>
                    <button onClick={() => handleDatePreset('last7Days')} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">7 Days</button>
                    <button onClick={() => handleDatePreset('thisMonth')} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">This Month</button>
                    <button onClick={() => handleDatePreset('lastMonth')} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">Last Month</button>
                    <button onClick={() => handleDatePreset('last3Months')} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">3 Months</button>
                    <button onClick={() => handleDatePreset('thisYear')} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">This Year</button>
                    <button onClick={() => handleDatePreset('allTime')} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">All Time</button>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={fetchStats}
                        className="btn-primary py-1.5 px-4 text-sm"
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : 'Apply'}
                    </button>
                    <button 
                        onClick={handlePrintReport}
                        className="flex items-center gap-1 bg-gray-800 hover:bg-gray-900 text-white py-1.5 px-4 text-sm rounded-md"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                        Print
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* High Level Financial Metrics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
            <h3 className="text-xs font-medium text-gray-500 mb-1 uppercase">Revenue</h3>
            <p className="text-xl font-bold text-gray-900">Rs. {stats.financial.totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Collected: Rs. {stats.financial.totalCollected.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-amber-500">
            <h3 className="text-xs font-medium text-gray-500 mb-1 uppercase">Cost (COGS)</h3>
            <p className="text-xl font-bold text-gray-900">Rs. {stats.financial.totalCost.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Cost of sold items</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
            <h3 className="text-xs font-medium text-gray-500 mb-1 uppercase">Expenses</h3>
            <p className="text-xl font-bold text-gray-900">Rs. {stats.financial.totalExpenses.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Operating costs</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
            <h3 className="text-xs font-medium text-gray-500 mb-1 uppercase">Gross Profit</h3>
            <p className={`text-xl font-bold ${stats.financial.grossProfit >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
              Rs. {stats.financial.grossProfit.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Revenue - COGS</p>
          </div>
          <div className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${stats.financial.netProfit >= 0 ? 'border-green-500' : 'border-red-600'}`}>
            <h3 className="text-xs font-medium text-gray-500 mb-1 uppercase">Net Profit</h3>
            <p className={`text-xl font-bold ${stats.financial.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Rs. {stats.financial.netProfit.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">After all expenses</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {['overview', 'sales', 'customers', 'expenses', 'inventory', 'cash-flow'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm capitalize transition-colors`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </nav>
      </div>

      {/* Report Content */}
      <div id="report-content">
        {/* Overview Tab */}
        {stats && activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm text-center">
                  <p className="text-3xl font-bold text-gray-800">{stats.counts.totalCustomers}</p>
                  <p className="text-sm text-gray-500">Active Customers</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm text-center">
                  <p className="text-3xl font-bold text-gray-800">{stats.counts.totalOrders}</p>
                  <p className="text-sm text-gray-500">Orders (Period)</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm text-center">
                  <p className="text-3xl font-bold text-red-600">Rs. {stats.financial.totalCustomerDebt.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Total Receivables</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm text-center">
                  <p className="text-3xl font-bold text-purple-600">Rs. {stats.financial.inventoryValue.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Inventory Value</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Order Status */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Order Status (Period)</h3>
                  <div className="flex items-center justify-around py-4">
                      <div className="text-center">
                          <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-2">
                              <span className="text-2xl font-bold text-yellow-600">{stats.counts.pendingOrders}</span>
                          </div>
                          <p className="text-sm font-medium text-gray-600">Pending</p>
                      </div>
                      <div className="h-16 w-px bg-gray-200"></div>
                      <div className="text-center">
                          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                              <span className="text-2xl font-bold text-green-600">{stats.counts.completedOrders}</span>
                          </div>
                          <p className="text-sm font-medium text-gray-600">Completed</p>
                      </div>
                  </div>
              </div>

              {/* Collection Rate */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Collection Rate (Period)</h3>
                  <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Sales</span>
                          <span className="font-medium">Rs. {stats.financial.totalRevenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Collected</span>
                          <span className="font-medium text-green-600">Rs. {stats.financial.totalCollected.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Pending</span>
                          <span className="font-medium text-amber-600">Rs. {(stats.financial.totalRevenue - stats.financial.totalCollected).toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                          <div 
                              className="bg-green-500 h-3 rounded-full" 
                              style={{ width: `${stats.financial.totalRevenue > 0 ? (stats.financial.totalCollected / stats.financial.totalRevenue) * 100 : 0}%` }}
                          ></div>
                      </div>
                      <p className="text-xs text-gray-500 text-center">
                          {stats.financial.totalRevenue > 0 
                              ? `${((stats.financial.totalCollected / stats.financial.totalRevenue) * 100).toFixed(1)}% collected`
                              : 'No sales in this period'}
                      </p>
                  </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Recent Orders</h3>
              <div className="overflow-x-auto">
                  <table className="min-w-full">
                      <thead className="bg-gray-50">
                          <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {stats.recentOrders.map((order) => (
                              <tr key={order.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.orderNumber}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600">{order.customer.name}</td>
                                  <td className="px-4 py-3 text-sm text-gray-500">{format(new Date(order.orderDate), 'MMM dd, yyyy')}</td>
                                  <td className="px-4 py-3 text-sm text-right font-medium">Rs. {Number(order.totalAmount).toLocaleString()}</td>
                                  <td className="px-4 py-3 text-center">
                                      <span className={`px-2 py-1 text-xs rounded-full ${
                                          order.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                                          order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                          'bg-yellow-100 text-yellow-800'
                                      }`}>
                                          {order.status}
                                      </span>
                                  </td>
                              </tr>
                          ))}
                          {stats.recentOrders.length === 0 && (
                              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">No orders found in this period</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
            </div>
          </div>
        )}

        {/* Sales Tab */}
        {stats && activeTab === 'sales' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Top Selling Products</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty Sold</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stats.topProducts.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.product.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.product.company.name}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">{Number(item.totalQuantity).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold">Rs. {Number(item.totalRevenue).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">Rs. {Number(item.totalProfit || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                    {stats.topProducts.length === 0 && (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">No sales found in this period</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Monthly Revenue Trend (Last 6 Months)</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {stats.monthlyRevenue.map((data: any) => (
                  <div key={data.month} className="p-4 bg-gray-50 rounded border border-gray-100">
                    <p className="font-bold text-gray-700 text-sm mb-2">{data.month}</p>
                    <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Sales</span>
                            <span className="font-medium">Rs. {Number(data.revenue).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Collected</span>
                            <span className="font-medium text-green-600">Rs. {Number(data.collected).toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full mt-2 overflow-hidden">
                        <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${Number(data.revenue) > 0 ? (Number(data.collected) / Number(data.revenue)) * 100 : 0}%` }}
                        ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Customers Tab */}
        {stats && activeTab === 'customers' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Top Customers by Purchase</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Orders</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total Purchases</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total Paid</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Balance (Debt)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stats.topCustomers?.map((customer, index) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{customer.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{customer.phone || '-'}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">{Number(customer.orderCount)}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold">Rs. {Number(customer.totalPurchases).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-green-600">Rs. {Number(customer.totalPaid).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-red-600">Rs. {Number(customer.balance).toLocaleString()}</td>
                      </tr>
                    ))}
                    {(!stats.topCustomers || stats.topCustomers.length === 0) && (
                        <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">No customer data found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Expenses Tab */}
        {stats && activeTab === 'expenses' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Expenses by Category</h3>
                <div className="space-y-3">
                  {stats.expensesByCategory?.map((cat) => (
                    <div key={cat.category} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-gray-800">{cat.category}</p>
                        <p className="text-xs text-gray-500">{cat.count} transactions</p>
                      </div>
                      <p className="font-bold text-red-600">Rs. {Number(cat.totalAmount).toLocaleString()}</p>
                    </div>
                  ))}
                  {(!stats.expensesByCategory || stats.expensesByCategory.length === 0) && (
                    <p className="text-center text-gray-500 py-4">No expenses in this period</p>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Recent Expenses</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {stats.recentExpenses?.map((exp, index) => (
                    <div key={index} className="flex justify-between items-center p-2 border-b border-gray-100">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{exp.description}</p>
                        <p className="text-xs text-gray-500">{exp.category} • {format(new Date(exp.expenseDate), 'MMM dd')}</p>
                      </div>
                      <p className="font-semibold text-red-600">Rs. {Number(exp.amount).toLocaleString()}</p>
                    </div>
                  ))}
                  {(!stats.recentExpenses || stats.recentExpenses.length === 0) && (
                    <p className="text-center text-gray-500 py-4">No expenses in this period</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {stats && activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-4 text-red-600">⚠️ Low Stock Alert</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {stats.lowStockProducts?.map((product) => (
                        <tr key={product.id}>
                          <td className="px-3 py-2 text-sm font-medium text-gray-900">{product.name}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{product.companyName}</td>
                          <td className="px-3 py-2 text-sm text-right font-bold text-red-600">{product.stockQuantity}</td>
                        </tr>
                      ))}
                      {(!stats.lowStockProducts || stats.lowStockProducts.length === 0) && (
                        <tr><td colSpan={3} className="px-3 py-4 text-center text-sm text-gray-500">All products have adequate stock</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Supplier Balances</h3>
                <div className="space-y-2">
                  {stats.companyBalances?.map((company) => (
                    <div key={company.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-gray-800">{company.name}</p>
                        <p className="text-xs text-gray-500">
                          Purchased: Rs. {Number(company.totalPurchases).toLocaleString()} | Paid: Rs. {Number(company.totalPaid).toLocaleString()}
                        </p>
                      </div>
                      <p className={`font-bold ${Number(company.balance) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Rs. {Number(company.balance).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  {(!stats.companyBalances || stats.companyBalances.length === 0) && (
                    <p className="text-center text-gray-500 py-4">No outstanding balances</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cash Flow Tab */}
        {stats && activeTab === 'cash-flow' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <h3 className="text-sm font-medium text-green-800 uppercase mb-2">Cash Inflow</h3>
                <p className="text-3xl font-bold text-green-600">Rs. {stats.cashFlow.totalCashIn.toLocaleString()}</p>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Customer Payments</span>
                    <span className="font-medium">Rs. {stats.cashFlow.breakdown.customerPayments.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Investor Investments</span>
                    <span className="font-medium">Rs. {stats.cashFlow.breakdown.investorInvestments.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                <h3 className="text-sm font-medium text-red-800 uppercase mb-2">Cash Outflow</h3>
                <p className="text-3xl font-bold text-red-600">Rs. {stats.cashFlow.totalCashOut.toLocaleString()}</p>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-red-700">Expenses</span>
                    <span className="font-medium">Rs. {stats.cashFlow.breakdown.expenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-700">Customer Withdrawals</span>
                    <span className="font-medium">Rs. {stats.cashFlow.breakdown.customerWithdrawals.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-700">Investor Withdrawals</span>
                    <span className="font-medium">Rs. {stats.cashFlow.breakdown.investorWithdrawals.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-700">Supplier Payments</span>
                    <span className="font-medium">Rs. {stats.cashFlow.breakdown.purchasePayments.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className={`${stats.cashFlow.netCashFlow >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'} p-6 rounded-lg border`}>
                <h3 className={`text-sm font-medium ${stats.cashFlow.netCashFlow >= 0 ? 'text-blue-800' : 'text-amber-800'} uppercase mb-2`}>Net Cash Flow</h3>
                <p className={`text-3xl font-bold ${stats.cashFlow.netCashFlow >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                  Rs. {stats.cashFlow.netCashFlow.toLocaleString()}
                </p>
                <p className="mt-4 text-sm text-gray-600">
                  {stats.cashFlow.netCashFlow >= 0 
                    ? 'Positive cash flow indicates healthy operations'
                    : 'Negative cash flow - more money going out than coming in'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
