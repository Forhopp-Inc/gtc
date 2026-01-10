'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'

interface Product {
  id: string
  name: string
  description: string
  category: string
}

interface OrderItem {
  id: string
  product: Product
  quantity: string
  buyingPrice: string
  sellingPrice: string
  totalCost: string
  totalRevenue: string
  profit: string
}

interface Customer {
  id: string
  name: string
  phone: string
  email: string
  address: string
}

interface Payment {
  id: string
  paymentDate: string
  amount: string
  paymentMethod: string
  referenceNo: string
  notes: string
}

interface Order {
  id: string
  orderNumber: string
  orderDate: string
  totalAmount: string
  paidAmount: string
  remainingAmount: string
  status: string
  notes: string | null
  customer: Customer
  orderItems: OrderItem[]
  payments: Payment[]
}

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrderDetails()
  }, [])

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch order')
      const data = await response.json()
      setOrder(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
  if (!order) return <div className="p-8 text-center text-gray-500">Order not found</div>

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation & Actions - Hidden on Print */}
        <div className="flex justify-between items-center print:hidden">
            <button onClick={() => router.back()} className="text-sm font-medium text-gray-500 hover:text-blue-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                Back
            </button>
            <div className="flex gap-3">
                <button 
                    onClick={handlePrint}
                    className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 shadow-sm text-sm font-medium flex items-center"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                    Print Invoice
                </button>
            </div>
        </div>

        {/* Invoice Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden print:shadow-none print:border-0 print:rounded-none">
            {/* Invoice Header */}
            <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 print:bg-white print:border-b-2 print:border-gray-900">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">Invoice</h1>
                        <p className="text-gray-500 mt-1">Order #: <span className="font-mono text-gray-700">{order.orderNumber}</span></p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Date</p>
                        <p className="text-lg font-semibold text-gray-900">{format(new Date(order.orderDate), 'MMMM d, yyyy')}</p>
                        <div className="mt-2">
                             <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                order.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                                {order.status}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Invoice Body */}
            <div className="p-8 space-y-8">
                
                {/* Customer Details */}
                <div className="border-b border-gray-100 pb-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bill To</h3>
                    <div className="text-gray-900">
                        <p className="font-bold text-lg">{order.customer.name}</p>
                        <p>{order.customer.address}</p>
                        <p>{order.customer.phone}</p>
                        <p>{order.customer.email}</p>
                    </div>
                </div>

                {/* Order Items */}
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Order Items</h3>
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {order.orderItems.map((item) => (
                                <tr key={item.id}>
                                    <td className="px-4 py-3 text-sm text-gray-900">{item.product.name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{item.product.category}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900 text-right">Rs. {parseFloat(item.sellingPrice).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">Rs. {parseFloat(item.totalRevenue).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                    <div className="w-64 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="font-medium text-gray-900">Rs. {parseFloat(order.totalAmount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Paid Amount</span>
                            <span className="font-medium text-green-600">Rs. {parseFloat(order.paidAmount).toLocaleString()}</span>
                        </div>
                        <div className="border-t border-gray-200 pt-3 flex justify-between">
                            <span className="font-bold text-gray-900">Balance Due</span>
                            <span className="font-bold text-red-600 text-xl">Rs. {parseFloat(order.remainingAmount).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {order.notes && (
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-100 print:bg-white print:border-none print:p-0">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Notes</h4>
                        <p className="text-sm text-gray-600">{order.notes}</p>
                    </div>
                )}

            </div>

            {/* Footer / Signatures for Print */}
            <div className="hidden print:block mt-8 pt-8 px-8 pb-8">
                <div className="flex justify-between">
                    <div className="text-center">
                        <div className="w-48 border-t border-gray-400 mb-2"></div>
                        <p className="text-sm text-gray-600">Authorized Signature</p>
                    </div>
                    <div className="text-center">
                        <div className="w-48 border-t border-gray-400 mb-2"></div>
                        <p className="text-sm text-gray-600">Customer Signature</p>
                    </div>
                </div>
                <div className="text-center mt-12 text-xs text-gray-400">
                    Generated by GTC Management System on {format(new Date(), 'PPpp')}
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
