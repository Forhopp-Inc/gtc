'use client'

import { useState, useEffect } from 'react'

interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  cnic: string | null
  balance: string
  _count?: {
    orders: number
    payments: number
  }
  createdAt: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    cnic: '',
  })

  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [balanceFilter, setBalanceFilter] = useState('')

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      const data = await response.json()
      setCustomers(data)
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setFormData({ name: '', phone: '', email: '', address: '', cnic: '' })
        setShowForm(false)
        fetchCustomers()
        alert('Customer created successfully!')
      } else {
        const errorData = await response.json()
        if (response.status === 409) {
          // Duplicate customer
          const existing = errorData.existingCustomer
          alert(`${errorData.error}\n\nExisting customer: ${existing.name}${existing.phone ? ` (${existing.phone})` : ''}`)
        } else {
          alert(`Failed to create customer: ${errorData.error || 'Unknown error'}`)
        }
      }
    } catch (error) {
      console.error('Failed to create customer:', error)
      alert('Failed to create customer')
    }
  }

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click navigation
    
    if (!confirm(`Are you sure you want to delete customer "${name}"?\n\nThis action cannot be undone.`)) return

    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchCustomers()
        alert('Customer deleted successfully!')
      } else {
        const errorData = await response.json()
        if (errorData.details) {
          alert(`${errorData.error}\n\n${errorData.message}`)
        } else {
          alert(`Failed to delete customer: ${errorData.error}`)
        }
      }
    } catch (error) {
      console.error('Failed to delete customer:', error)
      alert('Failed to delete customer')
    }
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-2">Manage customer accounts and debts</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? 'Cancel' : '+ Add Customer'}
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <input 
          type="text" 
          placeholder="Search by name, phone or CNIC..." 
          className="input-field"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select 
          className="input-field"
          value={balanceFilter}
          onChange={(e) => setBalanceFilter(e.target.value)}
        >
          <option value="">All Balances</option>
          <option value="receivable">Receivable (Udhar)</option>
          <option value="payable">Payable (Advance/Credit)</option>
          <option value="zero">Zero Balance</option>
        </select>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Add New Customer</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="input-field"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CNIC
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.cnic}
                  onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                className="input-field"
                rows={3}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">
                Create Customer
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
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
                Customer Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Balance (Udhar)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Orders
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers
              .filter(customer => {
                const matchesSearch = 
                  customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (customer.phone && customer.phone.includes(searchQuery)) ||
                  (customer.cnic && customer.cnic.includes(searchQuery));
                
                let matchesBalance = true;
                const balance = Number(customer.balance);
                if (balanceFilter === 'receivable') matchesBalance = balance > 0;
                else if (balanceFilter === 'payable') matchesBalance = balance < 0;
                else if (balanceFilter === 'zero') matchesBalance = balance === 0;
                
                return matchesSearch && matchesBalance;
              })
              .map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/customers/${customer.id}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                  {customer.cnic && (
                    <div className="text-xs text-gray-500">CNIC: {customer.cnic}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{customer.phone || '-'}</div>
                  <div className="text-xs text-gray-500">{customer.email || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                      Number(customer.balance) > 0
                        ? 'bg-red-100 text-red-800'
                        : Number(customer.balance) < 0 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    Rs. {Math.abs(Number(customer.balance)).toLocaleString()}
                    {Number(customer.balance) < 0 && ' (Cr)'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {customer._count?.orders || 0} orders
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={(e) => handleDelete(customer.id, customer.name, e)}
                    className="text-red-600 hover:text-red-900 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                    title={customer._count?.orders || 0 > 0 ? 'Cannot delete - has orders' : 'Delete customer'}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {customers.length === 0 && (
        <div className="card text-center py-12 mt-6">
          <p className="text-gray-500">No customers found. Add your first customer to get started.</p>
        </div>
      )}
    </div>
  )
}
