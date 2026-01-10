'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Officer {
  id: string
  name: string
  phone: string | null
  email: string | null
}

interface Company {
  id: string
  name: string
  contactInfo: string | null
  address: string | null
  officer: Officer | null
  _count?: {
    products: number
    transactions: number
  }
  totalBalance?: number
  createdAt: string
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    contactInfo: '',
    address: '',
  })

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies')
      const data = await response.json()
      setCompanies(data)
    } catch (error) {
      console.error('Failed to fetch companies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setFormData({ name: '', contactInfo: '', address: '' })
        setShowForm(false)
        fetchCompanies()
      }
    } catch (error) {
      console.error('Failed to create company:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this company?')) return

    try {
      const response = await fetch(`/api/companies/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchCompanies()
      }
    } catch (error) {
      console.error('Failed to delete company:', error)
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
          <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
          <p className="text-gray-600 mt-2">Manage pesticide and fertilizer manufacturers</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? 'Cancel' : '+ Add Company'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Add New Company</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name *
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
                Contact Info
              </label>
              <input
                type="text"
                className="input-field"
                value={formData.contactInfo}
                onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
              />
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
                Create Company
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <div key={company.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900">{company.name}</h3>
            </div>

            {company.contactInfo && (
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Contact:</span> {company.contactInfo}
              </p>
            )}

            {company.address && (
              <p className="text-sm text-gray-600 mb-4">
                <span className="font-medium">Address:</span> {company.address}
              </p>
            )}

            {company.officer && (
              <div className="mb-4 p-3 bg-blue-50 rounded">
                <p className="text-sm font-medium text-blue-900">Officer: {company.officer.name}</p>
                {company.officer.phone && (
                  <p className="text-sm text-blue-700">{company.officer.phone}</p>
                )}
              </div>
            )}

            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Balance:</span>
                <span className={`font-semibold ${parseFloat(String(company.totalBalance || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  PKR {parseFloat(String(company.totalBalance || 0)).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Products:</span>
                <span className="font-semibold">{company._count?.products || 0}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-600">Transactions:</span>
                <span className="font-semibold">{company._count?.transactions || 0}</span>
              </div>
            </div>

            <Link
              href={`/companies/${company.id}`}
              className="mt-4 block text-center text-primary-600 hover:text-primary-700 font-medium"
            >
              View Details →
            </Link>
          </div>
        ))}
      </div>

      {companies.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">No companies found. Add your first company to get started.</p>
        </div>
      )}
    </div>
  )
}
