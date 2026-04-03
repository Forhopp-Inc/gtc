'use client'

import { useState, useEffect } from 'react'
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from 'date-fns'

interface ReportData {
  summary: {
    totalSales: number
    totalCollected: number
    totalReceivable: number
    orderCount: number
    totalCost: number
    grossProfit: number
    totalExpenses: number
    netProfit: number
  }
  orders: Array<{
    id: string
    orderNumber: string
    orderDate: string
    totalAmount: string
    paidAmount: string
    remainingAmount: string
    status: string
    customerName: string
    customerPhone: string
  }>
  productSales: Array<{
    productName: string
    companyName: string
    totalQty: string
    avgBuyPrice: string
    avgSellPrice: string
    totalCost: string
    totalRevenue: string
    totalProfit: string
  }>
  inventoryPurchases: Array<{
    id: string
    date: string
    amount: string
    description: string
    invoiceNumber: string
    status: string
    companyName: string
  }>
  companyPayments: Array<{
    id: string
    date: string
    amount: string
    prReceiptNumber: string
    status: string
    companyName: string
    fromDetails: any
  }>
  expenses: Array<{
    id: string
    category: string
    description: string
    amount: string
    date: string
    notes: string
  }>
  expenseSummary: Array<{
    category: string
    total: string
    count: string
  }>
  customerPayments: Array<{
    id: string
    date: string
    amount: string
    type: string
    method: string
    notes: string
    customerName: string
  }>
  investorTransactions: Array<{
    id: string
    date: string
    amount: string
    type: string
    description: string
    investorName: string
  }>
  investorSummary: Array<{
    investorName: string
    investments: string
    withdrawals: string
  }>
  companyBalances: Array<{
    name: string
    totalPurchases: string
    totalPaid: string
    balance: string
  }>
  customerBalances: Array<{
    name: string
    phone: string
    balance: string
    totalPurchases: string
  }>
  currentInventory: Array<{
    productName: string
    category: string
    stock: number
    buyPrice: string
    value: string
    companyName: string
  }>
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily')
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [showPrintModal, setShowPrintModal] = useState(false)

  useEffect(() => {
    handleReportTypeChange(reportType)
  }, [])

  const handleReportTypeChange = (type: 'daily' | 'weekly' | 'monthly' | 'custom') => {
    setReportType(type)
    const today = new Date()
    let start: Date, end: Date

    switch (type) {
      case 'daily':
        start = startOfDay(today)
        end = endOfDay(today)
        break
      case 'weekly':
        start = startOfWeek(today, { weekStartsOn: 1 })
        end = endOfWeek(today, { weekStartsOn: 1 })
        break
      case 'monthly':
        start = startOfMonth(today)
        end = endOfMonth(today)
        break
      default:
        return
    }

    setStartDate(format(start, 'yyyy-MM-dd'))
    setEndDate(format(end, 'yyyy-MM-dd'))
  }

  const fetchReportData = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({ startDate, endDate })
      const response = await fetch(`/api/reports?${queryParams}`)
      const data = await response.json()
      setReportData(data)
    } catch (error) {
      console.error('Failed to fetch report data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (startDate && endDate) {
      fetchReportData()
    }
  }, [startDate, endDate])

  const getReportTitle = () => {
    switch (reportType) {
      case 'daily':
        return `Daily Report - ${format(new Date(startDate), 'MMMM d, yyyy')}`
      case 'weekly':
        return `Weekly Report - ${format(new Date(startDate), 'MMM d')} to ${format(new Date(endDate), 'MMM d, yyyy')}`
      case 'monthly':
        return `Monthly Report - ${format(new Date(startDate), 'MMMM yyyy')}`
      default:
        return `Custom Report - ${format(new Date(startDate), 'MMM d')} to ${format(new Date(endDate), 'MMM d, yyyy')}`
    }
  }

  const handlePrint = () => {
    const printContent = document.getElementById('comprehensive-report')
    if (printContent) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${getReportTitle()} - Ghous Trading Company</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                  font-family: Arial, sans-serif; 
                  margin: 15px; 
                  font-size: 10px; 
                  line-height: 1.4;
                  color: #1f2937;
                }
                .report-header {
                  text-align: center;
                  border-bottom: 3px double #1f2937;
                  padding-bottom: 12px;
                  margin-bottom: 15px;
                }
                .report-header h1 { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
                .report-header h2 { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 4px; }
                .report-header p { font-size: 10px; color: #6b7280; }
                
                .summary-grid {
                  display: grid;
                  grid-template-columns: repeat(4, 1fr);
                  gap: 8px;
                  margin-bottom: 15px;
                }
                .summary-box {
                  border: 1px solid #d1d5db;
                  padding: 8px;
                  text-align: center;
                  background: #f9fafb;
                }
                .summary-box .label { font-size: 8px; color: #6b7280; text-transform: uppercase; margin-bottom: 2px; }
                .summary-box .value { font-size: 12px; font-weight: bold; }
                .summary-box.positive .value { color: #15803d; }
                .summary-box.negative .value { color: #dc2626; }
                
                .section { margin-bottom: 15px; page-break-inside: avoid; }
                .section-header {
                  background: #1f2937;
                  color: white;
                  padding: 6px 10px;
                  font-size: 11px;
                  font-weight: bold;
                  margin-bottom: 0;
                }
                
                table { 
                  width: 100%; 
                  border-collapse: collapse; 
                  font-size: 9px;
                }
                th, td { 
                  border: 1px solid #9ca3af; 
                  padding: 4px 6px; 
                  text-align: left; 
                }
                th { 
                  background-color: #e5e7eb; 
                  font-weight: 600; 
                  font-size: 8px;
                  text-transform: uppercase;
                }
                tr:nth-child(even) { background-color: #f9fafb; }
                
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                .font-bold { font-weight: bold; }
                .font-semibold { font-weight: 600; }
                .text-green { color: #15803d; }
                .text-red { color: #dc2626; }
                .text-blue { color: #1d4ed8; }
                .text-gray { color: #6b7280; }
                
                .totals-row { 
                  background-color: #e5e7eb !important; 
                  font-weight: bold;
                }
                
                .two-column {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 15px;
                }
                
                .page-break { page-break-before: always; }
                
                @media print {
                  body { margin: 10px; }
                  .section { page-break-inside: avoid; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `)
        printWindow.document.close()
        setTimeout(() => printWindow.print(), 250)
      }
    }
  }

  if (loading && !reportData) {
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
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Reports</h1>
          <p className="text-gray-600 mt-2">Generate comprehensive business reports</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4 items-end lg:items-center">
            {/* Report Type Selector */}
            <div className="flex gap-1">
              {(['daily', 'weekly', 'monthly', 'custom'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => handleReportTypeChange(type)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    reportType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
            
            {/* Date Range */}
            {reportType === 'custom' && (
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
            )}
            
            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white py-2 px-4 text-sm rounded-md font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
              </svg>
              Print Report
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {reportData && (
        <div id="comprehensive-report">
          {/* Report Header */}
          <div className="report-header text-center border-b-2 border-gray-800 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Ghous Trading Company</h1>
            <h2 className="text-lg font-semibold text-gray-700 mt-1">{getReportTitle()}</h2>
            <p className="text-sm text-gray-500 mt-1">Generated: {format(new Date(), 'MMMM d, yyyy h:mm a')}</p>
          </div>

          {/* Summary Cards */}
          <div className="summary-grid grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="summary-box bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="label text-xs text-blue-600 font-medium uppercase">Total Sales</div>
              <div className="value text-xl font-bold text-blue-700">Rs. {reportData.summary.totalSales.toLocaleString()}</div>
            </div>
            <div className="summary-box bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="label text-xs text-green-600 font-medium uppercase">Collected</div>
              <div className="value text-xl font-bold text-green-700">Rs. {reportData.summary.totalCollected.toLocaleString()}</div>
            </div>
            <div className="summary-box bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
              <div className="label text-xs text-amber-600 font-medium uppercase">COGS</div>
              <div className="value text-xl font-bold text-amber-700">Rs. {reportData.summary.totalCost.toLocaleString()}</div>
            </div>
            <div className={`summary-box rounded-lg p-4 text-center ${reportData.summary.netProfit >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
              <div className={`label text-xs font-medium uppercase ${reportData.summary.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Net Profit</div>
              <div className={`value text-xl font-bold ${reportData.summary.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>Rs. {reportData.summary.netProfit.toLocaleString()}</div>
            </div>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-4 gap-3 mb-6 text-sm">
            <div className="bg-white border rounded p-3">
              <span className="text-gray-500">Orders:</span>
              <span className="font-bold ml-2">{reportData.summary.orderCount}</span>
            </div>
            <div className="bg-white border rounded p-3">
              <span className="text-gray-500">Receivable:</span>
              <span className="font-bold text-red-600 ml-2">Rs. {reportData.summary.totalReceivable.toLocaleString()}</span>
            </div>
            <div className="bg-white border rounded p-3">
              <span className="text-gray-500">Gross Profit:</span>
              <span className="font-bold text-purple-600 ml-2">Rs. {reportData.summary.grossProfit.toLocaleString()}</span>
            </div>
            <div className="bg-white border rounded p-3">
              <span className="text-gray-500">Expenses:</span>
              <span className="font-bold text-orange-600 ml-2">Rs. {reportData.summary.totalExpenses.toLocaleString()}</span>
            </div>
          </div>

          {/* SECTION 1: Sales Orders */}
          <div className="section mb-6">
            <div className="section-header bg-gray-800 text-white px-4 py-2 font-semibold">
              📦 Sales Orders ({reportData.orders.length})
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-3 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
                    <th className="border px-3 py-2 text-left text-xs font-semibold text-gray-600">Order #</th>
                    <th className="border px-3 py-2 text-left text-xs font-semibold text-gray-600">Customer</th>
                    <th className="border px-3 py-2 text-right text-xs font-semibold text-gray-600">Amount</th>
                    <th className="border px-3 py-2 text-right text-xs font-semibold text-gray-600">Paid</th>
                    <th className="border px-3 py-2 text-right text-xs font-semibold text-gray-600">Due</th>
                    <th className="border px-3 py-2 text-center text-xs font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.orders.slice(0, 50).map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="border px-3 py-2 text-sm">{format(new Date(order.orderDate), 'dd/MM/yy')}</td>
                      <td className="border px-3 py-2 text-sm font-medium">{order.orderNumber}</td>
                      <td className="border px-3 py-2 text-sm">{order.customerName}</td>
                      <td className="border px-3 py-2 text-sm text-right font-medium">{Number(order.totalAmount).toLocaleString()}</td>
                      <td className="border px-3 py-2 text-sm text-right text-green-600">{Number(order.paidAmount).toLocaleString()}</td>
                      <td className="border px-3 py-2 text-sm text-right text-red-600">{Number(order.remainingAmount).toLocaleString()}</td>
                      <td className="border px-3 py-2 text-sm text-center">
                        <span className={`px-2 py-0.5 rounded text-xs ${order.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {reportData.orders.length === 0 && (
                    <tr><td colSpan={7} className="border px-3 py-4 text-center text-gray-500">No orders in this period</td></tr>
                  )}
                </tbody>
                {reportData.orders.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-200 font-bold">
                      <td colSpan={3} className="border px-3 py-2 text-sm">TOTAL</td>
                      <td className="border px-3 py-2 text-sm text-right">{reportData.summary.totalSales.toLocaleString()}</td>
                      <td className="border px-3 py-2 text-sm text-right text-green-700">{reportData.summary.totalCollected.toLocaleString()}</td>
                      <td className="border px-3 py-2 text-sm text-right text-red-700">{reportData.summary.totalReceivable.toLocaleString()}</td>
                      <td className="border px-3 py-2"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* SECTION 2: Product Sales Summary */}
          <div className="section mb-6">
            <div className="section-header bg-gray-800 text-white px-4 py-2 font-semibold">
              📊 Product Sales Summary
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-3 py-2 text-left text-xs font-semibold text-gray-600">Product</th>
                    <th className="border px-3 py-2 text-left text-xs font-semibold text-gray-600">Company</th>
                    <th className="border px-3 py-2 text-right text-xs font-semibold text-gray-600">Qty Sold</th>
                    <th className="border px-3 py-2 text-right text-xs font-semibold text-gray-600">Avg Buy</th>
                    <th className="border px-3 py-2 text-right text-xs font-semibold text-gray-600">Avg Sell</th>
                    <th className="border px-3 py-2 text-right text-xs font-semibold text-gray-600">Revenue</th>
                    <th className="border px-3 py-2 text-right text-xs font-semibold text-gray-600">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.productSales.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="border px-3 py-2 text-sm font-medium">{item.productName}</td>
                      <td className="border px-3 py-2 text-sm text-gray-600">{item.companyName}</td>
                      <td className="border px-3 py-2 text-sm text-right">{Number(item.totalQty).toLocaleString()}</td>
                      <td className="border px-3 py-2 text-sm text-right">{Number(item.avgBuyPrice).toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                      <td className="border px-3 py-2 text-sm text-right">{Number(item.avgSellPrice).toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                      <td className="border px-3 py-2 text-sm text-right font-medium">{Number(item.totalRevenue).toLocaleString()}</td>
                      <td className={`border px-3 py-2 text-sm text-right font-bold ${Number(item.totalProfit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {Number(item.totalProfit).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {reportData.productSales.length === 0 && (
                    <tr><td colSpan={7} className="border px-3 py-4 text-center text-gray-500">No product sales in this period</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 3: Inventory Purchases */}
          <div className="section mb-6">
            <div className="section-header bg-gray-800 text-white px-4 py-2 font-semibold">
              🏭 Inventory Purchases ({reportData.inventoryPurchases.length})
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-3 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
                    <th className="border px-3 py-2 text-left text-xs font-semibold text-gray-600">Company</th>
                    <th className="border px-3 py-2 text-left text-xs font-semibold text-gray-600">Description</th>
                    <th className="border px-3 py-2 text-left text-xs font-semibold text-gray-600">Invoice #</th>
                    <th className="border px-3 py-2 text-right text-xs font-semibold text-gray-600">Amount</th>
                    <th className="border px-3 py-2 text-center text-xs font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.inventoryPurchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-gray-50">
                      <td className="border px-3 py-2 text-sm">{format(new Date(purchase.date), 'dd/MM/yy')}</td>
                      <td className="border px-3 py-2 text-sm font-medium">{purchase.companyName}</td>
                      <td className="border px-3 py-2 text-sm text-gray-600 max-w-xs truncate">{purchase.description}</td>
                      <td className="border px-3 py-2 text-sm">{purchase.invoiceNumber || '-'}</td>
                      <td className="border px-3 py-2 text-sm text-right font-medium text-red-600">{Number(purchase.amount).toLocaleString()}</td>
                      <td className="border px-3 py-2 text-sm text-center">
                        <span className={`px-2 py-0.5 rounded text-xs ${purchase.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {purchase.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {reportData.inventoryPurchases.length === 0 && (
                    <tr><td colSpan={6} className="border px-3 py-4 text-center text-gray-500">No inventory purchases in this period</td></tr>
                  )}
                </tbody>
                {reportData.inventoryPurchases.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-200 font-bold">
                      <td colSpan={4} className="border px-3 py-2 text-sm">TOTAL PURCHASES</td>
                      <td className="border px-3 py-2 text-sm text-right text-red-700">
                        {reportData.inventoryPurchases.reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString()}
                      </td>
                      <td className="border px-3 py-2"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* SECTION 4: Expenses */}
          <div className="section mb-6">
            <div className="section-header bg-gray-800 text-white px-4 py-2 font-semibold">
              💸 Expenses ({reportData.expenses.length})
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Expense Summary by Category */}
              <div className="bg-gray-50 border rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-3">By Category</h4>
                <div className="space-y-2">
                  {reportData.expenseSummary.map((cat, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{cat.category}</span>
                      <span className="font-bold text-red-600">Rs. {Number(cat.total).toLocaleString()}</span>
                    </div>
                  ))}
                  {reportData.expenseSummary.length === 0 && (
                    <p className="text-gray-500 text-sm">No expenses</p>
                  )}
                </div>
                <div className="border-t mt-3 pt-3">
                  <div className="flex justify-between items-center font-bold">
                    <span>Total Expenses</span>
                    <span className="text-red-700">Rs. {reportData.summary.totalExpenses.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              {/* Expense Details */}
              <div className="lg:col-span-2 overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-3 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
                      <th className="border px-3 py-2 text-left text-xs font-semibold text-gray-600">Category</th>
                      <th className="border px-3 py-2 text-left text-xs font-semibold text-gray-600">Description</th>
                      <th className="border px-3 py-2 text-right text-xs font-semibold text-gray-600">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.expenses.slice(0, 20).map((expense) => (
                      <tr key={expense.id} className="hover:bg-gray-50">
                        <td className="border px-3 py-2 text-sm">{format(new Date(expense.date), 'dd/MM/yy')}</td>
                        <td className="border px-3 py-2 text-sm">{expense.category}</td>
                        <td className="border px-3 py-2 text-sm text-gray-600">{expense.description}</td>
                        <td className="border px-3 py-2 text-sm text-right font-medium text-red-600">{Number(expense.amount).toLocaleString()}</td>
                      </tr>
                    ))}
                    {reportData.expenses.length === 0 && (
                      <tr><td colSpan={4} className="border px-3 py-4 text-center text-gray-500">No expenses in this period</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* SECTION 5: Customer Payments Received */}
          <div className="section mb-6">
            <div className="section-header bg-gray-800 text-white px-4 py-2 font-semibold">
              💰 Customer Payments Received ({reportData.customerPayments.filter(p => p.type === 'credit').length})
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-3 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
                    <th className="border px-3 py-2 text-left text-xs font-semibold text-gray-600">Customer</th>
                    <th className="border px-3 py-2 text-left text-xs font-semibold text-gray-600">Method</th>
                    <th className="border px-3 py-2 text-left text-xs font-semibold text-gray-600">Notes</th>
                    <th className="border px-3 py-2 text-right text-xs font-semibold text-gray-600">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.customerPayments.filter(p => p.type === 'credit').map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="border px-3 py-2 text-sm">{format(new Date(payment.date), 'dd/MM/yy')}</td>
                      <td className="border px-3 py-2 text-sm font-medium">{payment.customerName}</td>
                      <td className="border px-3 py-2 text-sm">{payment.method || '-'}</td>
                      <td className="border px-3 py-2 text-sm text-gray-600">{payment.notes || '-'}</td>
                      <td className="border px-3 py-2 text-sm text-right font-medium text-green-600">{Number(payment.amount).toLocaleString()}</td>
                    </tr>
                  ))}
                  {reportData.customerPayments.filter(p => p.type === 'credit').length === 0 && (
                    <tr><td colSpan={5} className="border px-3 py-4 text-center text-gray-500">No customer payments in this period</td></tr>
                  )}
                </tbody>
                {reportData.customerPayments.filter(p => p.type === 'credit').length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-200 font-bold">
                      <td colSpan={4} className="border px-3 py-2 text-sm">TOTAL RECEIVED</td>
                      <td className="border px-3 py-2 text-sm text-right text-green-700">
                        {reportData.customerPayments.filter(p => p.type === 'credit').reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* SECTION 6: Investor Transactions */}
          {reportData.investorTransactions.length > 0 && (
            <div className="section mb-6">
              <div className="section-header bg-gray-800 text-white px-4 py-2 font-semibold">
                🏦 Investor Transactions ({reportData.investorTransactions.length})
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Investor Summary */}
                <div className="bg-gray-50 border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-3">By Investor</h4>
                  <div className="space-y-2">
                    {reportData.investorSummary.map((inv, idx) => (
                      <div key={idx} className="border-b pb-2">
                        <div className="font-medium text-gray-800">{inv.investorName}</div>
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600">+{Number(inv.investments).toLocaleString()}</span>
                          <span className="text-red-600">-{Number(inv.withdrawals).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Transaction Details */}
                <div className="lg:col-span-2 overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border px-3 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
                        <th className="border px-3 py-2 text-left text-xs font-semibold text-gray-600">Investor</th>
                        <th className="border px-3 py-2 text-left text-xs font-semibold text-gray-600">Type</th>
                        <th className="border px-3 py-2 text-left text-xs font-semibold text-gray-600">Description</th>
                        <th className="border px-3 py-2 text-right text-xs font-semibold text-gray-600">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.investorTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50">
                          <td className="border px-3 py-2 text-sm">{format(new Date(tx.date), 'dd/MM/yy')}</td>
                          <td className="border px-3 py-2 text-sm font-medium">{tx.investorName}</td>
                          <td className="border px-3 py-2 text-sm">
                            <span className={`px-2 py-0.5 rounded text-xs ${tx.type === 'Investment' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className="border px-3 py-2 text-sm text-gray-600">{tx.description || '-'}</td>
                          <td className={`border px-3 py-2 text-sm text-right font-medium ${tx.type === 'Investment' ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.type === 'Investment' ? '+' : '-'}{Number(tx.amount).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7: Company/Supplier Payments */}
          {reportData.companyPayments.length > 0 && (
            <div className="section mb-6">
              <div className="section-header bg-gray-800 text-white px-4 py-2 font-semibold">
                🏢 Supplier Payments Made ({reportData.companyPayments.length})
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-3 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
                      <th className="border px-3 py-2 text-left text-xs font-semibold text-gray-600">Company</th>
                      <th className="border px-3 py-2 text-left text-xs font-semibold text-gray-600">PR Receipt</th>
                      <th className="border px-3 py-2 text-center text-xs font-semibold text-gray-600">Status</th>
                      <th className="border px-3 py-2 text-right text-xs font-semibold text-gray-600">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.companyPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="border px-3 py-2 text-sm">{format(new Date(payment.date), 'dd/MM/yy')}</td>
                        <td className="border px-3 py-2 text-sm font-medium">{payment.companyName}</td>
                        <td className="border px-3 py-2 text-sm">{payment.prReceiptNumber || '-'}</td>
                        <td className="border px-3 py-2 text-sm text-center">
                          <span className={`px-2 py-0.5 rounded text-xs ${payment.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="border px-3 py-2 text-sm text-right font-medium text-blue-600">{Number(payment.amount).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-200 font-bold">
                      <td colSpan={4} className="border px-3 py-2 text-sm">TOTAL PAID TO SUPPLIERS</td>
                      <td className="border px-3 py-2 text-sm text-right text-blue-700">
                        {reportData.companyPayments.reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 8: Outstanding Balances */}
          <div className="section mb-6">
            <div className="section-header bg-gray-800 text-white px-4 py-2 font-semibold">
              📋 Outstanding Balances
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              {/* Customer Receivables */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Customer Receivables (Top 20)</h4>
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-3 py-2 text-left text-xs font-semibold text-gray-600">Customer</th>
                      <th className="border px-3 py-2 text-right text-xs font-semibold text-gray-600">Balance Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.customerBalances.slice(0, 20).map((customer, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="border px-3 py-2 text-sm">{customer.name}</td>
                        <td className="border px-3 py-2 text-sm text-right font-medium text-red-600">{Number(customer.balance).toLocaleString()}</td>
                      </tr>
                    ))}
                    {reportData.customerBalances.length === 0 && (
                      <tr><td colSpan={2} className="border px-3 py-4 text-center text-gray-500">No outstanding balances</td></tr>
                    )}
                  </tbody>
                  {reportData.customerBalances.length > 0 && (
                    <tfoot>
                      <tr className="bg-gray-200 font-bold">
                        <td className="border px-3 py-2 text-sm">TOTAL RECEIVABLE</td>
                        <td className="border px-3 py-2 text-sm text-right text-red-700">
                          {reportData.customerBalances.reduce((sum, c) => sum + Number(c.balance), 0).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
              
              {/* Supplier Payables */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Supplier Balances</h4>
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-3 py-2 text-left text-xs font-semibold text-gray-600">Company</th>
                      <th className="border px-3 py-2 text-right text-xs font-semibold text-gray-600">Purchased</th>
                      <th className="border px-3 py-2 text-right text-xs font-semibold text-gray-600">Paid</th>
                      <th className="border px-3 py-2 text-right text-xs font-semibold text-gray-600">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.companyBalances.filter(c => Number(c.totalPurchases) > 0).map((company, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="border px-3 py-2 text-sm">{company.name}</td>
                        <td className="border px-3 py-2 text-sm text-right">{Number(company.totalPurchases).toLocaleString()}</td>
                        <td className="border px-3 py-2 text-sm text-right text-green-600">{Number(company.totalPaid).toLocaleString()}</td>
                        <td className={`border px-3 py-2 text-sm text-right font-medium ${Number(company.balance) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {Number(company.balance).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {reportData.companyBalances.filter(c => Number(c.totalPurchases) > 0).length === 0 && (
                      <tr><td colSpan={4} className="border px-3 py-4 text-center text-gray-500">No supplier transactions</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* SECTION 9: Current Inventory */}
          <div className="section mb-6">
            <div className="section-header bg-gray-800 text-white px-4 py-2 font-semibold">
              📦 Current Inventory ({reportData.currentInventory.length} products)
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-3 py-2 text-left text-xs font-semibold text-gray-600">Product</th>
                    <th className="border px-3 py-2 text-left text-xs font-semibold text-gray-600">Company</th>
                    <th className="border px-3 py-2 text-left text-xs font-semibold text-gray-600">Category</th>
                    <th className="border px-3 py-2 text-right text-xs font-semibold text-gray-600">Stock</th>
                    <th className="border px-3 py-2 text-right text-xs font-semibold text-gray-600">Buy Price</th>
                    <th className="border px-3 py-2 text-right text-xs font-semibold text-gray-600">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.currentInventory.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="border px-3 py-2 text-sm font-medium">{item.productName}</td>
                      <td className="border px-3 py-2 text-sm text-gray-600">{item.companyName}</td>
                      <td className="border px-3 py-2 text-sm">
                        <span className={`px-2 py-0.5 rounded text-xs ${item.category === 'Pesticide' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="border px-3 py-2 text-sm text-right">{item.stock}</td>
                      <td className="border px-3 py-2 text-sm text-right">{Number(item.buyPrice || 0).toLocaleString()}</td>
                      <td className="border px-3 py-2 text-sm text-right font-medium text-purple-600">{Number(item.value || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                  {reportData.currentInventory.length === 0 && (
                    <tr><td colSpan={6} className="border px-3 py-4 text-center text-gray-500">No inventory</td></tr>
                  )}
                </tbody>
                {reportData.currentInventory.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-200 font-bold">
                      <td colSpan={3} className="border px-3 py-2 text-sm">TOTAL INVENTORY VALUE</td>
                      <td className="border px-3 py-2 text-sm text-right">
                        {reportData.currentInventory.reduce((sum, i) => sum + i.stock, 0).toLocaleString()} units
                      </td>
                      <td className="border px-3 py-2"></td>
                      <td className="border px-3 py-2 text-sm text-right text-purple-700">
                        {reportData.currentInventory.reduce((sum, i) => sum + Number(i.value || 0), 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Report Footer */}
          <div className="border-t-2 border-gray-800 pt-4 mt-6 text-center text-sm text-gray-500">
            <p>End of Report | Ghous Trading Company | Generated on {format(new Date(), 'MMMM d, yyyy h:mm a')}</p>
          </div>
        </div>
      )}
    </div>
  )
}
