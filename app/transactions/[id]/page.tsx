'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'

interface Transaction {
  id: string
  companyId: string
  transactionDate: string
  type: string
  status: string
  amount: string
  fromDetails: {
    fromName: string
    bankName: string
    bankAccount: string
  } | null
  toDetails: {
    companyBank: string
    companyBankAccount: string
  } | null
  prReceiptNumber: string | null
  prReceiptDate: string | null
  description: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  company: {
    id: string
    name: string
    address: string
    contactInfo: string
  }
}

interface BankAccount {
  id: string
  bank_name: string
  account_title: string
  account_number: string
}

export default function TransactionPage() {
  const params = useParams()
  const router = useRouter()
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal States
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  
  // Forms
  const [receiptForm, setReceiptForm] = useState({
    prReceiptNumber: '',
    prReceiptDate: new Date().toISOString().split('T')[0]
  })

  const [editForm, setEditForm] = useState({
    amount: '',
    transactionDate: '',
    description: '',
    notes: '',
    fromName: '',
    bankName: '',
    bankAccount: '',
    companyBank: '',
    companyBankAccount: '',
    status: ''
  })

  useEffect(() => {
    fetchTransaction()
    fetchBankAccounts()
  }, [])

  const fetchBankAccounts = async () => {
    try {
      const response = await fetch('/api/bank-accounts')
      const data = await response.json()
      setBankAccounts(data)
    } catch (error) {
      console.error('Failed to fetch bank accounts:', error)
    }
  }

  const fetchTransaction = async () => {
    try {
      const response = await fetch(`/api/transactions/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch transaction')
      const data = await response.json()
      setTransaction(data)
      
      // Initialize edit form
      setEditForm({
        amount: data.amount,
        transactionDate: new Date(data.transactionDate).toISOString().split('T')[0],
        description: data.description || '',
        notes: data.notes || '',
        fromName: data.fromDetails?.fromName || '',
        bankName: data.fromDetails?.bankName || '',
        bankAccount: data.fromDetails?.bankAccount || '',
        companyBank: data.toDetails?.companyBank || '',
        companyBankAccount: data.toDetails?.companyBankAccount || '',
        status: data.status
      })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) return

    try {
      const response = await fetch(`/api/transactions/${transaction?.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.back()
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transaction) return

    try {
      const payload = {
        amount: parseFloat(editForm.amount),
        transactionDate: new Date(editForm.transactionDate).toISOString(),
        description: editForm.description,
        notes: editForm.notes,
        status: editForm.status,
        fromDetails: {
          fromName: editForm.fromName,
          bankName: editForm.bankName,
          bankAccount: editForm.bankAccount
        },
        toDetails: {
          companyBank: editForm.companyBank,
          companyBankAccount: editForm.companyBankAccount
        }
      }

      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setShowEditModal(false)
        fetchTransaction()
      }
    } catch (error) {
      console.error('Error editing transaction:', error)
    }
  }

  const handleReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transaction) return

    try {
      const payload = {
        status: 'Completed',
        prReceiptNumber: receiptForm.prReceiptNumber,
        prReceiptDate: new Date(receiptForm.prReceiptDate).toISOString()
      }

      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setShowReceiptModal(false)
        fetchTransaction()
      }
    } catch (error) {
      console.error('Error updating transaction:', error)
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
  if (!transaction) return <div className="p-8 text-center">Transaction not found</div>

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 print:bg-white print:p-0">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Navigation & Actions - Hidden on Print */}
        <div className="flex justify-between items-center print:hidden">
            <button onClick={() => router.back()} className="text-sm font-medium text-gray-500 hover:text-blue-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                Back
            </button>
            <div className="flex gap-3">
                {transaction.status === 'Pending' && (
                    <button 
                        onClick={() => setShowReceiptModal(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 shadow-sm text-sm font-medium"
                    >
                        Complete
                    </button>
                )}
                <button 
                    onClick={() => setShowEditModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 shadow-sm text-sm font-medium"
                >
                    Edit
                </button>
                <button 
                    onClick={handleDelete}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 shadow-sm text-sm font-medium"
                >
                    Delete
                </button>
                <button 
                    onClick={handlePrint}
                    className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 shadow-sm text-sm font-medium flex items-center"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                    Print
                </button>
            </div>
        </div>

        {/* Voucher Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden print:shadow-none print:border-0 print:rounded-none">
            {/* Voucher Header */}
            <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 print:bg-white print:border-b-2 print:border-gray-900">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">Payment Voucher</h1>
                        <p className="text-gray-500 mt-1">Transaction ID: <span className="font-mono text-gray-700">{transaction.id.slice(0, 8)}</span></p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Date</p>
                        <p className="text-lg font-semibold text-gray-900">{format(new Date(transaction.transactionDate), 'MMMM d, yyyy')}</p>
                    </div>
                </div>
            </div>

            {/* Voucher Body */}
            <div className="p-8 space-y-8">
                
                {/* Status Badge - Hidden on Print if you want, or keep it */}
                <div className="flex justify-end print:hidden">
                     <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                        transaction.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {transaction.status}
                      </span>
                </div>

                {/* Amount Section */}
                <div className="bg-blue-50 p-6 rounded-lg text-center border border-blue-100 print:bg-white print:border-2 print:border-gray-900">
                    <p className="text-sm text-blue-600 font-medium uppercase tracking-wider mb-1 print:text-gray-600">Amount Paid</p>
                    <p className="text-4xl font-bold text-blue-900 print:text-black">PKR {parseFloat(transaction.amount).toLocaleString()}</p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                    {/* From Section */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-100 pb-1">Paid By (Sender)</h3>
                        {transaction.fromDetails ? (
                            <div className="space-y-1">
                                <p className="text-lg font-medium text-gray-900">{transaction.fromDetails.fromName}</p>
                                <p className="text-gray-600">{transaction.fromDetails.bankName}</p>
                                <p className="text-gray-500 font-mono text-sm">{transaction.fromDetails.bankAccount}</p>
                            </div>
                        ) : (
                            <p className="text-gray-400 italic">No sender details</p>
                        )}
                    </div>

                    {/* To Section */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-100 pb-1">Paid To (Receiver)</h3>
                        <div className="space-y-1">
                            <p className="text-lg font-medium text-gray-900">{transaction.company.name}</p>
                            {transaction.toDetails ? (
                                <>
                                    <p className="text-gray-600">{transaction.toDetails.companyBank}</p>
                                    <p className="text-gray-500 font-mono text-sm">{transaction.toDetails.companyBankAccount}</p>
                                </>
                            ) : (
                                <p className="text-gray-600">{transaction.company.address}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</h3>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded border border-gray-100 print:bg-white print:border-none print:p-0">
                        {transaction.description || 'No description provided'}
                    </p>
                </div>

                {/* PR Receipt Section */}
                {transaction.prReceiptNumber && (
                    <div className="border-t border-dashed border-gray-300 pt-6">
                        <h3 className="text-sm font-bold text-gray-900 mb-3">PR Receipt Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-gray-500 text-sm">Receipt Number:</span>
                                <span className="ml-2 font-medium text-gray-900">{transaction.prReceiptNumber}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 text-sm">Receipt Date:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                    {transaction.prReceiptDate && format(new Date(transaction.prReceiptDate), 'MMM d, yyyy')}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer / Signatures for Print */}
            <div className="hidden print:block mt-16 pt-8 px-8 pb-8">
                <div className="flex justify-between">
                    <div className="text-center">
                        <div className="w-48 border-t border-gray-400 mb-2"></div>
                        <p className="text-sm text-gray-600">Authorized Signature</p>
                    </div>
                    <div className="text-center">
                        <div className="w-48 border-t border-gray-400 mb-2"></div>
                        <p className="text-sm text-gray-600">Receiver Signature</p>
                    </div>
                </div>
                <div className="text-center mt-12 text-xs text-gray-400">
                    Generated by GTC Management System on {format(new Date(), 'PPpp')}
                </div>
            </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto print:hidden" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowReceiptModal(false)}></div>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                             <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Complete Transaction</h3>
                                <div className="mt-6 space-y-4">
                                    <form onSubmit={handleReceiptSubmit} id="receipt-form-page">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">PR Receipt Number</label>
                                            <input
                                            type="text"
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                            value={receiptForm.prReceiptNumber}
                                            onChange={(e) => setReceiptForm({...receiptForm, prReceiptNumber: e.target.value})}
                                            />
                                        </div>
                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700">Receipt Date</label>
                                            <input
                                            type="date"
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                            value={receiptForm.prReceiptDate}
                                            onChange={(e) => setReceiptForm({...receiptForm, prReceiptDate: e.target.value})}
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
                            form="receipt-form-page"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Complete
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowReceiptModal(false)}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto print:hidden" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowEditModal(false)}></div>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Edit Transaction</h3>
                                <div className="mt-6 space-y-4">
                                    <form onSubmit={handleEditSubmit} id="edit-transaction-form">
                                        <div className="bg-gray-50 p-4 rounded-md mb-4">
                                            <label className="block text-sm font-medium text-gray-700">Amount (PKR)</label>
                                            <input
                                                type="number"
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 text-lg font-semibold"
                                                value={editForm.amount}
                                                onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                                            />
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">From Name</label>
                                                <input
                                                type="text"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                                                value={editForm.fromName}
                                                onChange={(e) => setEditForm({...editForm, fromName: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Date</label>
                                                <input
                                                type="date"
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                                                value={editForm.transactionDate}
                                                onChange={(e) => setEditForm({...editForm, transactionDate: e.target.value})}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">From Bank Account</label>
                                            <select
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                                                value={editForm.bankAccount}
                                                onChange={(e) => {
                                                    const account = bankAccounts.find(a => a.account_number === e.target.value);
                                                    if (account) {
                                                        setEditForm({
                                                            ...editForm,
                                                            bankName: account.bank_name,
                                                            bankAccount: account.account_number
                                                        });
                                                    } else {
                                                        setEditForm({
                                                            ...editForm,
                                                            bankName: '',
                                                            bankAccount: ''
                                                        });
                                                    }
                                                }}
                                            >
                                                <option value="">Select Account</option>
                                                {bankAccounts.map((account) => (
                                                    <option key={account.id} value={account.account_number}>
                                                        {account.bank_name} - {account.account_title} ({account.account_number})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="relative my-6">
                                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                                <div className="w-full border-t border-gray-300"></div>
                                            </div>
                                            <div className="relative flex justify-center">
                                                <span className="px-2 bg-white text-sm text-gray-500">Receiver Details</span>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Company Bank</label>
                                                <input
                                                type="text"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                                                value={editForm.companyBank}
                                                onChange={(e) => setEditForm({...editForm, companyBank: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Company Account #</label>
                                                <input
                                                type="text"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                                                value={editForm.companyBankAccount}
                                                onChange={(e) => setEditForm({...editForm, companyBankAccount: e.target.value})}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Description</label>
                                            <textarea
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                                                rows={2}
                                                value={editForm.description}
                                                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                            />
                                        </div>

                                        <div className="mt-4">
                                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Notes</label>
                                            <textarea
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                                                rows={2}
                                                value={editForm.notes}
                                                onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                                            />
                                        </div>

                                        <div className="mt-4">
                                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
                                            <select
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                                                value={editForm.status}
                                                onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Completed">Completed</option>
                                            </select>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="submit"
                            form="edit-transaction-form"
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
