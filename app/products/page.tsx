'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Company {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  description: string | null
  category: string
  stockQuantity: number
  company: Company
  createdAt: string
  companyId: string // Ensure this is available if needed for editing
}

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  
  // Add/Edit Product State
  const [showProductModal, setShowProductModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [productFormData, setProductFormData] = useState({
    name: '',
    description: '',
    category: 'Pesticide',
    companyId: '',
  })

  // Add Stock State
  const [showStockModal, setShowStockModal] = useState(false)
  const [selectedProductForStock, setSelectedProductForStock] = useState<Product | null>(null)
  const [stockFormData, setStockFormData] = useState({
    stockToAdd: '',
    buyingPrice: '',
    invoiceNumber: ''
  })

  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedCompany, setSelectedCompany] = useState('')

  useEffect(() => {
    fetchProducts()
    fetchCompanies()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies')
      const data = await response.json()
      setCompanies(data)
    } catch (error) {
      console.error('Failed to fetch companies:', error)
    }
  }

  // --- Product Create/Edit Handlers ---

  const openAddProductModal = () => {
    setIsEditing(false)
    setEditingId(null)
    setProductFormData({ name: '', description: '', category: 'Pesticide', companyId: '' })
    setShowProductModal(true)
  }

  const openEditProductModal = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click navigation
    setIsEditing(true)
    setEditingId(product.id)
    setProductFormData({
      name: product.name,
      description: product.description || '',
      category: product.category,
      companyId: product.company.id // Note: API might return company object nested
    })
    setShowProductModal(true)
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = isEditing ? `/api/products/${editingId}` : '/api/products'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productFormData),
      })

      if (response.ok) {
        setShowProductModal(false)
        fetchProducts()
      }
    } catch (error) {
      console.error('Failed to save product:', error)
    }
  }

  // --- Stock Handlers ---

  const openAddStockModal = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click navigation
    setSelectedProductForStock(product)
    setStockFormData({
      stockToAdd: '',
      buyingPrice: '',
      invoiceNumber: ''
    })
    setShowStockModal(true)
  }

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProductForStock) return

    const totalAmount = (parseFloat(stockFormData.stockToAdd) || 0) * (parseFloat(stockFormData.buyingPrice) || 0)

    try {
      const payload = {
        stockToAdd: parseFloat(stockFormData.stockToAdd),
        buyingPrice: parseFloat(stockFormData.buyingPrice),
        totalAmount,
        invoiceNumber: stockFormData.invoiceNumber,
        companyId: selectedProductForStock.company.id
      }

      const response = await fetch(`/api/products/${selectedProductForStock.id}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setShowStockModal(false)
        fetchProducts() // Refresh to show new stock
      }
    } catch (error) {
      console.error('Error adding inventory:', error)
    }
  }

  // --- Delete Handler ---

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchProducts()
      }
    } catch (error) {
      console.error('Failed to delete product:', error)
    }
  }

  // Derived state for stock calculation
  const stockTotalAmount = (parseFloat(stockFormData.stockToAdd) || 0) * (parseFloat(stockFormData.buyingPrice) || 0)

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
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-2">Browse and manage product inventory</p>
        </div>
        <button
          onClick={openAddProductModal}
          className="btn-primary"
        >
          + Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <input 
          type="text" 
          placeholder="Search products..." 
          className="input-field"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select 
          className="input-field"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="Pesticide">Pesticide</option>
          <option value="Fertilizer">Fertilizer</option>
        </select>
        <select
          className="input-field"
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
        >
          <option value="">All Companies</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="table-container">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="table-header">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock Available
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products
              .filter(product => {
                const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
                const matchesCategory = selectedCategory ? product.category === selectedCategory : true
                const matchesCompany = selectedCompany ? product.company.id === selectedCompany : true
                return matchesSearch && matchesCategory && matchesCompany
              })
              .map((product) => (
              <tr 
                key={product.id} 
                className="hover:bg-gray-50 cursor-pointer" 
                onClick={() => router.push(`/products/${product.id}`)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  <div className="text-xs text-gray-500 truncate max-w-[200px]">{product.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      product.category === 'Pesticide'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {product.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{product.company.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">{product.stockQuantity || 0}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => openAddStockModal(product, e)}
                      className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded-md border border-green-200"
                    >
                      + Stock
                    </button>
                    <button
                      onClick={(e) => openEditProductModal(product, e)}
                      className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md border border-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => handleDelete(product.id, e)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {products.length === 0 && (
        <div className="card text-center py-12 mt-6">
          <p className="text-gray-500">No products found. Add your first product to get started.</p>
        </div>
      )}

      {/* Product Modal (Create/Edit) */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={() => setShowProductModal(false)}>
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div className="relative bg-white rounded-lg max-w-lg w-full p-6 shadow-xl" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-semibold mb-4">{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={productFormData.name}
                    onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    required
                    className="input-field"
                    value={productFormData.category}
                    onChange={(e) => setProductFormData({ ...productFormData, category: e.target.value })}
                  >
                    <option value="Pesticide">Pesticide</option>
                    <option value="Fertilizer">Fertilizer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company *
                  </label>
                  <select
                    required
                    className="input-field"
                    value={productFormData.companyId}
                    onChange={(e) => setProductFormData({ ...productFormData, companyId: e.target.value })}
                  >
                    <option value="">Select Company</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="input-field"
                    rows={3}
                    value={productFormData.description}
                    onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {isEditing ? 'Save Changes' : 'Create Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {showStockModal && selectedProductForStock && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={() => setShowStockModal(false)}>
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div className="relative bg-white rounded-lg max-w-lg w-full p-6 shadow-xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Add Stock: {selectedProductForStock.name}
              </h3>
              <form onSubmit={handleStockSubmit}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Stock Quantity</label>
                        <input
                        type="number"
                        required
                        min="1"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        value={stockFormData.stockToAdd}
                        onChange={(e) => setStockFormData({...stockFormData, stockToAdd: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Buying Price (Per Unit)</label>
                        <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        value={stockFormData.buyingPrice}
                        onChange={(e) => setStockFormData({...stockFormData, buyingPrice: e.target.value})}
                        />
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
                    <input
                        type="text"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        value={stockFormData.invoiceNumber}
                        onChange={(e) => setStockFormData({...stockFormData, invoiceNumber: e.target.value})}
                    />
                </div>

                <div className="bg-gray-50 p-4 rounded-md mb-6">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Total Amount</span>
                        <span className="text-xl font-bold text-gray-900">PKR {stockTotalAmount.toLocaleString()}</span>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                        This will deduct from the company credit balance.
                    </p>
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => setShowStockModal(false)}
                        className="btn-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                    >
                        Add Stock
                    </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
