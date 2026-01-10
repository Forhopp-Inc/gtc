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
  stockQuantity: number
  companyId: string
  createdAt: string
  updatedAt: string
  company: {
    id: string
    name: string
    contactInfo: string
  }
}

export default function ProductDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [showInventoryModal, setShowInventoryModal] = useState(false)
  
  // Inventory Form State
  const [inventoryForm, setInventoryForm] = useState({
    stockToAdd: '',
    buyingPrice: '',
    invoiceNumber: ''
  })

  const totalAmount = (parseFloat(inventoryForm.stockToAdd) || 0) * (parseFloat(inventoryForm.buyingPrice) || 0)

  useEffect(() => {
    fetchProductDetails()
  }, [])

  const fetchProductDetails = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch product')
      const data = await response.json()
      setProduct(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    try {
      const payload = {
        stockToAdd: parseFloat(inventoryForm.stockToAdd),
        buyingPrice: parseFloat(inventoryForm.buyingPrice),
        totalAmount,
        invoiceNumber: inventoryForm.invoiceNumber,
        companyId: product.companyId
      }

      const response = await fetch(`/api/products/${product.id}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setShowInventoryModal(false)
        setInventoryForm({
            stockToAdd: '',
            buyingPrice: '',
            invoiceNumber: ''
        })
        fetchProductDetails()
      }
    } catch (error) {
      console.error('Error adding inventory:', error)
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
  if (!product) return <div className="p-8 text-center text-gray-500">Product not found</div>

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <Link href="/products" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-2 inline-flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                    Back to Products
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mt-1">{product.name}</h1>
                <p className="text-gray-600 mt-1">{product.company.name}</p>
                <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.category === 'Pesticide' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                    }`}>
                        {product.category}
                    </span>
                </div>
            </div>
            
            <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                <div className="bg-blue-50 px-6 py-3 rounded-lg border border-blue-100 text-right w-full md:w-auto">
                    <p className="text-sm font-medium text-blue-800 uppercase tracking-wider">Current Stock</p>
                    <p className="text-3xl font-bold text-blue-900">{product.stockQuantity || 0}</p>
                </div>
                <button
                    onClick={() => setShowInventoryModal(true)}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg shadow-sm transition-all text-sm font-medium w-full md:w-auto"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                    Add Inventory
                </button>
            </div>
        </div>

        {/* Details Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-500">Description</label>
                    <p className="mt-1 text-gray-900">{product.description || 'No description provided'}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-500">Added On</label>
                    <p className="mt-1 text-gray-900">{format(new Date(product.createdAt), 'PPP')}</p>
                </div>
            </div>
        </div>

      </div>

      {/* Add Inventory Modal */}
      {showInventoryModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowInventoryModal(false)}></div>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Add Inventory Stock</h3>
                                <div className="mt-6 space-y-4">
                                    <form onSubmit={handleAddInventory} id="inventory-form">
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Stock Quantity</label>
                                                <input
                                                type="number"
                                                required
                                                min="1"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                value={inventoryForm.stockToAdd}
                                                onChange={(e) => setInventoryForm({...inventoryForm, stockToAdd: e.target.value})}
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
                                                value={inventoryForm.buyingPrice}
                                                onChange={(e) => setInventoryForm({...inventoryForm, buyingPrice: e.target.value})}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
                                            <input
                                                type="text"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                value={inventoryForm.invoiceNumber}
                                                onChange={(e) => setInventoryForm({...inventoryForm, invoiceNumber: e.target.value})}
                                            />
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-md">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-700">Total Amount</span>
                                                <span className="text-xl font-bold text-gray-900">PKR {totalAmount.toLocaleString()}</span>
                                            </div>
                                            <p className="mt-2 text-xs text-gray-500">
                                                This will deduct from the company credit balance and create a <strong>Completed Transaction</strong>.
                                            </p>
                                        </div>

                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="submit"
                            form="inventory-form"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Add Stock
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowInventoryModal(false)}
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
