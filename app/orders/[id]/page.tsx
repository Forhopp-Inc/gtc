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

// Helper function to check if order was paid from balance
const isPaidFromBalance = (payments: Payment[]) => {
  return payments.some(p => p.paymentMethod === 'Balance')
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
  handledBy: string
  customer: Customer
  orderItems: OrderItem[]
  payments: Payment[]
}

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    status: '',
    notes: '',
    orderDate: ''
  })

  useEffect(() => {
    fetchOrderDetails()
  }, [])

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch order')
      const data = await response.json()
      setOrder(data)
      setEditForm({
        status: data.status,
        notes: data.notes || '',
        orderDate: data.orderDate ? new Date(data.orderDate).toISOString().slice(0, 16) : ''
      })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!order) return

    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        setShowEditModal(false)
        fetchOrderDetails()
      }
    } catch (error) {
      console.error('Error updating order:', error)
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
                    onClick={() => setShowEditModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 shadow-sm text-sm font-medium flex items-center"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    Edit Order
                </button>
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
                        <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">Ghous Trading Company</h1>
                        <p className="text-gray-600 text-sm mt-1">Grain Market, More Khunda, Nankana Sahib, Pakistan</p>
                        <p className="text-gray-600 text-sm">Contact: +923018481383</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">Invoice #{order.orderNumber}</p>
                        <p className="text-sm text-gray-600">{format(new Date(order.orderDate), 'MMMM d, yyyy')}</p>
                        <p className="text-sm text-gray-600">{format(new Date(order.orderDate), 'p')}</p>
                        {order.handledBy && <p className="text-sm text-gray-600 mt-1">Handled By: {order.handledBy}</p>}
                        <div className="mt-2 print:hidden">
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
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {order.orderItems.map((item) => (
                                <tr key={item.id}>
                                    <td className="px-4 py-3 text-sm text-gray-900">{item.product.name}</td>
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

            {/* Footer / Generated By for Print */}
            <div className="hidden print:block mt-8 pt-8 px-8 pb-8 border-t border-gray-200">
                <div className="text-center text-xs text-gray-500">
                    Generated on {format(new Date(), 'PPpp')}
                </div>
            </div>
        </div>
      </div>

      {/* Edit Order Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowEditModal(false)}></div>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                            Edit Order Details
                        </h3>
                        <form onSubmit={handleEditOrder} id="edit-form" className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Order Date & Time
                                </label>
                                <input
                                    type="datetime-local"
                                    className="input-field"
                                    value={editForm.orderDate}
                                    onChange={(e) => setEditForm({ ...editForm, orderDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    className="input-field"
                                    value={editForm.status}
                                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                                {editForm.status === 'Cancelled' && order.status !== 'Cancelled' && (
                                    (() => {
                                        const paidFromBalance = isPaidFromBalance(order.payments);
                                        const refundAmount = paidFromBalance 
                                            ? parseFloat(order.totalAmount) 
                                            : parseFloat(order.remainingAmount);
                                        
                                        if (refundAmount > 0) {
                                            return (
                                                <p className="text-sm text-amber-600 mt-1">
                                                    ⚠️ Cancelling will refund Rs. {refundAmount.toLocaleString()} from customer balance
                                                    {paidFromBalance && ' (paid from balance)'}
                                                </p>
                                            );
                                        }
                                        return null;
                                    })()
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes
                                </label>
                                <textarea
                                    className="input-field"
                                    rows={4}
                                    value={editForm.notes}
                                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                />
                            </div>
                        </form>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="submit"
                            form="edit-form"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Save Changes
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowEditModal(false)}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}
