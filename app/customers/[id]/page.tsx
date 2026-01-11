'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'

interface OrderItem {
  id: string
  product: {
    name: string
    category: string
  }
  quantity: string
  sellingPrice: string
  totalRevenue: string
  profit: string
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
  orderItems: OrderItem[]
}

interface Payment {
  id: string
  paymentDate: string
  amount: string
  paymentMethod: string
  referenceNo: string | null
  notes: string | null
  type: string
}

interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  cnic: string | null
  balance: string
  orders: Order[]
  payments: Payment[]
  createdAt: string
}

export default function CustomerDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'orders' | 'payments'>('orders')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    cnic: ''
  })
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    referenceNo: '',
    bankName: '',
    collectedBy: '',
    amountGiver: '',
    receivedBy: '',
    notes: '',
    type: 'credit'
  })

  const collectors = [
    "Tahir Mahmood",
    "Nasir Mahmood", 
    "Hammad Nasir",
    "Hassan",
    "Kashif Mahmood",
    "Khaleel Ur Rehman",
    "Huzaifa Karamat"
  ]

  useEffect(() => {
    fetchCustomerDetails()
  }, [])

  const fetchCustomerDetails = async () => {
    try {
      const response = await fetch(`/api/customers/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch customer')
      const data = await response.json()
      setCustomer(data)
      setEditForm({
        name: data.name,
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        cnic: data.cnic || ''
      })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customer) return

    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        setShowEditModal(false)
        fetchCustomerDetails()
      }
    } catch (error) {
      console.error('Error updating customer:', error)
    }
  }

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customer) return

    try {
      let payload = { ...paymentForm };

      if (paymentForm.type === 'debit') {
        // Withdraw Logic
        payload.referenceNo = paymentForm.amountGiver;
        payload.notes = `Received By: ${paymentForm.receivedBy}${paymentForm.notes ? `. ${paymentForm.notes}` : ''}`;
      } else {
        // Payment Logic
        payload.referenceNo = paymentForm.paymentMethod === 'Cash' 
            ? paymentForm.collectedBy 
            : paymentForm.referenceNo;
      }

      const response = await fetch(`/api/customers/${customer.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setShowPaymentModal(false)
        setPaymentForm({
            amount: '',
            paymentDate: new Date().toISOString().split('T')[0],
            paymentMethod: 'Cash',
            referenceNo: '',
            bankName: '',
            collectedBy: '',
            amountGiver: '',
            receivedBy: '',
            notes: '',
            type: 'credit'
        })
        fetchCustomerDetails()
      }
    } catch (error) {
      console.error('Error adding payment:', error)
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
  if (!customer) return <div className="p-8 text-center text-gray-500">Customer not found</div>

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <Link href="/customers" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-2 inline-flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                    Back to Customers
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mt-1">{customer.name}</h1>
                <div className="flex flex-col gap-1 mt-2 text-gray-600 text-sm">
                    {customer.phone && (
                        <span className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                            {customer.phone}
                        </span>
                    )}
                    {customer.email && (
                        <span className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                            {customer.email}
                        </span>
                    )}
                    {customer.address && (
                        <span className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                            {customer.address}
                        </span>
                    )}
                </div>
            </div>
            
            <div className="flex flex-col items-end gap-3 w-full md:w-auto">
            <div className={`${Number(customer.balance) > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'} px-6 py-4 rounded-lg border text-right w-full md:w-auto`}>
                <p className={`text-sm font-medium uppercase tracking-wider ${Number(customer.balance) > 0 ? 'text-red-800' : 'text-green-800'}`}>
                    {Number(customer.balance) > 0 ? 'Current Balance (Udhar)' : 'Advance Balance (Credit)'}
                </p>
                <p className={`text-3xl font-bold ${Number(customer.balance) > 0 ? 'text-red-700' : 'text-green-700'}`}>
                    Rs. {Math.abs(parseFloat(customer.balance)).toLocaleString()}
                </p>
            </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg shadow-sm transition-all text-sm font-medium w-full md:w-auto"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        Edit Details
                    </button>
                    <button
                        onClick={() => {
                            setPaymentForm(prev => ({ ...prev, type: 'debit', amount: '', notes: '', referenceNo: '', bankName: '', collectedBy: '', amountGiver: '', receivedBy: '' }))
                            setShowPaymentModal(true)
                        }}
                        className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg shadow-sm transition-all text-sm font-medium w-full md:w-auto"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"/></svg>
                        Withdraw
                    </button>
                    <button
                        onClick={() => {
                            setPaymentForm(prev => ({ ...prev, type: 'credit', amount: '', notes: '', referenceNo: '', bankName: '', collectedBy: '', amountGiver: '', receivedBy: '' }))
                            setShowPaymentModal(true)
                        }}
                        className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg shadow-sm transition-all text-sm font-medium w-full md:w-auto"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                        Add Payment
                    </button>
                </div>
            </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`${activeTab === 'orders' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                    Order History
                </button>
                <button
                    onClick={() => setActiveTab('payments')}
                    className={`${activeTab === 'payments' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                    Payment History
                </button>
            </nav>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order #</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Paid</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Remaining</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {customer.orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/orders/${order.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.orderNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(order.orderDate), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                            Rs. {parseFloat(order.totalAmount).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                            Rs. {parseFloat(order.paidAmount).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                            Rs. {parseFloat(order.remainingAmount).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                order.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                                {order.status}
                            </span>
                        </td>
                        </tr>
                    ))}
                    {customer.orders.length === 0 && (
                        <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">No orders found</td>
                        </tr>
                    )}
                    </tbody>
                </table>
                </div>
            </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {customer.payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/payments/${payment.id}`)}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(payment.paymentDate), 'MMM d, yyyy')}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${payment.type === 'debit' ? 'text-red-600' : 'text-green-600'}`}>
                            {payment.type === 'debit' ? '-' : '+'} Rs. {parseFloat(payment.amount).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.paymentMethod}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.referenceNo || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                            {payment.notes || '-'}
                        </td>
                        </tr>
                    ))}
                    {customer.payments.length === 0 && (
                        <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">No payments found</td>
                        </tr>
                    )}
                    </tbody>
                </table>
                </div>
            </div>
        )}

      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowPaymentModal(false)}></div>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                    {paymentForm.type === 'debit' ? 'Record Withdrawal' : 'Record Payment'}
                                </h3>
                                <div className="mt-6 space-y-4">
                                    <form onSubmit={handleAddPayment} id="payment-form">
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Amount (PKR)</label>
                                                <input
                                                type="number"
                                                required
                                                min="1"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                value={paymentForm.amount}
                                                onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Date</label>
                                                <input
                                                type="date"
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                value={paymentForm.paymentDate}
                                                onChange={(e) => setPaymentForm({...paymentForm, paymentDate: e.target.value})}
                                                />
                                            </div>
                                        </div>

                                        {paymentForm.type === 'credit' && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                                    <select
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                        value={paymentForm.paymentMethod}
                                                        onChange={(e) => setPaymentForm({...paymentForm, paymentMethod: e.target.value})}
                                                    >
                                                        <option value="Cash">Cash</option>
                                                        <option value="Bank">Bank Transfer</option>
                                                        <option value="Cheque">Cheque</option>
                                                    </select>
                                                </div>

                                                {(paymentForm.paymentMethod === 'Bank' || paymentForm.paymentMethod === 'Cheque') && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                                                        <input
                                                        type="text"
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                        value={paymentForm.bankName}
                                                        onChange={(e) => setPaymentForm({...paymentForm, bankName: e.target.value})}
                                                        />
                                                    </div>
                                                )}

                                                {paymentForm.paymentMethod === 'Cash' && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Collected By</label>
                                                        <select
                                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                            value={paymentForm.collectedBy}
                                                            onChange={(e) => setPaymentForm({...paymentForm, collectedBy: e.target.value})}
                                                        >
                                                            <option value="">Select Collector</option>
                                                            {collectors.map((name) => (
                                                                <option key={name} value={name}>{name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {paymentForm.type === 'debit' && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                                    <select
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                        value={paymentForm.paymentMethod}
                                                        onChange={(e) => setPaymentForm({...paymentForm, paymentMethod: e.target.value})}
                                                    >
                                                        <option value="Cash">Cash</option>
                                                        <option value="Bank">Bank Transfer</option>
                                                        <option value="Cheque">Cheque</option>
                                                    </select>
                                                </div>

                                                {(paymentForm.paymentMethod === 'Bank' || paymentForm.paymentMethod === 'Cheque') && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                                                        <input
                                                        type="text"
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                        value={paymentForm.bankName}
                                                        onChange={(e) => setPaymentForm({...paymentForm, bankName: e.target.value})}
                                                        />
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Amount Giver/Approver</label>
                                                        <select
                                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                            value={paymentForm.amountGiver}
                                                            onChange={(e) => setPaymentForm({...paymentForm, amountGiver: e.target.value})}
                                                        >
                                                            <option value="">Select Person</option>
                                                            {collectors.map((name) => (
                                                                <option key={name} value={name}>{name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Received By</label>
                                                        <input
                                                            type="text"
                                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                            value={paymentForm.receivedBy}
                                                            onChange={(e) => setPaymentForm({...paymentForm, receivedBy: e.target.value})}
                                                            placeholder="Person receiving amount"
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Notes</label>
                                            <textarea
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                rows={2}
                                                value={paymentForm.notes}
                                                onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                                            />
                                        </div>

                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="submit"
                            form="payment-form"
                            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                                paymentForm.type === 'debit' 
                                    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                                    : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                            }`}
                        >
                            {paymentForm.type === 'debit' ? 'Record Withdrawal' : 'Record Payment'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowPaymentModal(false)}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowEditModal(false)}></div>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                            Edit Customer Details
                        </h3>
                        <form onSubmit={handleEditCustomer} id="edit-form" className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Customer Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="input-field"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone
                                </label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    className="input-field"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    CNIC
                                </label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={editForm.cnic}
                                    onChange={(e) => setEditForm({ ...editForm, cnic: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Address
                                </label>
                                <textarea
                                    className="input-field"
                                    rows={3}
                                    value={editForm.address}
                                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
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
