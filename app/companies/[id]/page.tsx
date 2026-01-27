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
    bankName?: string
    bankAccount?: string
    phone?: string
  } | null
  toDetails: {
    companyBank: string
    companyBankAccount: string
  } | null
  invoiceNumber: string | null
  prReceiptNumber: string | null
  prReceiptDate: string | null
  description: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

interface Product {
  id: string
  name: string
  description: string
  category: string
  stockQuantity: number
  companyId: string
  createdAt: string
  updatedAt: string
  lastPurchase?: {
    id: string
    date: string
    amount: string
    invoiceNumber: string
  }
}

interface Company {
  id: string
  name: string
  contactInfo: string | null
  address: string | null
  officerId: string | null
  createdAt: string
  updatedAt: string
  products: Product[]
  transactions: Transaction[]
}

interface BankAccount {
  id: string
  bank_name: string
  account_title: string
  account_number: string
}

export default function CompanyDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreditModal, setShowCreditModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'products' | 'transactions'>('transactions')

  // Print Date Range State
  const [printDateRange, setPrintDateRange] = useState({
    startDate: '',
    endDate: ''
  })

  // Credit Form State
  const [creditForm, setCreditForm] = useState({
    amount: '',
    fromName: '',
    bankName: '',
    bankAccount: '',
    date: new Date().toISOString().split('T')[0],
    companyBank: '',
    companyBankAccount: ''
  })

  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: '',
    contactInfo: '',
    address: ''
  })

  useEffect(() => {
    fetchCompanyDetails()
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

  const totalBalance = company?.transactions
    .filter(t => t.status === 'Completed' || (t.status === 'Pending' && t.type === 'Purchase'))
    .reduce((acc, curr) => {
        const amount = parseFloat(curr.amount);
        if (curr.type === 'Purchase') {
            return acc - amount;
        }
        return acc + amount;
    }, 0) || 0

  const fetchCompanyDetails = async () => {
    try {
      const response = await fetch(`/api/companies/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch company')
      const data = await response.json()
      setCompany(data)
      setEditForm({
        name: data.name || '',
        contactInfo: data.contactInfo || '',
        address: data.address || ''
      })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) return

    try {
      const response = await fetch(`/api/companies/${company.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          contactInfo: editForm.contactInfo,
          address: editForm.address
        })
      })

      if (response.ok) {
        setShowEditModal(false)
        fetchCompanyDetails()
      }
    } catch (error) {
      console.error('Error updating company:', error)
    }
  }

  const handleDeleteCompany = async () => {
    if (!company) return
    if (!confirm(`Are you sure you want to delete "${company.name}"? This will also delete all associated transactions and products. This action cannot be undone.`)) return

    try {
      const response = await fetch(`/api/companies/${company.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/companies')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete company')
      }
    } catch (error) {
      console.error('Error deleting company:', error)
      alert('Failed to delete company')
    }
  }

  const handleAddCredit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) return

    try {
      const payload = {
        companyId: company.id,
        transactionDate: new Date(creditForm.date).toISOString(),
        type: 'Credit',
        status: 'Pending',
        amount: parseFloat(creditForm.amount),
        fromDetails: {
          fromName: creditForm.fromName,
          bankName: creditForm.bankName,
          bankAccount: creditForm.bankAccount
        },
        toDetails: {
          companyBank: creditForm.companyBank,
          companyBankAccount: creditForm.companyBankAccount
        },
        description: `Credit Payment to ${company.name}`
      }

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setShowCreditModal(false)
        setCreditForm({
            amount: '',
            fromName: '',
            bankName: '',
            bankAccount: '',
            date: new Date().toISOString().split('T')[0],
            companyBank: '',
            companyBankAccount: ''
        })
        fetchCompanyDetails()
      }
    } catch (error) {
      console.error('Error adding credit:', error)
    }
  }


  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
  if (!company) return <div className="p-8 text-center text-gray-500">Company not found</div>

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <div className="flex items-center justify-between">
                    <Link href="/companies" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-2 inline-flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                        Back to Companies
                    </Link>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="text-gray-500 hover:text-blue-600 p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                            title="Edit Company"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                        </button>
                        <button
                            onClick={handleDeleteCompany}
                            className="text-gray-500 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                            title="Delete Company"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                    </div>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mt-1">{company.name}</h1>
                <div className="flex items-center gap-4 mt-2 text-gray-600 text-sm">
                    {company.contactInfo && (
                        <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                            {company.contactInfo}
                        </span>
                    )}
                    {company.address && (
                        <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                            {company.address}
                        </span>
                    )}
                </div>
            </div>
            
            <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                <div className={`${totalBalance >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'} px-6 py-3 rounded-lg border text-right w-full md:w-auto`}>
                    <p className={`text-sm font-medium ${totalBalance >= 0 ? 'text-green-800' : 'text-red-800'} uppercase tracking-wider`}>Total Balance</p>
                    <p className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>PKR {totalBalance.toLocaleString()}</p>
                </div>
                <button
                    onClick={() => setShowCreditModal(true)}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg shadow-sm transition-all text-sm font-medium w-full md:w-auto"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                    Add Credit
                </button>
            </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
                <button
                    onClick={() => setActiveTab('transactions')}
                    className={`${activeTab === 'transactions' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                    Transactions History
                </button>
                <button
                    onClick={() => setActiveTab('products')}
                    className={`${activeTab === 'products' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                    Products Inventory
                </button>
            </nav>
        </div>

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">{company.transactions.length} records</span>
                        <button
                            onClick={() => setShowPrintModal(true)}
                            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white px-3 py-1.5 rounded-md shadow-sm transition-all text-sm font-medium"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                            Print Report
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">PR Receipt</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {company.transactions.map((tx) => (
                        <tr 
                            key={tx.id} 
                            className="group transition-colors hover:bg-gray-50 cursor-pointer"
                            onClick={() => router.push(`/transactions/${tx.id}`)}
                        >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {format(new Date(tx.transactionDate), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{tx.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            PKR {parseFloat(tx.amount).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full ${
                            tx.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                            {tx.status || 'Pending'}
                            </span>
                            {tx.status === 'Pending' && (
                                <span className="ml-2 text-xs text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Action Needed
                                </span>
                            )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                            {tx.type === 'Purchase' ? (
                                <div className="max-w-xs">
                                    {tx.fromDetails && (
                                        <div className="mb-1 text-xs text-gray-500">
                                            <span className="font-semibold text-gray-700">From: </span>
                                            {tx.fromDetails.fromName}
                                        </div>
                                    )}
                                    <p className="text-gray-900 text-sm whitespace-normal leading-snug">{tx.description}</p>
                                    {tx.notes && <p className="text-xs text-gray-500 mt-1">{tx.notes}</p>}
                                </div>
                            ) : (
                                tx.fromDetails && (
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="w-10 text-xs font-semibold text-gray-400 uppercase">From</span>
                                            <span className="text-gray-900">{tx.fromDetails.fromName}</span>
                                            <span className="text-xs text-gray-500">({tx.fromDetails.bankName})</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-10 text-xs font-semibold text-gray-400 uppercase">To</span>
                                            <span className="text-gray-900">{company.name}</span>
                                            <span className="text-xs text-gray-500">({tx.toDetails?.companyBank})</span>
                                        </div>
                                    </div>
                                )
                            )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {tx.prReceiptNumber ? (
                                <div>
                                    <p className="font-medium text-gray-900">{tx.prReceiptNumber}</p>
                                    <p className="text-xs text-gray-500">{tx.prReceiptDate && format(new Date(tx.prReceiptDate), 'MMM d, yyyy')}</p>
                                </div>
                            ) : (
                                <span className="text-gray-400">-</span>
                            )}
                        </td>
                        </tr>
                    ))}
                    {company.transactions.length === 0 && (
                        <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                            <div className="flex flex-col items-center gap-2">
                                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                                No transactions found
                            </div>
                        </td>
                        </tr>
                    )}
                    </tbody>
                </table>
                </div>
            </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Products Inventory</h3>
                    <span className="text-sm text-gray-500">{company.products.length} items</span>
                </div>
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Added On</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Purchase</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {company.products.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                product.category === 'Pesticide' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                            }`}>
                                {product.category}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="font-semibold bg-gray-100 px-2 py-1 rounded">{product.stockQuantity || 0}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(product.createdAt), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.lastPurchase ? (
                                <div>
                                    <p className="text-gray-900 font-medium">PKR {parseFloat(product.lastPurchase.amount).toLocaleString()}</p>
                                    <p className="text-xs text-gray-500">{format(new Date(product.lastPurchase.date), 'MMM d, yyyy')}</p>
                                </div>
                            ) : (
                                <span className="text-gray-400">-</span>
                            )}
                        </td>
                        </tr>
                    ))}
                    {company.products.length === 0 && (
                        <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                            <div className="flex flex-col items-center gap-2">
                                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                                No products found
                            </div>
                        </td>
                        </tr>
                    )}
                    </tbody>
                </table>
                </div>
            </div>
        )}

      </div>

      {/* Edit Company Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowEditModal(false)}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Edit Company</h3>
                                <div className="mt-6 space-y-4">
                                    <form onSubmit={handleEditCompany} id="edit-company-form">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Company Name</label>
                                            <input
                                                type="text"
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                value={editForm.name}
                                                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                            />
                                        </div>
                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700">Contact Info (Phone)</label>
                                            <input
                                                type="text"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                value={editForm.contactInfo}
                                                onChange={(e) => setEditForm({...editForm, contactInfo: e.target.value})}
                                            />
                                        </div>
                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700">Address</label>
                                            <textarea
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                rows={3}
                                                value={editForm.address}
                                                onChange={(e) => setEditForm({...editForm, address: e.target.value})}
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
                            form="edit-company-form"
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

      {/* Print Report Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowPrintModal(false)}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 sm:mx-0 sm:h-10 sm:w-10">
                                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Print Transaction Report</h3>
                                <div className="mt-4">
                                    <p className="text-sm text-gray-500">Select a date range to filter transactions, or leave empty to print all transactions.</p>
                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Start Date</label>
                                            <input
                                                type="date"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                value={printDateRange.startDate}
                                                onChange={(e) => setPrintDateRange({...printDateRange, startDate: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">End Date</label>
                                            <input
                                                type="date"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                value={printDateRange.endDate}
                                                onChange={(e) => setPrintDateRange({...printDateRange, endDate: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Print Preview */}
                                <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden" id="print-content">
                                    <div className="bg-white p-3">
                                        {/* Report Header - Compact Design */}
                                        <div className="border-b-2 border-gray-900 pb-2 mb-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h1 className="text-base font-bold text-gray-900">Transaction History</h1>
                                                    <p className="text-gray-700 font-medium text-sm">{company.name}</p>
                                                    {company.address && <p className="text-gray-500" style={{fontSize: '9px'}}>{company.address}</p>}
                                                </div>
                                                <div className="text-right" style={{fontSize: '9px'}}>
                                                    {(printDateRange.startDate || printDateRange.endDate) && (
                                                        <p className="font-medium text-gray-700">
                                                            {printDateRange.startDate ? format(new Date(printDateRange.startDate), 'MMM d, yyyy') : 'Start'} - {printDateRange.endDate ? format(new Date(printDateRange.endDate), 'MMM d, yyyy') : 'Present'}
                                                        </p>
                                                    )}
                                                    <p className="text-gray-500">Generated: {format(new Date(), 'MMM d, yyyy h:mm a')}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Summary - Inline */}
                                        <div className="flex gap-2 mb-3" style={{fontSize: '9px'}}>
                                            {(() => {
                                                const filteredTx = company.transactions.filter(tx => {
                                                    const txDate = new Date(tx.transactionDate)
                                                    const start = printDateRange.startDate ? new Date(printDateRange.startDate) : null
                                                    const end = printDateRange.endDate ? new Date(printDateRange.endDate) : null
                                                    if (start && txDate < start) return false
                                                    if (end && txDate > end) return false
                                                    return true
                                                })
                                                const totalCredits = filteredTx.filter(t => t.type === 'Credit' && t.status === 'Completed').reduce((a, b) => a + parseFloat(b.amount), 0)
                                                const totalPurchases = filteredTx.filter(t => t.type === 'Purchase').reduce((a, b) => a + parseFloat(b.amount), 0)
                                                const balance = totalCredits - totalPurchases
                                                return (
                                                    <>
                                                        <div className="bg-green-50 px-2 py-1 rounded flex-1 border border-green-200">
                                                            <span className="text-green-600 font-medium">Credits: </span>
                                                            <span className="font-bold text-green-700">{totalCredits.toLocaleString()}</span>
                                                        </div>
                                                        <div className="bg-red-50 px-2 py-1 rounded flex-1 border border-red-200">
                                                            <span className="text-red-600 font-medium">Purchases: </span>
                                                            <span className="font-bold text-red-700">{totalPurchases.toLocaleString()}</span>
                                                        </div>
                                                        <div className={`${balance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'} px-2 py-1 rounded flex-1 border`}>
                                                            <span className={`${balance >= 0 ? 'text-blue-600' : 'text-amber-600'} font-medium`}>Balance: </span>
                                                            <span className={`font-bold ${balance >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>{balance.toLocaleString()}</span>
                                                        </div>
                                                    </>
                                                )
                                            })()}
                                        </div>

                                        {/* Transactions Table with full borders */}
                                        <table className="min-w-full border border-gray-400" style={{fontSize: '8px'}}>
                                            <thead>
                                                <tr className="bg-gray-100">
                                                    <th className="border border-gray-400 px-1 py-1 text-left font-semibold text-gray-700">Date</th>
                                                    <th className="border border-gray-400 px-1 py-1 text-left font-semibold text-gray-700">Ref #</th>
                                                    <th className="border border-gray-400 px-1 py-1 text-left font-semibold text-gray-700">Description</th>
                                                    <th className="border border-gray-400 px-1 py-1 text-center font-semibold text-gray-700">Qty</th>
                                                    <th className="border border-gray-400 px-1 py-1 text-right font-semibold text-gray-700">Rate</th>
                                                    <th className="border border-gray-400 px-1 py-1 text-right font-semibold text-gray-700">Debit</th>
                                                    <th className="border border-gray-400 px-1 py-1 text-right font-semibold text-gray-700">Credit</th>
                                                    <th className="border border-gray-400 px-1 py-1 text-right font-semibold text-gray-700">Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(() => {
                                                    const filteredTx = company.transactions
                                                        .filter(tx => {
                                                            const txDate = new Date(tx.transactionDate)
                                                            const start = printDateRange.startDate ? new Date(printDateRange.startDate) : null
                                                            const end = printDateRange.endDate ? new Date(printDateRange.endDate) : null
                                                            if (start && txDate < start) return false
                                                            if (end && txDate > end) return false
                                                            return true
                                                        })
                                                        .sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime())
                                                    
                                                    let runningBalance = 0
                                                    
                                                    // Helper function to parse purchase description
                                                    const parsePurchaseDesc = (desc: string | null) => {
                                                        if (!desc) return { productName: '-', qty: '-', rate: '-' }
                                                        
                                                        // Try to parse patterns like "Purchase of Product Name - 50 units @ 100/unit"
                                                        // Or "Product Name x 50 @ 100"
                                                        const patterns = [
                                                            /Purchase of (.+?) - (\d+(?:\.\d+)?)\s*(?:units?|pcs?|kg|bags?)?\s*@\s*(\d+(?:\.\d+)?)/i,
                                                            /(.+?) x (\d+(?:\.\d+)?)\s*@\s*(\d+(?:\.\d+)?)/i,
                                                            /(.+?) - (\d+(?:\.\d+)?)\s*(?:units?|pcs?|kg|bags?)?\s*@\s*(\d+(?:\.\d+)?)/i,
                                                            /Purchase of (.+?) (\d+(?:\.\d+)?)\s*@\s*(\d+(?:\.\d+)?)/i,
                                                        ]
                                                        
                                                        for (const pattern of patterns) {
                                                            const match = desc.match(pattern)
                                                            if (match) {
                                                                return {
                                                                    productName: `Purchase of ${match[1].trim()}`,
                                                                    qty: match[2],
                                                                    rate: parseFloat(match[3]).toLocaleString()
                                                                }
                                                            }
                                                        }
                                                        
                                                        // If no pattern matched, try to extract just the product name
                                                        const purchaseMatch = desc.match(/Purchase of (.+)/i)
                                                        if (purchaseMatch) {
                                                            return { productName: `Purchase of ${purchaseMatch[1].trim()}`, qty: '-', rate: '-' }
                                                        }
                                                        
                                                        return { productName: desc, qty: '-', rate: '-' }
                                                    }
                                                    
                                                    if (filteredTx.length === 0) {
                                                        return (
                                                            <tr>
                                                                <td colSpan={8} className="border border-gray-400 px-2 py-4 text-center text-gray-500">
                                                                    No transactions found for the selected period.
                                                                </td>
                                                            </tr>
                                                        )
                                                    }
                                                    
                                                    return filteredTx.map((tx) => {
                                                        const amount = parseFloat(tx.amount)
                                                        const isPurchase = tx.type === 'Purchase'
                                                        const isCredit = tx.type === 'Credit' && tx.status === 'Completed'
                                                        
                                                        if (isPurchase) {
                                                            runningBalance -= amount
                                                        } else if (isCredit) {
                                                            runningBalance += amount
                                                        }
                                                        
                                                        const { productName, qty, rate } = isPurchase 
                                                            ? parsePurchaseDesc(tx.description)
                                                            : { productName: tx.description || 'Credit Payment', qty: '-', rate: '-' }
                                                        
                                                        return (
                                                            <tr key={tx.id}>
                                                                <td className="border border-gray-400 px-1 py-0.5 whitespace-nowrap text-gray-600">
                                                                    {format(new Date(tx.transactionDate), 'dd/MM/yy')}
                                                                </td>
                                                                <td className="border border-gray-400 px-1 py-0.5 whitespace-nowrap text-gray-700">
                                                                    {isPurchase 
                                                                        ? (tx.invoiceNumber || '-')
                                                                        : (tx.prReceiptNumber || '-')
                                                                    }
                                                                </td>
                                                                <td className="border border-gray-400 px-1 py-0.5 text-gray-800" style={{maxWidth: '150px'}}>
                                                                    {productName}
                                                                </td>
                                                                <td className="border border-gray-400 px-1 py-0.5 text-center text-gray-700">
                                                                    {qty}
                                                                </td>
                                                                <td className="border border-gray-400 px-1 py-0.5 text-right text-gray-700">
                                                                    {rate}
                                                                </td>
                                                                <td className="border border-gray-400 px-1 py-0.5 text-right font-medium text-red-600">
                                                                    {isPurchase ? amount.toLocaleString() : ''}
                                                                </td>
                                                                <td className="border border-gray-400 px-1 py-0.5 text-right font-medium text-green-600">
                                                                    {isCredit ? amount.toLocaleString() : ''}
                                                                </td>
                                                                <td className={`border border-gray-400 px-1 py-0.5 text-right font-semibold ${runningBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                                                    {runningBalance.toLocaleString()}
                                                                </td>
                                                            </tr>
                                                        )
                                                    })
                                                })()}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            onClick={() => {
                                const printContent = document.getElementById('print-content')
                                if (printContent) {
                                    const printWindow = window.open('', '_blank')
                                    if (printWindow) {
                                        printWindow.document.write(`
                                            <html>
                                                <head>
                                                    <title>Transaction Report - ${company.name}</title>
                                                    <style>
                                                        body { font-family: Arial, sans-serif; margin: 10px; font-size: 8px; }
                                                        table { width: 100%; border-collapse: collapse; border: 1px solid #9ca3af; }
                                                        th, td { padding: 3px 4px; text-align: left; border: 1px solid #9ca3af; }
                                                        th { background-color: #f3f4f6; font-weight: 600; font-size: 8px; }
                                                        td { font-size: 8px; }
                                                        .text-right { text-align: right; }
                                                        .text-center { text-align: center; }
                                                        .font-bold, .font-semibold { font-weight: bold; }
                                                        .font-medium { font-weight: 500; }
                                                        .text-green-600, .text-green-700 { color: #15803d; }
                                                        .text-red-600, .text-red-700 { color: #dc2626; }
                                                        .text-blue-600, .text-blue-700 { color: #1d4ed8; }
                                                        .text-amber-600, .text-amber-700 { color: #d97706; }
                                                        .text-gray-500 { color: #6b7280; }
                                                        .text-gray-600 { color: #4b5563; }
                                                        .text-gray-700 { color: #374151; }
                                                        .text-gray-800 { color: #1f2937; }
                                                        .text-gray-900 { color: #111827; }
                                                        .bg-green-50 { background-color: #f0fdf4; }
                                                        .bg-red-50 { background-color: #fef2f2; }
                                                        .bg-blue-50 { background-color: #eff6ff; }
                                                        .bg-amber-50 { background-color: #fffbeb; }
                                                        .bg-gray-100 { background-color: #f3f4f6; }
                                                        .border { border: 1px solid; }
                                                        .border-gray-400 { border-color: #9ca3af; }
                                                        .border-gray-900 { border-color: #111827; }
                                                        .border-green-200 { border-color: #bbf7d0; }
                                                        .border-red-200 { border-color: #fecaca; }
                                                        .border-blue-200 { border-color: #bfdbfe; }
                                                        .border-amber-200 { border-color: #fde68a; }
                                                        .border-b-2 { border-bottom: 2px solid; }
                                                        .rounded { border-radius: 4px; }
                                                        .flex { display: flex; }
                                                        .flex-1 { flex: 1; }
                                                        .gap-2 { gap: 8px; }
                                                        .mb-3 { margin-bottom: 12px; }
                                                        .pb-2 { padding-bottom: 8px; }
                                                        .px-2 { padding-left: 8px; padding-right: 8px; }
                                                        .py-1 { padding-top: 4px; padding-bottom: 4px; }
                                                        .p-3 { padding: 12px; }
                                                        .whitespace-nowrap { white-space: nowrap; }
                                                        @media print { 
                                                            body { margin: 5px; } 
                                                            table { page-break-inside: auto; }
                                                            tr { page-break-inside: avoid; }
                                                        }
                                                    </style>
                                                </head>
                                                <body>
                                                    ${printContent.innerHTML}
                                                </body>
                                            </html>
                                        `)
                                        printWindow.document.close()
                                        printWindow.print()
                                    }
                                }
                            }}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-800 text-base font-medium text-white hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                            Print Report
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowPrintModal(false)
                                setPrintDateRange({ startDate: '', endDate: '' })
                            }}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Add Credit Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowCreditModal(false)}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Add Credit</h3>
                                <div className="mt-6 space-y-4">
                                    <form onSubmit={handleAddCredit} id="credit-form">
                                        <div className="bg-gray-50 p-4 rounded-md mb-4">
                                            <label className="block text-sm font-medium text-gray-700">Amount (PKR)</label>
                                            <input
                                                type="number"
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 text-lg font-semibold"
                                                placeholder="0.00"
                                                value={creditForm.amount}
                                                onChange={(e) => setCreditForm({...creditForm, amount: e.target.value})}
                                            />
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">From Name</label>
                                                <input
                                                type="text"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                                                value={creditForm.fromName}
                                                onChange={(e) => setCreditForm({...creditForm, fromName: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Date</label>
                                                <input
                                                type="date"
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                                                value={creditForm.date}
                                                onChange={(e) => setCreditForm({...creditForm, date: e.target.value})}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">From Bank Account</label>
                                            <select
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                                                value={creditForm.bankAccount}
                                                onChange={(e) => {
                                                    const account = bankAccounts.find(a => a.account_number === e.target.value);
                                                    if (account) {
                                                        setCreditForm({
                                                            ...creditForm,
                                                            bankName: account.bank_name,
                                                            bankAccount: account.account_number
                                                        });
                                                    } else {
                                                        setCreditForm({
                                                            ...creditForm,
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
                                                value={creditForm.companyBank}
                                                onChange={(e) => setCreditForm({...creditForm, companyBank: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Company Account #</label>
                                                <input
                                                type="text"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                                                value={creditForm.companyBankAccount}
                                                onChange={(e) => setCreditForm({...creditForm, companyBankAccount: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="submit"
                            form="credit-form"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Save Transaction
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowCreditModal(false)}
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
