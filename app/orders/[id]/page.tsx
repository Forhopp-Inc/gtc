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

interface ReturnItem {
  orderItemId: string
  quantity: number
  maxQuantity: number
  productName: string
  sellingPrice: number
}

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [editForm, setEditForm] = useState({
    status: '',
    notes: '',
    orderDate: ''
  })
  
  // Loading states for buttons to prevent double-clicks
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isReturning, setIsReturning] = useState(false)
  
  // Return items state
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([])

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
      // Initialize return items
      setReturnItems(data.orderItems.map((item: OrderItem) => ({
        orderItemId: item.id,
        quantity: 0,
        maxQuantity: parseFloat(item.quantity),
        productName: item.product.name,
        sellingPrice: parseFloat(item.sellingPrice)
      })))
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!order || isEditing) return

    setIsEditing(true)
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
    } finally {
      setIsEditing(false)
    }
  }

  const handleDeleteOrder = async () => {
    if (!order || isDeleting) return
    
    if (!confirm(`Are you sure you want to delete order #${order.orderNumber}? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/orders')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete order')
      }
    } catch (error) {
      console.error('Error deleting order:', error)
      alert('Failed to delete order')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleReturnItems = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!order || isReturning) return

    // Filter items with quantity > 0
    const itemsToReturn = returnItems
      .filter(item => item.quantity > 0)
      .map(item => ({
        orderItemId: item.orderItemId,
        quantity: item.quantity
      }))

    if (itemsToReturn.length === 0) {
      alert('Please select at least one item to return')
      return
    }

    // Calculate total refund for confirmation
    const totalRefund = returnItems.reduce((sum, item) => {
      return sum + (item.quantity * item.sellingPrice)
    }, 0)

    if (!confirm(`Are you sure you want to return these items? This will refund Rs. ${totalRefund.toLocaleString()} to the customer's balance and add the items back to inventory.`)) {
      return
    }

    setIsReturning(true)
    try {
      const response = await fetch(`/api/orders/${order.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToReturn })
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Return processed successfully! Refund amount: Rs. ${data.refundAmount.toLocaleString()}`)
        setShowReturnModal(false)
        fetchOrderDetails()
      } else {
        alert(data.error || 'Failed to process return')
      }
    } catch (error) {
      console.error('Error processing return:', error)
      alert('Failed to process return')
    } finally {
      setIsReturning(false)
    }
  }

  const updateReturnQuantity = (orderItemId: string, quantity: number) => {
    setReturnItems(prev => prev.map(item => 
      item.orderItemId === orderItemId 
        ? { ...item, quantity: Math.min(Math.max(0, quantity), item.maxQuantity) }
        : item
    ))
  }

  const calculateReturnTotal = () => {
    return returnItems.reduce((sum, item) => {
      return sum + (item.quantity * item.sellingPrice)
    }, 0)
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
                {order.status !== 'Cancelled' && order.status !== 'Returned' && order.orderItems.length > 0 && (
                    <button 
                        onClick={() => setShowReturnModal(true)}
                        disabled={isReturning}
                        className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 shadow-sm text-sm font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
                        Return Items
                    </button>
                )}
                <button 
                    onClick={() => setShowEditModal(true)}
                    disabled={isEditing}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 shadow-sm text-sm font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
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
                <button 
                    onClick={handleDeleteOrder}
                    disabled={isDeleting}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 shadow-sm text-sm font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isDeleting ? (
                        <>
                            <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Deleting...
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            Delete
                        </>
                    )}
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
                                order.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                                order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                order.status === 'Returned' ? 'bg-purple-100 text-purple-800' :
                                'bg-yellow-100 text-yellow-800'
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
                    {order.orderItems.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">All items have been returned</p>
                    ) : (
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
                    )}
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
                        <p className="text-sm text-gray-600 whitespace-pre-line">{order.notes}</p>
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
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => !isEditing && setShowEditModal(false)}></div>
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
                                    disabled={isEditing}
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
                                    disabled={isEditing}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                    <option value="Returned">Returned</option>
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
                                    disabled={isEditing}
                                />
                            </div>
                        </form>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="submit"
                            form="edit-form"
                            disabled={isEditing}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isEditing ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowEditModal(false)}
                            disabled={isEditing}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Return Items Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="return-modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => !isReturning && setShowReturnModal(false)}></div>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex items-center mb-4">
                            <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-amber-100 mr-3">
                                <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
                                </svg>
                            </div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900" id="return-modal-title">
                                Return Items
                            </h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                            Select the items and quantities you want to return. The items will be added back to inventory and the amount will be deducted from customer&apos;s balance.
                        </p>
                        <form onSubmit={handleReturnItems} id="return-form">
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {returnItems.map((item) => (
                                    <div key={item.orderItemId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{item.productName}</p>
                                            <p className="text-sm text-gray-500">
                                                Available: {item.maxQuantity} | Price: Rs. {item.sellingPrice.toLocaleString()}/unit
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => updateReturnQuantity(item.orderItemId, item.quantity - 1)}
                                                disabled={isReturning || item.quantity <= 0}
                                                className="p-1 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"/>
                                                </svg>
                                            </button>
                                            <input
                                                type="number"
                                                min="0"
                                                max={item.maxQuantity}
                                                step="0.01"
                                                value={item.quantity}
                                                onChange={(e) => updateReturnQuantity(item.orderItemId, parseFloat(e.target.value) || 0)}
                                                disabled={isReturning}
                                                className="w-20 text-center border border-gray-300 rounded-md py-1 px-2 disabled:opacity-50"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => updateReturnQuantity(item.orderItemId, item.quantity + 1)}
                                                disabled={isReturning || item.quantity >= item.maxQuantity}
                                                className="p-1 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateReturnQuantity(item.orderItemId, item.maxQuantity)}
                                                disabled={isReturning}
                                                className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                                            >
                                                All
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Return Total */}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-gray-900">Total Refund Amount:</span>
                                    <span className="text-xl font-bold text-amber-600">Rs. {calculateReturnTotal().toLocaleString()}</span>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="submit"
                            form="return-form"
                            disabled={isReturning || calculateReturnTotal() === 0}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-amber-600 text-base font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isReturning ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </>
                            ) : (
                                'Process Return'
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowReturnModal(false)}
                            disabled={isReturning}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
