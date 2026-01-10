'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'

interface Customer {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  company: {
    name: string
  }
}

interface OrderItem {
  productId: string
  product?: Product
  quantity: number
  buyingPrice: number
  sellingPrice: number
}

interface Order {
  id: string
  orderNumber: string
  customer: Customer
  orderDate: string
  totalAmount: string
  paidAmount: string
  remainingAmount: string
  status: string
  orderItems: Array<{
    product: Product
    quantity: string
    sellingPrice: string
  }>
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    customerId: '',
    notes: '',
  })
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { productId: '', quantity: 1, buyingPrice: 0, sellingPrice: 0 }
  ])

  useEffect(() => {
    fetchOrders()
    fetchCustomers()
    fetchProducts()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      const data = await response.json()
      setCustomers(data)
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
  }

  const addOrderItem = () => {
    setOrderItems([...orderItems, { productId: '', quantity: 1, buyingPrice: 0, sellingPrice: 0 }])
  }

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index))
  }

  const updateOrderItem = (index: number, field: keyof OrderItem, value: any) => {
    const updated = [...orderItems]
    updated[index] = { ...updated[index], [field]: value }
    setOrderItems(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate order items
    if (orderItems.some(item => !item.productId || item.quantity <= 0)) {
      alert('Please fill in all order items correctly')
      return
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          orderItems,
        }),
      })

      if (response.ok) {
        setFormData({ customerId: '', notes: '' })
        setOrderItems([{ productId: '', quantity: 1, buyingPrice: 0, sellingPrice: 0 }])
        setShowForm(false)
        fetchOrders()
        alert('Order created successfully!')
      }
    } catch (error) {
      console.error('Failed to create order:', error)
      alert('Failed to create order')
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
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-2">Create and track sales orders</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? 'Cancel' : '+ New Order'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Order</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer *
              </label>
              <select
                required
                className="input-field"
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              >
                <option value="">Select Customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">Order Items</h3>
                <button
                  type="button"
                  onClick={addOrderItem}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  + Add Item
                </button>
              </div>
              
              {orderItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 mb-3 p-4 bg-gray-50 rounded">
                  <div className="col-span-4">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Product</label>
                    <select
                      required
                      className="input-field text-sm"
                      value={item.productId}
                      onChange={(e) => updateOrderItem(index, 'productId', e.target.value)}
                    >
                      <option value="">Select Product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.company.name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      required
                      min="1"
                      className="input-field text-sm"
                      value={item.quantity}
                      onChange={(e) => updateOrderItem(index, 'quantity', Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Buying Price</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      className="input-field text-sm"
                      value={item.buyingPrice}
                      onChange={(e) => updateOrderItem(index, 'buyingPrice', Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Selling Price</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      className="input-field text-sm"
                      value={item.sellingPrice}
                      onChange={(e) => updateOrderItem(index, 'sellingPrice', Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-2 flex items-end">
                    {orderItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeOrderItem(index)}
                        className="btn-danger text-sm w-full"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
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
                Create Order
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
                Order #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{order.customer.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {format(new Date(order.orderDate), 'MMM dd, yyyy')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{order.orderItems.length} items</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">
                    Rs. {Number(order.totalAmount).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    Paid: Rs. {Number(order.paidAmount).toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      order.status === 'Completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {orders.length === 0 && (
        <div className="card text-center py-12 mt-6">
          <p className="text-gray-500">No orders found. Create your first order to get started.</p>
        </div>
      )}
    </div>
  )
}