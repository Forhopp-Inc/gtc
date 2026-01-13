'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'

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
    totalCost: number
    totalExpenses: number
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
    }
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
            break
        case 'thisYear':
            start = new Date(today.getFullYear(), 0, 1)
            break
    }
    setStartDate(format(start, 'yyyy-MM-dd'))
    setEndDate(format(end, 'yyyy-MM-dd'))
  }

  if (loading && !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading reports...</div>
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
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-end sm:items-center">
            <div className="flex gap-2">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="input-field text-sm py-1"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="input-field text-sm py-1"
                    />
                </div>
            </div>
            <div className="flex gap-2">
                <button onClick={() => handleDatePreset('today')} className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">Today</button>
                <button onClick={() => handleDatePreset('thisMonth')} className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">This Month</button>
                <button onClick={() => handleDatePreset('lastMonth')} className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">Last Month</button>
            </div>
            <button 
                onClick={fetchStats}
                className="btn-primary py-1 px-4 text-sm"
            >
                {loading ? '...' : 'Apply Filter'}
            </button>
        </div>
      </div>

      {/* High Level Financial Metrics */}
      {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card border-l-4 border-blue-500">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Total Revenue</h3>
              <p className="text-2xl font-bold text-gray-900">Rs. {stats.financial.totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Based on selected range</p>
            </div>
            <div className="card border-l-4 border-yellow-500">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Total Cost (COGS)</h3>
              <p className="text-2xl font-bold text-gray-900">Rs. {stats.financial.totalCost.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Cost of sold items</p>
            </div>
            <div className="card border-l-4 border-red-500">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Operating Expenses</h3>
              <p className="text-2xl font-bold text-gray-900">Rs. {stats.financial.totalExpenses.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Salaries, Rent, etc.</p>
            </div>
            <div className={`card border-l-4 ${stats.financial.netProfit >= 0 ? 'border-green-500' : 'border-red-600'}`}>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Net Profit</h3>
              <p className={`text-2xl font-bold ${stats.financial.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Rs. {stats.financial.netProfit.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Revenue - Cost - Expenses</p>
            </div>
          </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {['overview', 'cash-flow', 'sales', 'inventory', 'financial'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {stats && activeTab === 'overview' && (
        <div className="space-y-6">
          {/* System Counts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm text-center">
                <p className="text-3xl font-bold text-gray-800">{stats.counts.totalCustomers}</p>
                <p className="text-sm text-gray-500">Active Customers</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm text-center">
                <p className="text-3xl font-bold text-gray-800">{stats.counts.totalProducts}</p>
                <p className="text-sm text-gray-500">Products in Catalog</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm text-center">
                <p className="text-3xl font-bold text-gray-800">{stats.counts.totalOrders}</p>
                <p className="text-sm text-gray-500">Total Orders</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm text-center">
                <p className="text-3xl font-bold text-gray-800">{stats.counts.totalCompanies}</p>
                <p className="text-sm text-gray-500">Suppliers/Companies</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Order Status */}
            <div className="card">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Order Fulfillment</h3>
                <div className="flex items-center justify-around py-4">
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-2">
                            <span className="text-xl font-bold text-yellow-600">{stats.counts.pendingOrders}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-600">Pending</p>
                    </div>
                    <div className="h-12 w-px bg-gray-200"></div>
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                            <span className="text-xl font-bold text-green-600">{stats.counts.completedOrders}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-600">Completed</p>
                    </div>
                </div>
            </div>

            {/* Debt Overview */}
            <div className="card">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Receivables (Udhar)</h3>
                <div className="flex flex-col items-center justify-center py-4">
                    <p className="text-4xl font-bold text-red-600">Rs. {stats.financial.totalCustomerDebt.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-2">Total Amount Receivable from Customers</p>
                </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Recent Orders (Filtered)</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Order #</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Customer</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {stats.recentOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.orderNumber}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{order.customer.name}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{format(new Date(order.orderDate), 'MMM dd, yyyy')}</td>
                                <td className="px-4 py-3 text-sm text-right font-medium">Rs. {Number(order.totalAmount).toLocaleString()}</td>
                                <td className="px-4 py-3 text-sm text-right">
                                    <span className={`px-2 py-1 text-xs rounded-full ${order.id === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        Order
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

      {/* Cash Flow Tab */}
      {stats && activeTab === 'cash-flow' && (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card border-l-4 border-green-500">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Total Cash In</h3>
                    <p className="text-2xl font-bold text-green-600">Rs. {stats.cashFlow.totalCashIn.toLocaleString()}</p>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex justify-between text-sm py-1">
                            <span className="text-gray-600">Customer Payments</span>
                            <span className="font-medium">Rs. {stats.cashFlow.breakdown.customerPayments.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm py-1">
                            <span className="text-gray-600">Investor Investments</span>
                            <span className="font-medium">Rs. {stats.cashFlow.breakdown.investorInvestments.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="card border-l-4 border-red-500">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Total Cash Out</h3>
                    <p className="text-2xl font-bold text-red-600">Rs. {stats.cashFlow.totalCashOut.toLocaleString()}</p>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex justify-between text-sm py-1">
                            <span className="text-gray-600">Expenses</span>
                            <span className="font-medium">Rs. {stats.cashFlow.breakdown.expenses.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm py-1">
                            <span className="text-gray-600">Investor Withdrawals</span>
                            <span className="font-medium">Rs. {stats.cashFlow.breakdown.investorWithdrawals.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm py-1">
                            <span className="text-gray-600">Customer Withdrawals</span>
                            <span className="font-medium">Rs. {stats.cashFlow.breakdown.customerWithdrawals.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className={`card border-l-4 ${stats.cashFlow.netCashFlow >= 0 ? 'border-blue-500' : 'border-orange-500'}`}>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Net Cash Flow</h3>
                    <p className={`text-2xl font-bold ${stats.cashFlow.netCashFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        {stats.cashFlow.netCashFlow >= 0 ? '+' : ''} Rs. {stats.cashFlow.netCashFlow.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Cash In - Cash Out</p>
                </div>
            </div>
            
            <div className="card">
                <p className="text-sm text-gray-500 text-center">
                    Note: Cash Flow analysis is based on actual payments and transactions recorded within the selected date range.
                </p>
            </div>
        </div>
      )}

      {/* Sales Tab */}
      {stats && activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Top Selling Products (In Selected Period)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Company</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Quantity Sold</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.topProducts.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.product.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.product.company.name}</td>
                      <td className="px-4 py-3 text-sm text-right">{Number(item.totalQuantity).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">Rs. {Number(item.totalRevenue).toLocaleString()}</td>
                    </tr>
                  ))}
                   {stats.topProducts.length === 0 && (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">No sales found in this period</td></tr>
                    )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Monthly Revenue Trend (Last 6 Months)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.monthlyRevenue.map((data: any) => (
                <div key={data.month} className="p-4 bg-gray-50 rounded border border-gray-100">
                  <div className="flex justify-between mb-2">
                    <span className="font-bold text-gray-700">{data.month}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Sales</span>
                        <span className="font-medium">Rs. {data.revenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Collected</span>
                        <span className="font-medium text-green-600">Rs. {data.collected.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div 
                            className="bg-green-500 h-1.5 rounded-full" 
                            style={{ width: `${data.revenue > 0 ? (data.collected / data.revenue) * 100 : 0}%` }}
                        ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Inventory Tab */}
      {stats && activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card bg-blue-50 border-blue-200 text-center py-8">
                <p className="text-sm text-gray-600 font-medium uppercase tracking-wider">Total Companies</p>
                <p className="text-4xl font-bold text-blue-600 mt-2">{stats.counts.totalCompanies}</p>
              </div>
              <div className="card bg-green-50 border-green-200 text-center py-8">
                <p className="text-sm text-gray-600 font-medium uppercase tracking-wider">Total Products</p>
                <p className="text-4xl font-bold text-green-600 mt-2">{stats.counts.totalProducts}</p>
              </div>
              <div className="card bg-purple-50 border-purple-200 text-center py-8">
                <p className="text-sm text-gray-600 font-medium uppercase tracking-wider">Total Inventory Value</p>
                <p className="text-4xl font-bold text-purple-600 mt-2">Rs. {stats.financial.inventoryValue.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Cost of unsold stock</p>
              </div>
          </div>
          
          <div className="card">
              <p className="text-gray-500 text-center py-8">
                  Detailed inventory stock reports coming soon. Check "Products" page for current stock levels.
              </p>
          </div>
        </div>
      )}

      {/* Financial Tab */}
      {stats && activeTab === 'financial' && (
        <div className="space-y-6">
            {/* Profitability Breakdown */}
            <div className="card">
                <h3 className="text-lg font-semibold mb-6 text-gray-800">Profitability Analysis (Selected Period)</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Sales Revenue</p>
                            <p className="text-xl font-bold text-gray-900">Rs. {stats.financial.totalRevenue.toLocaleString()}</p>
                        </div>
                        <div className="h-8 w-1 bg-gray-300 rounded"></div>
                    </div>
                    
                    <div className="flex flex-col gap-2 pl-4 border-l-2 border-gray-200">
                         <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded">
                            <span className="text-sm text-gray-600">- Cost of Goods Sold (COGS)</span>
                            <span className="text-sm font-medium text-gray-900">Rs. {stats.financial.totalCost.toLocaleString()}</span>
                        </div>
                         <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded">
                            <span className="text-sm text-gray-600">- Operating Expenses</span>
                            <span className="text-sm font-medium text-red-600">Rs. {stats.financial.totalExpenses.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-lg mt-2">
                        <div>
                            <p className="text-sm font-bold text-blue-800">NET PROFIT</p>
                            <p className="text-2xl font-bold text-blue-700">Rs. {stats.financial.netProfit.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Expense List */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Expense Breakdown (Selected Period)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.recentExpenses.map((expense, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {format(new Date(expense.expenseDate), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">{expense.description}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                        Rs. {Number(expense.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {stats.recentExpenses.length === 0 && (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">No expenses found in this period</td></tr>
                    )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
