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
  price: string | number
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
  const [showEditStockModal, setShowEditStockModal] = useState(false)
  const [editStockValue, setEditStockValue] = useState('')
  const [purchases, setPurchases] = useState<any[]>([])
  const [editingPurchase, setEditingPurchase] = useState<any>(null)
  const [showEditPurchaseModal, setShowEditPurchaseModal] = useState(false)
  
  // Inventory Form State
  const [inventoryForm, setInventoryForm] = useState({
    stockToAdd: '',
    buyingPrice: '',
    invoiceNumber: ''
  })

  const totalAmount = (parseFloat(inventoryForm.stockToAdd) || 0) * (parseFloat(inventoryForm.buyingPrice) || 0)

  useEffect(() => {
    fetchProductDetails()
    fetchPurchases()
  }, [])

  const fetchProductDetails = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch product')
      const data = await response.json()
      setProduct(data)
      setEditStockValue(data.stockQuantity.toString())
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPurchases = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}/purchases`)
      if (response.ok) {
        const data = await response.json()
        setPurchases(data)
      }
    } catch (error) {
      console.error('Error fetching purchases:', error)
    }
  }

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockQuantity: parseFloat(editStockValue) })
      })

      if (response.ok) {
        setShowEditStockModal(false)
        fetchProductDetails()
      }
    } catch (error) {
      console.error('Error updating stock:', error)
    }
  }

  const handleUpdatePurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPurchase) return

    try {
      const response = await fetch(`/api/transactions/${editingPurchase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            amount: parseFloat(editingPurchase.amount),
            description: editingPurchase.description,
            invoiceNumber: editingPurchase.invoiceNumber
        })
      })

      if (response.ok) {
        setShowEditPurchaseModal(false)
        fetchPurchases()
      }
    } catch (error) {
      console.error('Error updating purchase:', error)
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
                    <div className="flex items-center justify-end gap-2">
                        <p className="text-3xl font-bold text-blue-900">{product.stockQuantity || 0}</p>
                        <button 
                            onClick={() => setShowEditStockModal(true)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Edit Stock Level"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                        </button>
                    </div>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500">Description</label>
                    <p className="mt-1 text-gray-900">{product.description || 'No description provided'}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-500">Current Buying Price</label>
                    <p className="mt-1 text-gray-900 font-medium">PKR {product.price ? parseFloat(product.price.toString()).toLocaleString() : '0'}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-500">Added On</label>
                    <p className="mt-1 text-gray-900">{format(new Date(product.createdAt), 'PPP')}</p>
                </div>
            </div>
        </div>

        {/* Last Purchases Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Last Purchases</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                        <tr>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                            <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {purchases.length > 0 ? (
                            purchases.map((purchase) => (
                                <tr key={purchase.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {format(new Date(purchase.transactionDate), 'PPP')}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {purchase.description}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                        PKR {parseFloat(purchase.amount).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {purchase.invoiceNumber || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button 
                                            onClick={() => {
                                                setEditingPurchase(purchase)
                                                setShowEditPurchaseModal(true)
                                            }}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                    No purchase history found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

      </div>

      {/* Edit Purchase Modal */}
      {showEditPurchaseModal && editingPurchase && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowEditPurchaseModal(false)}></div>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Edit Purchase Transaction</h3>
                                <div className="mt-6 space-y-4">
                                    <form onSubmit={handleUpdatePurchase} id="edit-purchase-form">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Description</label>
                                            <textarea
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                rows={3}
                                                value={editingPurchase.description}
                                                onChange={(e) => setEditingPurchase({...editingPurchase, description: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Amount (PKR)</label>
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                value={editingPurchase.amount}
                                                onChange={(e) => setEditingPurchase({...editingPurchase, amount: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
                                            <input
                                                type="text"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                value={editingPurchase.invoiceNumber || ''}
                                                onChange={(e) => setEditingPurchase({...editingPurchase, invoiceNumber: e.target.value})}
                                            />
                                        </div>
                                        <div className="bg-yellow-50 p-3 rounded-md border border-yellow-100">
                                            <p className="text-xs text-yellow-800">
                                                Note: Updating this transaction does not automatically adjust the product stock level. 
                                                If the quantity changed, please also update the Stock Quantity manually using the "Edit Stock" button.
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
                            form="edit-purchase-form"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Save Changes
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowEditPurchaseModal(false)}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Edit Stock Modal */}
      {showEditStockModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowEditStockModal(false)}></div>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Edit Stock Level</h3>
                                <div className="mt-6 space-y-4">
                                    <form onSubmit={handleUpdateStock} id="edit-stock-form">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Current Stock Quantity</label>
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                value={editStockValue}
                                                onChange={(e) => setEditStockValue(e.target.value)}
                                            />
                                            <p className="mt-2 text-xs text-red-500">
                                                Warning: This directly updates the stock count without creating a transaction. 
                                                Use "Add Inventory" for purchases to maintain financial records.
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
                            form="edit-stock-form"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Update Stock
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowEditStockModal(false)}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

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
