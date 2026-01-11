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
    paymentStatus: 'Pending',
    paymentMethod: 'Cash',
    bankName: '',
    transactionNumber: '',
    collectedBy: '',
    orderHandleBy: ''
  })

  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')

  const collectors = [
    "Tahir Mahmood",
    "Nasir Mahmood", 
    "Hammad Nasir",
    "Hassan",
    "Kashif Mahmood",
    "Khaleel Ur Rehman",
    "Huzaifa Karamat"
  ]
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { productId: '', quantity: 1, sellingPrice: 0 }
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
    setOrderItems([...orderItems, { productId: '', quantity: 1, sellingPrice: 0 }])
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
      // Add default buyingPrice (0) to payload if API expects it
      const itemsWithBuyingPrice = orderItems.map(item => ({
        ...item,
        buyingPrice: 0
      }))

      // Map collectedBy to transactionNumber for Cash payments
      const payload = {
        ...formData,
        handledBy: formData.orderHandleBy,
        transactionNumber: formData.paymentMethod === 'Cash' 
            ? formData.collectedBy 
            : formData.transactionNumber,
        notes: formData.notes,
        orderItems: itemsWithBuyingPrice,
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setFormData({ 
            customerId: '', 
            notes: '', 
            paymentStatus: 'Pending', 
            paymentMethod: 'Cash',
            bankName: '',
            transactionNumber: '',
            collectedBy: '',
            orderHandleBy: ''
        })
        setOrderItems([{ productId: '', quantity: 1, sellingPrice: 0 }])
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

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <input 
          type="text" 
          placeholder="Search by Order # or Customer..." 
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
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
        >
          <option value="">All Payment Status</option>
          <option value="paid">Fully Paid</option>
          <option value="unpaid">Unpaid / Partial</option>
        </select>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Handled By *
              </label>
              <select
                required
                className="input-field"
                value={formData.orderHandleBy}
                onChange={(e) => setFormData({ ...formData, orderHandleBy: e.target.value })}
              >
                <option value="">Select Person</option>
                {collectors.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Options */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Status
                </label>
                <select
                  className="input-field"
                  value={formData.paymentStatus}
                  onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                >
                  <option value="Pending">From Balance</option>
                  <option value="Done">Paid</option>
                </select>
              </div>
              
              {formData.paymentStatus === 'Done' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method
                    </label>
                    <select
                      className="input-field"
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>

                  {formData.paymentMethod === 'Cash' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Collected By
                      </label>
                      <select
                        className="input-field"
                        value={formData.collectedBy}
                        onChange={(e) => setFormData({ ...formData, collectedBy: e.target.value })}
                      >
                        <option value="">Select Collector</option>
                        {collectors.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {(formData.paymentMethod === 'Bank' || formData.paymentMethod === 'Cheque') && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bank Name
                        </label>
                        <input
                          type="text"
                          className="input-field"
                          value={formData.bankName}
                          onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                          placeholder="e.g., HBL, Meezan"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Transaction ID / Cheque #
                        </label>
                        <input
                          type="text"
                          className="input-field"
                          value={formData.transactionNumber}
                          onChange={(e) => setFormData({ ...formData, transactionNumber: e.target.value })}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
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
                  <div className="col-span-4">
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
            {orders
              .filter(order => {
                const matchesSearch = 
                  order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  order.customer.name.toLowerCase().includes(searchQuery.toLowerCase());
                
                const orderDateStr = new Date(order.orderDate).toISOString().split('T')[0];
                let matchesDate = true;
                if (startDate && endDate) {
                    matchesDate = orderDateStr >= startDate && orderDateStr <= endDate;
                } else if (startDate) {
                    matchesDate = orderDateStr >= startDate;
                } else if (endDate) {
                    matchesDate = orderDateStr <= endDate;
                }
                
                let matchesPayment = true;
                if (paymentFilter === 'paid') matchesPayment = Number(order.remainingAmount) === 0;
                else if (paymentFilter === 'unpaid') matchesPayment = Number(order.remainingAmount) > 0;
                
                return matchesSearch && matchesDate && matchesPayment;
              })
              .map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/orders/${order.id}`}>
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
