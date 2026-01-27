'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'

interface Expense {
  id: string
  category: string
  description: string
  amount: string
  expenseDate: string
  notes: string | null
}

const expenseCategories = [
  'Transport',
  'Salaries',
  'Labor',
  'Office Items',
  'Rent',
  'Services',
  'Maintainance'
]

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [formData, setFormData] = useState({
    category: 'Other',
    description: '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    notes: '',
  })

  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [printDateRange, setPrintDateRange] = useState({ startDate: '', endDate: '' })

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/expenses')
      const data = await response.json()
      setExpenses(data)
    } catch (error) {
      console.error('Failed to fetch expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingExpense ? `/api/expenses/${editingExpense.id}` : '/api/expenses'
      const method = editingExpense ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          expenseDate: new Date(formData.expenseDate),
        }),
      })

      if (response.ok) {
        setFormData({
          category: 'Other',
          description: '',
          amount: '',
          expenseDate: new Date().toISOString().split('T')[0],
          notes: '',
        })
        setShowForm(false)
        setEditingExpense(null)
        fetchExpenses()
      }
    } catch (error) {
      console.error('Failed to save expense:', error)
    }
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setFormData({
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      expenseDate: new Date(expense.expenseDate).toISOString().split('T')[0],
      notes: expense.notes || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchExpenses()
      }
    } catch (error) {
      console.error('Failed to delete expense:', error)
    }
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600 mt-2">Track business expenses</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-md shadow-sm transition-all text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
            Print Report
          </button>
          <button
            onClick={() => {
              if (showForm) {
                  setShowForm(false)
                  setEditingExpense(null)
                  setFormData({
                    category: 'Other',
                    description: '',
                    amount: '',
                    expenseDate: new Date().toISOString().split('T')[0],
                    notes: '',
                  })
              } else {
                  setShowForm(true)
              }
            }}
            className="btn-primary"
          >
            {showForm ? 'Cancel' : '+ Add Expense'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <input 
          type="text" 
          placeholder="Search description..." 
          className="input-field"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="flex gap-2">
          <input 
            type="date"
            className="input-field"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            title="Start Date"
          />
          <input 
            type="date"
            className="input-field"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            title="End Date"
          />
        </div>
        <select
          className="input-field"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {expenseCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card bg-red-50 border-red-200">
          <h3 className="text-sm font-medium text-gray-700 mb-1">Total Expenses</h3>
          <p className="text-3xl font-bold text-red-600">Rs. {totalExpenses.toLocaleString()}</p>
        </div>
        <div className="card bg-blue-50 border-blue-200">
          <h3 className="text-sm font-medium text-gray-700 mb-1">Total Records</h3>
          <p className="text-3xl font-bold text-blue-600">{expenses.length}</p>
        </div>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">{editingExpense ? 'Edit Expense' : 'Add New Expense'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  required
                  className="input-field"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {expenseCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className="input-field"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  className="input-field"
                  value={formData.expenseDate}
                  onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                className="input-field"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">
                {editingExpense ? 'Update Expense' : 'Create Expense'}
              </button>
              <button
                type="button"
                onClick={() => {
                    setShowForm(false)
                    setEditingExpense(null)
                    setFormData({
                      category: 'Other',
                      description: '',
                      amount: '',
                      expenseDate: new Date().toISOString().split('T')[0],
                      notes: '',
                    })
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="table-header">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {expenses
              .filter(expense => {
                const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesCategory = categoryFilter ? expense.category === categoryFilter : true;
                
                const expenseDateStr = new Date(expense.expenseDate).toISOString().split('T')[0];
                let matchesDate = true;
                if (startDate && endDate) {
                    matchesDate = expenseDateStr >= startDate && expenseDateStr <= endDate;
                } else if (startDate) {
                    matchesDate = expenseDateStr >= startDate;
                } else if (endDate) {
                    matchesDate = expenseDateStr <= endDate;
                }
                
                return matchesSearch && matchesCategory && matchesDate;
              })
              .map((expense) => (
              <tr key={expense.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {format(new Date(expense.expenseDate), 'MMM dd, yyyy')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                    {expense.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{expense.description}</div>
                  {expense.notes && (
                    <div className="text-xs text-gray-500">{expense.notes}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">
                    Rs. {Number(expense.amount).toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(expense)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {expenses.length === 0 && (
        <div className="card text-center py-12 mt-6">
          <p className="text-gray-500">No expenses found. Add your first expense to get started.</p>
        </div>
      )}

      {/* Print Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowPrintModal(false)}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Print Expenses Report</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
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

                        {/* Print Preview */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden" id="expenses-print-content">
                            <div className="bg-white p-3">
                                <div className="border-b-2 border-gray-900 pb-2 mb-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h1 className="text-base font-bold text-gray-900">Expenses Report</h1>
                                            <p className="text-gray-700 font-medium text-sm">Ghous Trading Company</p>
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

                                {/* Summary */}
                                {(() => {
                                    const filteredExpenses = expenses.filter(exp => {
                                        const expDate = new Date(exp.expenseDate).toISOString().split('T')[0]
                                        if (printDateRange.startDate && expDate < printDateRange.startDate) return false
                                        if (printDateRange.endDate && expDate > printDateRange.endDate) return false
                                        return true
                                    })
                                    const total = filteredExpenses.reduce((a, b) => a + parseFloat(b.amount), 0)
                                    const byCategory = filteredExpenses.reduce((acc, exp) => {
                                        acc[exp.category] = (acc[exp.category] || 0) + parseFloat(exp.amount)
                                        return acc
                                    }, {} as Record<string, number>)

                                    return (
                                        <>
                                            <div className="flex gap-2 mb-3" style={{fontSize: '9px'}}>
                                                <div className="bg-red-50 px-2 py-1 rounded flex-1 border border-red-200">
                                                    <span className="text-red-600 font-medium">Total Expenses: </span>
                                                    <span className="font-bold text-red-700">Rs. {total.toLocaleString()}</span>
                                                </div>
                                                <div className="bg-blue-50 px-2 py-1 rounded flex-1 border border-blue-200">
                                                    <span className="text-blue-600 font-medium">Records: </span>
                                                    <span className="font-bold text-blue-700">{filteredExpenses.length}</span>
                                                </div>
                                            </div>

                                            <table className="min-w-full border border-gray-400" style={{fontSize: '10px'}}>
                                                <thead>
                                                    <tr className="bg-gray-100">
                                                        <th className="border border-gray-400 px-2 py-1 text-left font-semibold text-gray-700">Date</th>
                                                        <th className="border border-gray-400 px-2 py-1 text-left font-semibold text-gray-700">Category</th>
                                                        <th className="border border-gray-400 px-2 py-1 text-left font-semibold text-gray-700">Description</th>
                                                        <th className="border border-gray-400 px-2 py-1 text-right font-semibold text-gray-700">Amount</th>
                                                        <th className="border border-gray-400 px-2 py-1 text-right font-semibold text-gray-700">Balance</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(() => {
                                                        let runningTotal = 0
                                                        return filteredExpenses
                                                            .sort((a, b) => new Date(a.expenseDate).getTime() - new Date(b.expenseDate).getTime())
                                                            .map((exp) => {
                                                                runningTotal += parseFloat(exp.amount)
                                                                return (
                                                                    <tr key={exp.id}>
                                                                        <td className="border border-gray-400 px-2 py-1 whitespace-nowrap text-gray-600">
                                                                            {format(new Date(exp.expenseDate), 'dd/MM/yy')}
                                                                        </td>
                                                                        <td className="border border-gray-400 px-2 py-1 whitespace-nowrap text-gray-700">
                                                                            {exp.category}
                                                                        </td>
                                                                        <td className="border border-gray-400 px-2 py-1 text-gray-800">
                                                                            {exp.description}
                                                                        </td>
                                                                        <td className="border border-gray-400 px-2 py-1 text-right font-medium text-red-600">
                                                                            {parseFloat(exp.amount).toLocaleString()}
                                                                        </td>
                                                                        <td className="border border-gray-400 px-2 py-1 text-right font-semibold text-red-700">
                                                                            {runningTotal.toLocaleString()}
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            })
                                                    })()}
                                                    {filteredExpenses.length === 0 && (
                                                        <tr>
                                                            <td colSpan={5} className="border border-gray-400 px-2 py-4 text-center text-gray-500">
                                                                No expenses found for the selected period.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>

                                            {/* Category Summary */}
                                            {Object.keys(byCategory).length > 0 && (
                                                <div className="mt-3">
                                                    <p className="text-xs font-semibold text-gray-700 mb-1">By Category:</p>
                                                    <div className="grid grid-cols-4 gap-1" style={{fontSize: '9px'}}>
                                                        {Object.entries(byCategory).map(([cat, amt]) => (
                                                            <div key={cat} className="bg-gray-50 px-2 py-1 rounded border">
                                                                <span className="text-gray-600">{cat}: </span>
                                                                <span className="font-bold text-gray-800">Rs. {amt.toLocaleString()}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )
                                })()}
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            onClick={() => {
                                const printContent = document.getElementById('expenses-print-content')
                                if (printContent) {
                                    const printWindow = window.open('', '_blank')
                                    if (printWindow) {
                                        printWindow.document.write(`
                                            <html>
                                                <head>
                                                    <title>Expenses Report</title>
                                                    <style>
                                                        body { font-family: Arial, sans-serif; margin: 10px; font-size: 10px; }
                                                        table { width: 100%; border-collapse: collapse; border: 1px solid #9ca3af; }
                                                        th, td { padding: 4px 6px; text-align: left; border: 1px solid #9ca3af; }
                                                        th { background-color: #f3f4f6; font-weight: 600; }
                                                        .text-right { text-align: right; }
                                                        .font-bold, .font-semibold { font-weight: bold; }
                                                        .text-red-600, .text-red-700 { color: #dc2626; }
                                                        .text-blue-600, .text-blue-700 { color: #1d4ed8; }
                                                        .text-gray-500 { color: #6b7280; }
                                                        .text-gray-600 { color: #4b5563; }
                                                        .text-gray-700 { color: #374151; }
                                                        .text-gray-800 { color: #1f2937; }
                                                        .bg-red-50 { background-color: #fef2f2; }
                                                        .bg-blue-50 { background-color: #eff6ff; }
                                                        .bg-gray-50 { background-color: #f9fafb; }
                                                        .bg-gray-100 { background-color: #f3f4f6; }
                                                        .border { border: 1px solid #d1d5db; }
                                                        .border-gray-400 { border-color: #9ca3af; }
                                                        .border-red-200 { border-color: #fecaca; }
                                                        .border-blue-200 { border-color: #bfdbfe; }
                                                        .rounded { border-radius: 4px; }
                                                        .flex { display: flex; }
                                                        .flex-1 { flex: 1; }
                                                        .gap-2 { gap: 8px; }
                                                        .gap-1 { gap: 4px; }
                                                        .grid { display: grid; }
                                                        .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
                                                        .mb-3 { margin-bottom: 12px; }
                                                        .mt-3 { margin-top: 12px; }
                                                        .mb-1 { margin-bottom: 4px; }
                                                        .px-2 { padding-left: 8px; padding-right: 8px; }
                                                        .py-1 { padding-top: 4px; padding-bottom: 4px; }
                                                        .p-3 { padding: 12px; }
                                                        @media print { body { margin: 5px; } }
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
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-800 text-base font-medium text-white hover:bg-gray-900 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Print Report
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowPrintModal(false)
                                setPrintDateRange({ startDate: '', endDate: '' })
                            }}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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
