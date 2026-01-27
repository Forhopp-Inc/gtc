import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date filter properly
    let orderDateFilter = '';
    let expenseDateFilter = '';
    let paymentDateFilter = '';
    let transactionDateFilter = '';
    const params: any[] = [];
    
    if (startDate && endDate) {
        params.push(startDate, endDate);
        orderDateFilter = `WHERE o.order_date >= $1 AND o.order_date <= $2`;
        expenseDateFilter = `WHERE expense_date >= $1 AND expense_date <= $2`;
        paymentDateFilter = `WHERE payment_date >= $1 AND payment_date <= $2`;
        transactionDateFilter = `WHERE transaction_date >= $1 AND transaction_date <= $2`;
    } else if (startDate) {
        params.push(startDate);
        orderDateFilter = `WHERE o.order_date >= $1`;
        expenseDateFilter = `WHERE expense_date >= $1`;
        paymentDateFilter = `WHERE payment_date >= $1`;
        transactionDateFilter = `WHERE transaction_date >= $1`;
    } else if (endDate) {
        params.push(endDate);
        orderDateFilter = `WHERE o.order_date <= $1`;
        expenseDateFilter = `WHERE expense_date <= $1`;
        paymentDateFilter = `WHERE payment_date <= $1`;
        transactionDateFilter = `WHERE transaction_date <= $1`;
    }

    // For subqueries without table alias
    const orderDateFilterSimple = orderDateFilter.replace('o.order_date', 'order_date');

    // 1. Get overall counts (not filtered by date)
    const countsResult = await db.query(`
        SELECT 
            (SELECT COUNT(*) FROM companies) as "totalCompanies",
            (SELECT COUNT(*) FROM products) as "totalProducts",
            (SELECT COUNT(*) FROM customers) as "totalCustomers",
            (SELECT COALESCE(SUM(balance), 0) FROM customers) as "totalCustomerDebt",
            (SELECT COALESCE(SUM(stock_quantity * price), 0) FROM products WHERE stock_quantity > 0) as "inventoryValue"
    `);
    const counts = countsResult.rows[0];

    // 2. Get date-ranged order counts
    const orderCountsQuery = params.length > 0 
        ? `SELECT 
            COUNT(*) as "totalOrders",
            COUNT(*) FILTER (WHERE status = 'Pending') as "pendingOrders",
            COUNT(*) FILTER (WHERE status = 'Completed') as "completedOrders",
            COALESCE(SUM(total_amount), 0) as "totalRevenue",
            COALESCE(SUM(paid_amount), 0) as "totalCollected"
           FROM orders o ${orderDateFilter}`
        : `SELECT 
            COUNT(*) as "totalOrders",
            COUNT(*) FILTER (WHERE status = 'Pending') as "pendingOrders",
            COUNT(*) FILTER (WHERE status = 'Completed') as "completedOrders",
            COALESCE(SUM(total_amount), 0) as "totalRevenue",
            COALESCE(SUM(paid_amount), 0) as "totalCollected"
           FROM orders o`;
    
    const orderCountsResult = await db.query(orderCountsQuery, params);
    const orderCounts = orderCountsResult.rows[0];

    // 3. Get COGS for the period
    const cogsQuery = params.length > 0
        ? `SELECT COALESCE(SUM(oi.total_cost), 0) as "totalCost"
           FROM order_items oi
           JOIN orders o ON oi.order_id = o.id
           ${orderDateFilter}`
        : `SELECT COALESCE(SUM(total_cost), 0) as "totalCost" FROM order_items`;
    
    const cogsResult = await db.query(cogsQuery, params);
    const totalCost = parseFloat(cogsResult.rows[0].totalCost);

    // 4. Get expenses for the period
    const expensesQuery = params.length > 0
        ? `SELECT COALESCE(SUM(amount), 0) as "totalExpenses" FROM expenses ${expenseDateFilter}`
        : `SELECT COALESCE(SUM(amount), 0) as "totalExpenses" FROM expenses`;
    
    const expensesResult = await db.query(expensesQuery, params);
    const totalExpenses = parseFloat(expensesResult.rows[0].totalExpenses);
    
    const totalRevenue = parseFloat(orderCounts.totalRevenue);
    const totalCollected = parseFloat(orderCounts.totalCollected);
    const netProfit = totalRevenue - totalCost - totalExpenses;
    const grossProfit = totalRevenue - totalCost;

    // 5. Cash Flow Stats
    let customerPayments = 0;
    let customerWithdrawals = 0;
    let investorInvestments = 0;
    let investorWithdrawals = 0;
    let purchasePayments = 0;

    // Customer payments (credit payments reduce debt)
    const customerPaymentsQuery = params.length > 0
        ? `SELECT 
            COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0) as "payments",
            COALESCE(SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END), 0) as "withdrawals"
           FROM payments ${paymentDateFilter}`
        : `SELECT 
            COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0) as "payments",
            COALESCE(SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END), 0) as "withdrawals"
           FROM payments`;
    
    const customerPaymentsResult = await db.query(customerPaymentsQuery, params);
    customerPayments = parseFloat(customerPaymentsResult.rows[0].payments);
    customerWithdrawals = parseFloat(customerPaymentsResult.rows[0].withdrawals);

    // Investor transactions
    const investorQuery = params.length > 0
        ? `SELECT 
            COALESCE(SUM(CASE WHEN type = 'Investment' THEN amount ELSE 0 END), 0) as "investments",
            COALESCE(SUM(CASE WHEN type = 'Withdrawal' THEN amount ELSE 0 END), 0) as "withdrawals"
           FROM investor_transactions ${transactionDateFilter}`
        : `SELECT 
            COALESCE(SUM(CASE WHEN type = 'Investment' THEN amount ELSE 0 END), 0) as "investments",
            COALESCE(SUM(CASE WHEN type = 'Withdrawal' THEN amount ELSE 0 END), 0) as "withdrawals"
           FROM investor_transactions`;
    
    try {
        const investorResult = await db.query(investorQuery, params);
        investorInvestments = parseFloat(investorResult.rows[0].investments);
        investorWithdrawals = parseFloat(investorResult.rows[0].withdrawals);
    } catch (e) {
        // Table might not exist
        investorInvestments = 0;
        investorWithdrawals = 0;
    }

    // Company/supplier payments (credits to companies)
    const companyPaymentsQuery = params.length > 0
        ? `SELECT COALESCE(SUM(amount), 0) as "payments"
           FROM company_transactions 
           WHERE type = 'Credit' AND status = 'Completed'
           AND transaction_date >= $1 AND transaction_date <= $2`
        : `SELECT COALESCE(SUM(amount), 0) as "payments"
           FROM company_transactions 
           WHERE type = 'Credit' AND status = 'Completed'`;
    
    try {
        const companyPaymentsResult = await db.query(companyPaymentsQuery, params);
        purchasePayments = parseFloat(companyPaymentsResult.rows[0].payments);
    } catch (e) {
        purchasePayments = 0;
    }

    const totalCashIn = customerPayments + investorInvestments;
    const totalCashOut = totalExpenses + investorWithdrawals + customerWithdrawals + purchasePayments;
    const netCashFlow = totalCashIn - totalCashOut;

    // 6. Get recent orders
    const recentOrdersQuery = params.length > 0
        ? `SELECT 
            o.id, 
            o.order_number as "orderNumber", 
            o.order_date as "orderDate", 
            o.total_amount as "totalAmount", 
            o.paid_amount as "paidAmount", 
            o.remaining_amount as "remainingAmount", 
            o.status,
            json_build_object('id', c.id, 'name', c.name) as customer
          FROM orders o
          JOIN customers c ON o.customer_id = c.id
          ${orderDateFilter}
          ORDER BY o.order_date DESC
          LIMIT 15`
        : `SELECT 
            o.id, 
            o.order_number as "orderNumber", 
            o.order_date as "orderDate", 
            o.total_amount as "totalAmount", 
            o.paid_amount as "paidAmount", 
            o.remaining_amount as "remainingAmount", 
            o.status,
            json_build_object('id', c.id, 'name', c.name) as customer
          FROM orders o
          JOIN customers c ON o.customer_id = c.id
          ORDER BY o.order_date DESC
          LIMIT 15`;
    
    const recentOrdersResult = await db.query(recentOrdersQuery, params);

    // 7. Monthly revenue (last 6 months - not filtered by user date)
    const monthlyRevenueResult = await db.query(`
        SELECT 
            to_char(order_date, 'Mon YYYY') as month, 
            COALESCE(SUM(total_amount), 0) as revenue, 
            COALESCE(SUM(paid_amount), 0) as collected
        FROM orders 
        WHERE order_date >= NOW() - INTERVAL '6 months'
        GROUP BY to_char(order_date, 'YYYY-MM'), to_char(order_date, 'Mon YYYY')
        ORDER BY to_char(order_date, 'YYYY-MM')
    `);

    // 8. Top products
    const topProductsQuery = params.length > 0
        ? `SELECT 
            json_build_object(
                'id', p.id,
                'name', p.name,
                'company', json_build_object('name', c.name)
            ) as product,
            SUM(oi.quantity) as "totalQuantity",
            SUM(oi.total_revenue) as "totalRevenue",
            SUM(oi.profit) as "totalProfit"
          FROM order_items oi
          JOIN products p ON oi.product_id = p.id
          JOIN companies c ON p.company_id = c.id
          JOIN orders o ON oi.order_id = o.id
          ${orderDateFilter}
          GROUP BY p.id, p.name, c.name
          ORDER BY "totalQuantity" DESC
          LIMIT 10`
        : `SELECT 
            json_build_object(
                'id', p.id,
                'name', p.name,
                'company', json_build_object('name', c.name)
            ) as product,
            SUM(oi.quantity) as "totalQuantity",
            SUM(oi.total_revenue) as "totalRevenue",
            SUM(oi.profit) as "totalProfit"
          FROM order_items oi
          JOIN products p ON oi.product_id = p.id
          JOIN companies c ON p.company_id = c.id
          GROUP BY p.id, p.name, c.name
          ORDER BY "totalQuantity" DESC
          LIMIT 10`;
    
    const topProductsResult = await db.query(topProductsQuery, params);

    // 9. Recent expenses
    const recentExpensesQuery = params.length > 0
        ? `SELECT 
            id, category, description, amount, 
            expense_date as "expenseDate", notes
          FROM expenses
          ${expenseDateFilter}
          ORDER BY expense_date DESC
          LIMIT 15`
        : `SELECT 
            id, category, description, amount, 
            expense_date as "expenseDate", notes
          FROM expenses
          ORDER BY expense_date DESC
          LIMIT 15`;
    
    const recentExpensesResult = await db.query(recentExpensesQuery, params);

    // 10. Expense breakdown by category
    const expenseByCategoryQuery = params.length > 0
        ? `SELECT 
            category,
            COALESCE(SUM(amount), 0) as "totalAmount",
            COUNT(*) as "count"
          FROM expenses
          ${expenseDateFilter}
          GROUP BY category
          ORDER BY "totalAmount" DESC`
        : `SELECT 
            category,
            COALESCE(SUM(amount), 0) as "totalAmount",
            COUNT(*) as "count"
          FROM expenses
          GROUP BY category
          ORDER BY "totalAmount" DESC`;
    
    const expenseByCategoryResult = await db.query(expenseByCategoryQuery, params);

    // 11. Top customers by purchase
    const topCustomersQuery = params.length > 0
        ? `SELECT 
            c.id, c.name, c.phone, c.balance,
            COALESCE(SUM(o.total_amount), 0) as "totalPurchases",
            COALESCE(SUM(o.paid_amount), 0) as "totalPaid",
            COUNT(o.id) as "orderCount"
          FROM customers c
          LEFT JOIN orders o ON c.id = o.customer_id AND o.order_date >= $1 AND o.order_date <= $2
          GROUP BY c.id
          ORDER BY "totalPurchases" DESC
          LIMIT 10`
        : `SELECT 
            c.id, c.name, c.phone, c.balance,
            COALESCE(SUM(o.total_amount), 0) as "totalPurchases",
            COALESCE(SUM(o.paid_amount), 0) as "totalPaid",
            COUNT(o.id) as "orderCount"
          FROM customers c
          LEFT JOIN orders o ON c.id = o.customer_id
          GROUP BY c.id
          ORDER BY "totalPurchases" DESC
          LIMIT 10`;
    
    const topCustomersResult = await db.query(topCustomersQuery, params);

    // 12. Low stock products
    const lowStockResult = await db.query(`
        SELECT p.id, p.name, p.stock_quantity as "stockQuantity", p.price,
               c.name as "companyName"
        FROM products p
        JOIN companies c ON p.company_id = c.id
        WHERE p.stock_quantity < 20
        ORDER BY p.stock_quantity ASC
        LIMIT 10
    `);

    // 13. Company balances
    let companyBalances: any[] = [];
    try {
        const companyBalancesResult = await db.query(`
            SELECT 
                c.id, c.name,
                COALESCE(SUM(CASE WHEN ct.type = 'Purchase' THEN ct.amount ELSE 0 END), 0) as "totalPurchases",
                COALESCE(SUM(CASE WHEN ct.type = 'Credit' AND ct.status = 'Completed' THEN ct.amount ELSE 0 END), 0) as "totalPaid",
                (
                    COALESCE(SUM(CASE WHEN ct.type = 'Credit' AND ct.status = 'Completed' THEN ct.amount ELSE 0 END), 0) -
                    COALESCE(SUM(CASE WHEN ct.type = 'Purchase' THEN ct.amount ELSE 0 END), 0)
                ) as "balance"
            FROM companies c
            LEFT JOIN company_transactions ct ON c.id = ct.company_id
            GROUP BY c.id
            HAVING (
                COALESCE(SUM(CASE WHEN ct.type = 'Credit' AND ct.status = 'Completed' THEN ct.amount ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN ct.type = 'Purchase' THEN ct.amount ELSE 0 END), 0)
            ) != 0
            ORDER BY "balance" ASC
            LIMIT 10
        `);
        companyBalances = companyBalancesResult.rows;
    } catch (e) {
        companyBalances = [];
    }

    return NextResponse.json({
      counts: {
        totalCompanies: parseInt(counts.totalCompanies),
        totalProducts: parseInt(counts.totalProducts),
        totalCustomers: parseInt(counts.totalCustomers),
        totalOrders: parseInt(orderCounts.totalOrders),
        pendingOrders: parseInt(orderCounts.pendingOrders),
        completedOrders: parseInt(orderCounts.completedOrders),
      },
      financial: {
        totalCustomerDebt: parseFloat(counts.totalCustomerDebt),
        inventoryValue: parseFloat(counts.inventoryValue),
        totalRevenue,
        totalCollected,
        totalCost,
        totalExpenses,
        grossProfit,
        netProfit
      },
      cashFlow: {
        totalCashIn,
        totalCashOut,
        netCashFlow,
        breakdown: {
            customerPayments,
            investorInvestments,
            expenses: totalExpenses,
            investorWithdrawals,
            customerWithdrawals,
            purchasePayments
        }
      },
      recentOrders: recentOrdersResult.rows,
      monthlyRevenue: monthlyRevenueResult.rows,
      topProducts: topProductsResult.rows,
      topCustomers: topCustomersResult.rows,
      recentExpenses: recentExpensesResult.rows,
      expensesByCategory: expenseByCategoryResult.rows,
      lowStockProducts: lowStockResult.rows,
      companyBalances
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
  }
}