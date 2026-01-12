'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'

interface Transaction {
  id: string
  transaction_date: string
  type: string
  amount: string
  description: string | null
}

interface Investor {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  cnic: string | null
  status: string
  balance: string
  total_investment: string
  total_withdrawn: string
  total_profit: string
  createdAt: string
}

export default function InvestorDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [investor, setInvestor] = useState<Investor | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [transactionForm, setTransactionForm] = useState({
    type: 'Investment',
    amount: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    fetchInvestorDetails()
    fetchTransactions()
  }, [])

  const fetchInvestorDetails = async () => {
    try {
      const response = await fetch(`/api/investors/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch investor')
      const data = await response.json()
      setInvestor(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`/api/investors/${params.id}/transactions`)
      if (!response.ok) throw new Error('Failed to fetch transactions')
      const data = await response.json()
      setTransactions(data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!investor) return

    try {
      const response = await fetch(`/api/investors/${investor.id}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionForm)
      })

      if (response.ok) {
        setShowTransactionModal(false)
        setTransactionForm({
            type: 'Investment',
            amount: '',
            description: '',
            transaction_date: new Date().toISOString().split('T')[0],
        })
        fetchInvestorDetails()
        fetchTransactions()
      }
    } catch (error) {
      console.error('Error adding transaction:', error)
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
  if (!investor) return <div className="p-8 text-center text-gray-500">Investor not found</div>

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <Link href="/investors" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-2 inline-flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                    Back to Investors
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mt-1">{investor.name}</h1>
                <div className="flex flex-col gap-1 mt-2 text-gray-600 text-sm">
                    {investor.phone && (
                        <span className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                            {investor.phone}
                        </span>
                    )}
                    {investor.email && (
                        <span className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                            {investor.email}
                        </span>
                    )}
                </div>
            </div>
            
            <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                <div className="grid grid-cols-2 gap-2 text-right">
                    <div className="bg-blue-50 px-4 py-2 rounded border border-blue-100">
                        <p className="text-xs font-medium text-blue-800 uppercase">Invested</p>
                        <p className="text-lg font-bold text-blue-700">Rs. {Number(investor.total_investment).toLocaleString()}</p>
                    </div>
                    <div className="bg-green-50 px-4 py-2 rounded border border-green-100">
                        <p className="text-xs font-medium text-green-800 uppercase">Profit</p>
                        <p className="text-lg font-bold text-green-700">Rs. {Number(investor.total_profit).toLocaleString()}</p>
                    </div>
                    <div className="bg-red-50 px-4 py-2 rounded border border-red-100">
                        <p className="text-xs font-medium text-red-800 uppercase">Withdrawn</p>
                        <p className="text-lg font-bold text-red-700">Rs. {Number(investor.total_withdrawn).toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-100 px-4 py-2 rounded border border-gray-200">
                        <p className="text-xs font-medium text-gray-800 uppercase">Balance</p>
                        <p className="text-lg font-bold text-gray-700">Rs. {Number(investor.balance).toLocaleString()}</p>
                    </div>
                </div>

                <div className="flex gap-2 w-full mt-2">
                    <button
                        onClick={() => {
                            setTransactionForm({ ...transactionForm, type: 'Investment' })
                            setShowTransactionModal(true)
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        + Invest
                    </button>
                    <button
                        onClick={() => {
                            setTransactionForm({ ...transactionForm, type: 'Profit' })
                            setShowTransactionModal(true)
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        + Profit
                    </button>
                    <button
                        onClick={() => {
                            setTransactionForm({ ...transactionForm, type: 'Withdrawal' })
                            setShowTransactionModal(true)
                        }}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        - Withdraw
                    </button>
                </div>
            </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900">Ledger History</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.map((transaction) => (
                            <tr key={transaction.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {format(new Date(transaction.transaction_date), 'MMM d, yyyy')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        transaction.type === 'Investment' ? 'bg-blue-100 text-blue-800' :
                                        transaction.type === 'Profit' ? 'bg-green-100 text-green-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                        {transaction.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                    {transaction.description || '-'}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${
                                    transaction.type === 'Withdrawal' ? 'text-red-600' : 'text-green-600'
                                }`}>
                                    {transaction.type === 'Withdrawal' ? '-' : '+'} Rs. {parseFloat(transaction.amount).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                        {transactions.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">No transactions found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

      </div>

      {/* Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowTransactionModal(false)}></div>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                    Record {transactionForm.type}
                                </h3>
                                <div className="mt-6 space-y-4">
                                    <form onSubmit={handleAddTransaction} id="transaction-form">
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Amount (PKR)</label>
                                                <input
                                                type="number"
                                                required
                                                min="1"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                value={transactionForm.amount}
                                                onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Date</label>
                                                <input
                                                type="date"
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                value={transactionForm.transaction_date}
                                                onChange={(e) => setTransactionForm({...transactionForm, transaction_date: e.target.value})}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Description / Notes</label>
                                            <textarea
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                rows={2}
                                                value={transactionForm.description}
                                                onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})}
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
                            form="transaction-form"
                            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                                transactionForm.type === 'Withdrawal' 
                                    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                                    : transactionForm.type === 'Profit'
                                        ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                                        : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                            }`}
                        >
                            Save {transactionForm.type}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowTransactionModal(false)}
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
