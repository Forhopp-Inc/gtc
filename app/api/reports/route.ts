import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const params: any[] = [];
    
    if (startDate && endDate) {
      params.push(startDate, endDate);
    }

    // 1. Sales/Orders Summary
    const ordersQuery = params.length > 0
      ? `SELECT 
          o.id, o.order_number as "orderNumber", o.order_date as "orderDate",
          o.total_amount as "totalAmount", o.paid_amount as "paidAmount", 
          o.remaining_amount as "remainingAmount", o.status,
          c.name as "customerName", c.phone as "customerPhone"
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        WHERE o.order_date >= $1 AND o.order_date <= $2
        ORDER BY o.order_date DESC`
      : `SELECT 
          o.id, o.order_number as "orderNumber", o.order_date as "orderDate",
          o.total_amount as "totalAmount", o.paid_amount as "paidAmount", 
          o.remaining_amount as "remainingAmount", o.status,
          c.name as "customerName", c.phone as "customerPhone"
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        ORDER BY o.order_date DESC
        LIMIT 100`;
    
    const ordersResult = await db.query(ordersQuery, params);

    // 2. Product Sales
    let productSales: any[] = [];
    try {
      const orderItemsQuery = params.length > 0
        ? `SELECT 
            p.name as "productName", co.name as "companyName",
            SUM(oi.quantity) as "totalQty",
            AVG(oi.buying_price) as "avgBuyPrice",
            AVG(oi.selling_price) as "avgSellPrice",
            SUM(oi.total_cost) as "totalCost",
            SUM(oi.total_revenue) as "totalRevenue",
            SUM(oi.profit) as "totalProfit"
          FROM order_items oi
          JOIN products p ON oi.product_id = p.id
          JOIN companies co ON p.company_id = co.id
          JOIN orders o ON oi.order_id = o.id
          WHERE o.order_date >= $1 AND o.order_date <= $2
          GROUP BY p.id, p.name, co.name
          ORDER BY SUM(oi.total_revenue) DESC`
        : `SELECT 
            p.name as "productName", co.name as "companyName",
            SUM(oi.quantity) as "totalQty",
            AVG(oi.buying_price) as "avgBuyPrice",
            AVG(oi.selling_price) as "avgSellPrice",
            SUM(oi.total_cost) as "totalCost",
            SUM(oi.total_revenue) as "totalRevenue",
            SUM(oi.profit) as "totalProfit"
          FROM order_items oi
          JOIN products p ON oi.product_id = p.id
          JOIN companies co ON p.company_id = co.id
          GROUP BY p.id, p.name, co.name
          ORDER BY SUM(oi.total_revenue) DESC`;
      
      const orderItemsResult = await db.query(orderItemsQuery, params);
      productSales = orderItemsResult.rows;
    } catch (e) {
      console.error('Product sales query error:', e);
    }

    // 3. Expenses
    let expenses: any[] = [];
    let expenseSummary: any[] = [];
    try {
      const expensesQuery = params.length > 0
        ? `SELECT 
            id, category, description, amount, 
            expense_date as "date", notes
          FROM expenses
          WHERE expense_date >= $1 AND expense_date <= $2
          ORDER BY expense_date DESC`
        : `SELECT 
            id, category, description, amount, 
            expense_date as "date", notes
          FROM expenses
          ORDER BY expense_date DESC
          LIMIT 100`;
      
      const expensesResult = await db.query(expensesQuery, params);
      expenses = expensesResult.rows;

      const expenseSummaryQuery = params.length > 0
        ? `SELECT 
            category, SUM(amount) as "total", COUNT(*) as "count"
          FROM expenses
          WHERE expense_date >= $1 AND expense_date <= $2
          GROUP BY category
          ORDER BY SUM(amount) DESC`
        : `SELECT 
            category, SUM(amount) as "total", COUNT(*) as "count"
          FROM expenses
          GROUP BY category
          ORDER BY SUM(amount) DESC`;
      
      const expenseSummaryResult = await db.query(expenseSummaryQuery, params);
      expenseSummary = expenseSummaryResult.rows;
    } catch (e) {
      console.error('Expenses query error:', e);
    }

    // 4. Customer Payments
    let customerPayments: any[] = [];
    try {
      const customerPaymentsQuery = params.length > 0
        ? `SELECT 
            p.id, p.payment_date as "date", p.amount, p.type,
            p.payment_method as "method", p.notes,
            c.name as "customerName"
          FROM payments p
          JOIN customers c ON p.customer_id = c.id
          WHERE p.payment_date >= $1 AND p.payment_date <= $2
          ORDER BY p.payment_date DESC`
        : `SELECT 
            p.id, p.payment_date as "date", p.amount, p.type,
            p.payment_method as "method", p.notes,
            c.name as "customerName"
          FROM payments p
          JOIN customers c ON p.customer_id = c.id
          ORDER BY p.payment_date DESC
          LIMIT 100`;
      
      const customerPaymentsResult = await db.query(customerPaymentsQuery, params);
      customerPayments = customerPaymentsResult.rows;
    } catch (e) {
      console.error('Customer payments query error:', e);
    }

    // 5. Current Inventory
    let currentInventory: any[] = [];
    try {
      const inventoryQuery = `
        SELECT 
          p.name as "productName", p.category,
          p.stock_quantity as "stock", p.price as "buyPrice",
          (p.stock_quantity * COALESCE(p.price, 0)) as "value",
          c.name as "companyName"
        FROM products p
        JOIN companies c ON p.company_id = c.id
        WHERE p.stock_quantity > 0
        ORDER BY c.name, p.name`;
      
      const inventoryResult = await db.query(inventoryQuery);
      currentInventory = inventoryResult.rows;
    } catch (e) {
      console.error('Inventory query error:', e);
    }

    // 6. Customer Balances
    let customerBalances: any[] = [];
    try {
      const customerBalancesQuery = `
        SELECT 
          name, phone, balance
        FROM customers
        WHERE balance > 0
        ORDER BY balance DESC
        LIMIT 50`;
      
      const customerBalancesResult = await db.query(customerBalancesQuery);
      customerBalances = customerBalancesResult.rows;
    } catch (e) {
      console.error('Customer balances query error:', e);
    }

    // Calculate summary from orders
    let totalSales = 0, totalCollected = 0, orderCount = 0, totalCost = 0, grossProfit = 0, totalExpenses = 0;
    
    ordersResult.rows.forEach((order: any) => {
      totalSales += parseFloat(order.totalAmount) || 0;
      totalCollected += parseFloat(order.paidAmount) || 0;
      orderCount++;
    });
    
    productSales.forEach((item: any) => {
      totalCost += parseFloat(item.totalCost) || 0;
      grossProfit += parseFloat(item.totalProfit) || 0;
    });
    
    expenses.forEach((expense: any) => {
      totalExpenses += parseFloat(expense.amount) || 0;
    });

    return NextResponse.json({
      summary: {
        totalSales,
        totalCollected,
        totalReceivable: totalSales - totalCollected,
        orderCount,
        totalCost,
        grossProfit,
        totalExpenses,
        netProfit: grossProfit - totalExpenses
      },
      orders: ordersResult.rows,
      productSales,
      expenses,
      expenseSummary,
      customerPayments,
      currentInventory,
      customerBalances,
      inventoryPurchases: [],
      companyPayments: [],
      investorTransactions: [],
      investorSummary: [],
      companyBalances: []
    })
  } catch (error) {
    console.error('Reports API error:', error)
    return NextResponse.json({ error: 'Failed to fetch report data', details: String(error) }, { status: 500 })
  }
}
