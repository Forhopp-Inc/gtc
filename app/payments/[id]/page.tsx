'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'

interface Payment {
  id: string
  paymentDate: string
  amount: string
  paymentMethod: string
  referenceNo: string | null
  bankName: string | null
  notes: string | null
  customer: {
    id: string
    name: string
    phone: string | null
  }
}

export default function PaymentDetailsPage() {
  const params = useParams()
  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPaymentDetails()
  }, [])

  const fetchPaymentDetails = async () => {
    try {
      const response = await fetch(`/api/payments/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch payment')
      const data = await response.json()
      setPayment(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
  if (!payment) return <div className="p-8 text-center text-gray-500">Payment not found</div>

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Payment Details</h1>
                    <p className="text-gray-500 text-sm mt-1">ID: {payment.id}</p>
                </div>
                <Link 
                    href={`/customers/${payment.customer.id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                    View Customer Profile
                </Link>
            </div>

            <div className="bg-green-50 p-6 rounded-lg border border-green-100 mb-8 text-center">
                <p className="text-sm text-green-800 uppercase tracking-wider font-medium mb-1">Amount Paid</p>
                <p className="text-4xl font-bold text-green-700">Rs. {parseFloat(payment.amount).toLocaleString()}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-500">Customer</label>
                    <p className="mt-1 text-lg font-medium text-gray-900">{payment.customer.name}</p>
                    {payment.customer.phone && <p className="text-sm text-gray-500">{payment.customer.phone}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-500">Payment Date</label>
                    <p className="mt-1 text-lg font-medium text-gray-900">
                        {format(new Date(payment.paymentDate), 'MMMM d, yyyy')}
                    </p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-500">Payment Method</label>
                    <p className="mt-1 text-lg font-medium text-gray-900">{payment.paymentMethod}</p>
                </div>
                
                {payment.paymentMethod === 'Cash' ? (
                    <div>
                        <label className="block text-sm font-medium text-gray-500">Collected By</label>
                        <p className="mt-1 text-lg font-medium text-gray-900">{payment.referenceNo || '-'}</p>
                    </div>
                ) : (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Bank Name</label>
                            <p className="mt-1 text-lg font-medium text-gray-900">{payment.bankName || '-'}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Reference / Cheque #</label>
                            <p className="mt-1 text-lg font-medium text-gray-900">{payment.referenceNo || '-'}</p>
                        </div>
                    </>
                )}

                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500">Notes</label>
                    <p className="mt-1 text-gray-900 whitespace-pre-wrap">{payment.notes || 'No notes'}</p>
                </div>
            </div>
        </div>

      </div>
    </div>
  )
}
