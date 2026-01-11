import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let dateFilter = '';
    const params = [];
    if (startDate && endDate) {
        dateFilter = `WHERE created_at BETWEEN $1 AND $2`;
        params.push(startDate, endDate);
    } else if (startDate) {
        dateFilter = `WHERE created_at >= $1`;
        params.push(startDate);
    } else if (endDate) {
        dateFilter = `WHERE created_at <= $1`;
        params.push(endDate);
    }
    
    // For specific tables where date column name differs
    const orderDateFilter = dateFilter.replace('created_at', 'order_date');
    const expenseDateFilter = dateFilter.replace('created_at', 'expense_date');

    // 1. Get counts and debt (Overall counts usually remain total, but financial stats can be ranged)
    // We'll keep total counts as overall system stats, but add ranged financial stats
    const countsResult = await db.query(`
        SELECT 
            (SELECT COUNT(*) FROM companies) as "totalCompanies",
            (SELECT COUNT(*) FROM products) as "totalProducts",
            (SELECT COUNT(*) FROM customers) as "totalCustomers",
            (SELECT COUNT(*) FROM orders) as "totalOrders",
            (SELECT COUNT(*) FROM orders WHERE status = 'Pending') as "pendingOrders",
            (SELECT COUNT(*) FROM orders WHERE status = 'Completed') as "completedOrders",
            (SELECT COALESCE(SUM(balance), 0) FROM customers) as "totalCustomerDebt"
    `);
    const counts = countsResult.rows[0];

    // Ranged Stats
    const rangedStatsResult = await db.query(`
        SELECT
            (SELECT COALESCE(SUM(total_amount), 0) FROM orders ${orderDateFilter}) as "totalRevenue",
            (SELECT COALESCE(SUM(total_cost), 0) FROM order_items WHERE order_id IN (SELECT id FROM orders ${orderDateFilter})) as "totalCost",
            (SELECT COALESCE(SUM(amount), 0) FROM expenses ${expenseDateFilter}) as "totalExpenses"
    `, params);
    const rangedStats = rangedStatsResult.rows[0];
    
    const totalRevenue = parseFloat(rangedStats.totalRevenue);
    const totalCost = parseFloat(rangedStats.totalCost);
    const totalExpenses = parseFloat(rangedStats.totalExpenses);
    const netProfit = totalRevenue - totalCost - totalExpenses;

    // 2. Get recent orders (Filtered by date if provided, else limit 10)
    const recentOrdersResult = await db.query(`
      SELECT 
        o.id, 
        o.order_number as "orderNumber", 
        o.customer_id as "customerId", 
        o.order_date as "orderDate", 
        o.total_amount as "totalAmount", 
        o.paid_amount as "paidAmount", 
        o.remaining_amount as "remainingAmount", 
        o.status, 
        o.notes, 
        o.created_at as "createdAt", 
        o.updated_at as "updatedAt",
        json_build_object(
            'id', c.id, 
            'name', c.name
        ) as customer
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      ${orderDateFilter}
      ORDER BY o.order_date DESC
      LIMIT 10
    `, params);

    // 3. Monthly revenue (Keep 6 months trend, maybe separate chart, or filter if range is large)
    // For now, let's keep the standard 6 months trend regardless of filter, or adapt if needed.
    // Business robust reports usually want the trend.
    const monthlyRevenueResult = await db.query(`
        SELECT 
            to_char(order_date, 'YYYY-MM') as month, 
            SUM(total_amount) as revenue, 
            SUM(paid_amount) as collected
        FROM orders 
        WHERE order_date >= NOW() - INTERVAL '6 months'
        GROUP BY 1
        ORDER BY 1
    `);

    // 4. Top products (Filtered)
    const topProductsResult = await db.query(`
       SELECT 
         json_build_object(
            'id', p.id,
            'name', p.name,
            'company', json_build_object('name', c.name)
         ) as product,
         SUM(oi.quantity) as "totalQuantity",
         SUM(oi.total_revenue) as "totalRevenue"
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN companies c ON p.company_id = c.id
       WHERE oi.order_id IN (SELECT id FROM orders ${orderDateFilter})
       GROUP BY p.id, p.name, c.name
       ORDER BY "totalQuantity" DESC
       LIMIT 10
    `, params);

    // 5. Recent expenses (Filtered)
    const recentExpensesResult = await db.query(`
        SELECT 
            id, 
            category, 
            description, 
            amount, 
            expense_date as "expenseDate", 
            notes
        FROM expenses
        ${expenseDateFilter}
        ORDER BY expense_date DESC
        LIMIT 10
    `, params);

    return NextResponse.json({
      counts: {
        totalCompanies: parseInt(counts.totalCompanies),
        totalProducts: parseInt(counts.totalProducts),
        totalCustomers: parseInt(counts.totalCustomers),
        totalOrders: parseInt(counts.totalOrders),
        pendingOrders: parseInt(counts.pendingOrders),
        completedOrders: parseInt(counts.completedOrders),
      },
      financial: {
        totalCustomerDebt: parseFloat(counts.totalCustomerDebt),
        totalRevenue,
        totalCost,
        totalExpenses,
        netProfit
      },
      recentOrders: recentOrdersResult.rows,
      monthlyRevenue: monthlyRevenueResult.rows,
      topProducts: topProductsResult.rows,
      recentExpenses: recentExpensesResult.rows,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
  }
}
