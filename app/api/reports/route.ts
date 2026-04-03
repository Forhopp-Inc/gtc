import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const params: any[] = [];
    let dateFilter = '';
    
    if (startDate && endDate) {
      params.push(startDate, endDate);
      dateFilter = 'date_filter';
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

    // 2. Order Items (Product Sales Details)
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

    // 3. Inventory Purchases (Company Transactions - Purchase type)
    const purchasesQuery = params.length > 0
      ? `SELECT 
          ct.id, ct.transaction_date as "date", ct.amount, 
          ct.description, ct.invoice_number as "invoiceNumber",
          ct.status, c.name as "companyName"
        FROM company_transactions ct
        JOIN companies c ON ct.company_id = c.id
        WHERE ct.type = 'Purchase'
        AND ct.transaction_date >= $1 AND ct.transaction_date <= $2
        ORDER BY ct.transaction_date DESC`
      : `SELECT 
          ct.id, ct.transaction_date as "date", ct.amount, 
          ct.description, ct.invoice_number as "invoiceNumber",
          ct.status, c.name as "companyName"
        FROM company_transactions ct
        JOIN companies c ON ct.company_id = c.id
        WHERE ct.type = 'Purchase'
        ORDER BY ct.transaction_date DESC
        LIMIT 100`;
    
    const purchasesResult = await db.query(purchasesQuery, params);

    // 4. Company Payments (Credits to companies)
    const companyPaymentsQuery = params.length > 0
      ? `SELECT 
          ct.id, ct.transaction_date as "date", ct.amount,
          ct.pr_receipt_number as "prReceiptNumber",
          ct.status, c.name as "companyName",
          ct.from_details as "fromDetails"
        FROM company_transactions ct
        JOIN companies c ON ct.company_id = c.id
        WHERE ct.type = 'Credit'
        AND ct.transaction_date >= $1 AND ct.transaction_date <= $2
        ORDER BY ct.transaction_date DESC`
      : `SELECT 
          ct.id, ct.transaction_date as "date", ct.amount,
          ct.pr_receipt_number as "prReceiptNumber",
          ct.status, c.name as "companyName",
          ct.from_details as "fromDetails"
        FROM company_transactions ct
        JOIN companies c ON ct.company_id = c.id
        WHERE ct.type = 'Credit'
        ORDER BY ct.transaction_date DESC
        LIMIT 100`;
    
    const companyPaymentsResult = await db.query(companyPaymentsQuery, params);

    // 5. Expenses
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

    // 6. Expense Summary by Category
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

    // 7. Customer Payments
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

    // 8. Investor Transactions
    let investorTransactions: any[] = [];
    let investorSummary: any[] = [];
    try {
      const investorQuery = params.length > 0
        ? `SELECT 
            it.id, it.transaction_date as "date", it.amount, it.type,
            it.description, i.name as "investorName"
          FROM investor_transactions it
          JOIN investors i ON it.investor_id = i.id
          WHERE it.transaction_date >= $1 AND it.transaction_date <= $2
          ORDER BY it.transaction_date DESC`
        : `SELECT 
            it.id, it.transaction_date as "date", it.amount, it.type,
            it.description, i.name as "investorName"
          FROM investor_transactions it
          JOIN investors i ON it.investor_id = i.id
          ORDER BY it.transaction_date DESC
          LIMIT 100`;
      
      const investorResult = await db.query(investorQuery, params);
      investorTransactions = investorResult.rows;

      // Investor summary
      const investorSummaryQuery = params.length > 0
        ? `SELECT 
            i.name as "investorName",
            COALESCE(SUM(CASE WHEN it.type = 'Investment' THEN it.amount ELSE 0 END), 0) as "investments",
            COALESCE(SUM(CASE WHEN it.type = 'Withdrawal' THEN it.amount ELSE 0 END), 0) as "withdrawals"
          FROM investors i
          LEFT JOIN investor_transactions it ON i.id = it.investor_id
            AND it.transaction_date >= $1 AND it.transaction_date <= $2
          GROUP BY i.id, i.name
          ORDER BY i.name`
        : `SELECT 
            i.name as "investorName",
            COALESCE(SUM(CASE WHEN it.type = 'Investment' THEN it.amount ELSE 0 END), 0) as "investments",
            COALESCE(SUM(CASE WHEN it.type = 'Withdrawal' THEN it.amount ELSE 0 END), 0) as "withdrawals"
          FROM investors i
          LEFT JOIN investor_transactions it ON i.id = it.investor_id
          GROUP BY i.id, i.name
          ORDER BY i.name`;
      
      const investorSummaryResult = await db.query(investorSummaryQuery, params);
      investorSummary = investorSummaryResult.rows;
    } catch (e) {
      // Table might not exist
    }

    // 9. Summary Statistics
    const summaryQuery = params.length > 0
      ? `SELECT 
          (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE order_date >= $1 AND order_date <= $2) as "totalSales",
          (SELECT COALESCE(SUM(paid_amount), 0) FROM orders WHERE order_date >= $1 AND order_date <= $2) as "totalCollected",
          (SELECT COUNT(*) FROM orders WHERE order_date >= $1 AND order_date <= $2) as "orderCount",
          (SELECT COALESCE(SUM(oi.total_cost), 0) FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.order_date >= $1 AND o.order_date <= $2) as "totalCost",
          (SELECT COALESCE(SUM(oi.profit), 0) FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.order_date >= $1 AND o.order_date <= $2) as "grossProfit",
          (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE expense_date >= $1 AND expense_date <= $2) as "totalExpenses"`
      : `SELECT 
          (SELECT COALESCE(SUM(total_amount), 0) FROM orders) as "totalSales",
          (SELECT COALESCE(SUM(paid_amount), 0) FROM orders) as "totalCollected",
          (SELECT COUNT(*) FROM orders) as "orderCount",
          (SELECT COALESCE(SUM(total_cost), 0) FROM order_items) as "totalCost",
          (SELECT COALESCE(SUM(profit), 0) FROM order_items) as "grossProfit",
          (SELECT COALESCE(SUM(amount), 0) FROM expenses) as "totalExpenses"`;
    
    const summaryResult = await db.query(summaryQuery, params);
    const summary = summaryResult.rows[0];

    // 10. Company Balances Summary
    let companyBalances: any[] = [];
    try {
      const companyBalancesQuery = `
        SELECT 
          c.name,
          COALESCE(SUM(CASE WHEN ct.type = 'Purchase' THEN ct.amount ELSE 0 END), 0) as "totalPurchases",
          COALESCE(SUM(CASE WHEN ct.type = 'Credit' AND ct.status = 'Completed' THEN ct.amount ELSE 0 END), 0) as "totalPaid",
          (
            COALESCE(SUM(CASE WHEN ct.type = 'Credit' AND ct.status = 'Completed' THEN ct.amount ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN ct.type = 'Purchase' THEN ct.amount ELSE 0 END), 0)
          ) as "balance"
        FROM companies c
        LEFT JOIN company_transactions ct ON c.id = ct.company_id
        GROUP BY c.id, c.name
        ORDER BY c.name`;
      
      const companyBalancesResult = await db.query(companyBalancesQuery);
      companyBalances = companyBalancesResult.rows;
    } catch (e) {}

    // 11. Customer Balances Summary
    const customerBalancesQuery = `
      SELECT 
        name, phone, balance,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE customer_id = customers.id) as "totalPurchases"
      FROM customers
      WHERE balance > 0
      ORDER BY balance DESC
      LIMIT 50`;
    
    const customerBalancesResult = await db.query(customerBalancesQuery);

    // 12. Current Inventory
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

    return NextResponse.json({
      summary: {
        totalSales: parseFloat(summary.totalSales),
        totalCollected: parseFloat(summary.totalCollected),
        totalReceivable: parseFloat(summary.totalSales) - parseFloat(summary.totalCollected),
        orderCount: parseInt(summary.orderCount),
        totalCost: parseFloat(summary.totalCost),
        grossProfit: parseFloat(summary.grossProfit),
        totalExpenses: parseFloat(summary.totalExpenses),
        netProfit: parseFloat(summary.grossProfit) - parseFloat(summary.totalExpenses)
      },
      orders: ordersResult.rows,
      productSales: orderItemsResult.rows,
      inventoryPurchases: purchasesResult.rows,
      companyPayments: companyPaymentsResult.rows,
      expenses: expensesResult.rows,
      expenseSummary: expenseSummaryResult.rows,
      customerPayments: customerPaymentsResult.rows,
      investorTransactions,
      investorSummary,
      companyBalances,
      customerBalances: customerBalancesResult.rows,
      currentInventory: inventoryResult.rows
    })
  } catch (error) {
    console.error('Reports API error:', error)
    return NextResponse.json({ error: 'Failed to fetch report data' }, { status: 500 })
  }
}
