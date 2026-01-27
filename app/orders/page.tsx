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

interface BankAccount {
  id: string
  bank_name: string
  account_title: string
  account_number: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
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
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [printDateRange, setPrintDateRange] = useState({ startDate: '', endDate: '' })

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

  // New Customer State
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    cnic: ''
  })

  useEffect(() => {
    fetchOrders()
    fetchCustomers()
    fetchProducts()
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

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomerForm),
      })

      if (response.ok) {
        const newCustomer = await response.json()
        await fetchCustomers() // Refresh list
        setFormData(prev => ({ ...prev, customerId: newCustomer.id })) // Auto select
        setShowCustomerModal(false)
        setNewCustomerForm({ name: '', phone: '', email: '', address: '', cnic: '' })
      }
    } catch (error) {
      console.error('Failed to create customer:', error)
      alert('Failed to create customer')
    }
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
        <div className="flex gap-2">
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-md shadow-sm transition-all text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
            Print Report
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
          >
            {showForm ? 'Cancel' : '+ New Order'}
          </button>
        </div>
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
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Customer *
                </label>
                <button 
                    type="button"
                    onClick={() => setShowCustomerModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                    + New Customer
                </button>
              </div>
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
                          Bank Account
                        </label>
                        <select
                          className="input-field"
                          value={formData.bankName}
                          onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                        >
                          <option value="">Select Bank Account</option>
                          {bankAccounts.map((account) => (
                            <option key={account.id} value={`${account.bank_name} (${account.account_number})`}>
                              {account.bank_name} - {account.account_title} ({account.account_number})
                            </option>
                          ))}
                        </select>
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

      {/* Print Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowPrintModal(false)}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Print Orders Report</h3>
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
                        <div className="border border-gray-200 rounded-lg overflow-hidden" id="orders-print-content">
                            <div className="bg-white p-3">
                                <div className="border-b-2 border-gray-900 pb-2 mb-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h1 className="text-base font-bold text-gray-900">Orders Report</h1>
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
                                    const filteredOrders = orders.filter(order => {
                                        const orderDate = new Date(order.orderDate).toISOString().split('T')[0]
                                        if (printDateRange.startDate && orderDate < printDateRange.startDate) return false
                                        if (printDateRange.endDate && orderDate > printDateRange.endDate) return false
                                        return true
                                    })
                                    const totalSales = filteredOrders.reduce((a, b) => a + parseFloat(b.totalAmount), 0)
                                    const totalPaid = filteredOrders.reduce((a, b) => a + parseFloat(b.paidAmount), 0)
                                    const totalPending = filteredOrders.reduce((a, b) => a + parseFloat(b.remainingAmount), 0)

                                    return (
                                        <>
                                            <div className="flex gap-2 mb-3" style={{fontSize: '9px'}}>
                                                <div className="bg-blue-50 px-2 py-1 rounded flex-1 border border-blue-200">
                                                    <span className="text-blue-600 font-medium">Total Sales: </span>
                                                    <span className="font-bold text-blue-700">Rs. {totalSales.toLocaleString()}</span>
                                                </div>
                                                <div className="bg-green-50 px-2 py-1 rounded flex-1 border border-green-200">
                                                    <span className="text-green-600 font-medium">Paid: </span>
                                                    <span className="font-bold text-green-700">Rs. {totalPaid.toLocaleString()}</span>
                                                </div>
                                                <div className="bg-amber-50 px-2 py-1 rounded flex-1 border border-amber-200">
                                                    <span className="text-amber-600 font-medium">Pending: </span>
                                                    <span className="font-bold text-amber-700">Rs. {totalPending.toLocaleString()}</span>
                                                </div>
                                                <div className="bg-gray-50 px-2 py-1 rounded flex-1 border border-gray-200">
                                                    <span className="text-gray-600 font-medium">Orders: </span>
                                                    <span className="font-bold text-gray-700">{filteredOrders.length}</span>
                                                </div>
                                            </div>

                                            <table className="min-w-full border border-gray-400" style={{fontSize: '10px'}}>
                                                <thead>
                                                    <tr className="bg-gray-100">
                                                        <th className="border border-gray-400 px-2 py-1 text-left font-semibold text-gray-700">Date</th>
                                                        <th className="border border-gray-400 px-2 py-1 text-left font-semibold text-gray-700">Order #</th>
                                                        <th className="border border-gray-400 px-2 py-1 text-left font-semibold text-gray-700">Customer</th>
                                                        <th className="border border-gray-400 px-2 py-1 text-left font-semibold text-gray-700">Items</th>
                                                        <th className="border border-gray-400 px-2 py-1 text-right font-semibold text-gray-700">Total</th>
                                                        <th className="border border-gray-400 px-2 py-1 text-right font-semibold text-gray-700">Paid</th>
                                                        <th className="border border-gray-400 px-2 py-1 text-right font-semibold text-gray-700">Pending</th>
                                                        <th className="border border-gray-400 px-2 py-1 text-center font-semibold text-gray-700">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredOrders
                                                        .sort((a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime())
                                                        .map((order) => (
                                                            <tr key={order.id}>
                                                                <td className="border border-gray-400 px-2 py-1 whitespace-nowrap text-gray-600">
                                                                    {format(new Date(order.orderDate), 'dd/MM/yy')}
                                                                </td>
                                                                <td className="border border-gray-400 px-2 py-1 whitespace-nowrap font-medium text-gray-900">
                                                                    {order.orderNumber}
                                                                </td>
                                                                <td className="border border-gray-400 px-2 py-1 text-gray-800">
                                                                    {order.customer.name}
                                                                </td>
                                                                <td className="border border-gray-400 px-2 py-1 text-gray-700">
                                                                    {order.orderItems.map(item => `${item.product.name} (${item.quantity})`).join(', ')}
                                                                </td>
                                                                <td className="border border-gray-400 px-2 py-1 text-right font-medium text-gray-900">
                                                                    {parseFloat(order.totalAmount).toLocaleString()}
                                                                </td>
                                                                <td className="border border-gray-400 px-2 py-1 text-right font-medium text-green-600">
                                                                    {parseFloat(order.paidAmount).toLocaleString()}
                                                                </td>
                                                                <td className="border border-gray-400 px-2 py-1 text-right font-medium text-amber-600">
                                                                    {parseFloat(order.remainingAmount).toLocaleString()}
                                                                </td>
                                                                <td className="border border-gray-400 px-2 py-1 text-center">
                                                                    <span className={`px-1 py-0.5 text-xs rounded ${
                                                                        order.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                                                                        order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                                                        'bg-amber-100 text-amber-700'
                                                                    }`}>
                                                                        {order.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    }
                                                    {filteredOrders.length === 0 && (
                                                        <tr>
                                                            <td colSpan={8} className="border border-gray-400 px-2 py-4 text-center text-gray-500">
                                                                No orders found for the selected period.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
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
                                const printContent = document.getElementById('orders-print-content')
                                if (printContent) {
                                    const printWindow = window.open('', '_blank')
                                    if (printWindow) {
                                        printWindow.document.write(`
                                            <html>
                                                <head>
                                                    <title>Orders Report</title>
                                                    <style>
                                                        body { font-family: Arial, sans-serif; margin: 10px; font-size: 10px; }
                                                        table { width: 100%; border-collapse: collapse; border: 1px solid #9ca3af; }
                                                        th, td { padding: 4px 6px; text-align: left; border: 1px solid #9ca3af; }
                                                        th { background-color: #f3f4f6; font-weight: 600; }
                                                        .text-right { text-align: right; }
                                                        .text-center { text-align: center; }
                                                        .font-bold, .font-semibold { font-weight: bold; }
                                                        .text-green-600, .text-green-700 { color: #15803d; }
                                                        .text-amber-600, .text-amber-700 { color: #d97706; }
                                                        .text-blue-600, .text-blue-700 { color: #1d4ed8; }
                                                        .text-red-600, .text-red-700 { color: #dc2626; }
                                                        .text-gray-500 { color: #6b7280; }
                                                        .text-gray-600 { color: #4b5563; }
                                                        .text-gray-700 { color: #374151; }
                                                        .text-gray-800 { color: #1f2937; }
                                                        .text-gray-900 { color: #111827; }
                                                        .bg-green-50 { background-color: #f0fdf4; }
                                                        .bg-green-100 { background-color: #dcfce7; }
                                                        .bg-amber-50 { background-color: #fffbeb; }
                                                        .bg-amber-100 { background-color: #fef3c7; }
                                                        .bg-blue-50 { background-color: #eff6ff; }
                                                        .bg-red-100 { background-color: #fee2e2; }
                                                        .bg-gray-50 { background-color: #f9fafb; }
                                                        .bg-gray-100 { background-color: #f3f4f6; }
                                                        .border { border: 1px solid #d1d5db; }
                                                        .border-gray-400 { border-color: #9ca3af; }
                                                        .border-green-200 { border-color: #bbf7d0; }
                                                        .border-amber-200 { border-color: #fde68a; }
                                                        .border-blue-200 { border-color: #bfdbfe; }
                                                        .border-gray-200 { border-color: #e5e7eb; }
                                                        .rounded { border-radius: 4px; }
                                                        .flex { display: flex; }
                                                        .flex-1 { flex: 1; }
                                                        .gap-2 { gap: 8px; }
                                                        .mb-3 { margin-bottom: 12px; }
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

      {/* New Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowCustomerModal(false)}></div>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                            Add New Customer
                        </h3>
                        <form onSubmit={handleCreateCustomer} id="new-customer-form" className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        value={newCustomerForm.name}
                                        onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={newCustomerForm.phone}
                                        onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        className="input-field"
                                        value={newCustomerForm.email}
                                        onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <textarea
                                        className="input-field"
                                        rows={2}
                                        value={newCustomerForm.address}
                                        onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                                    />
                                </div>
                            </div>
                        </form>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="submit"
                            form="new-customer-form"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Create & Select
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowCustomerModal(false)}
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
