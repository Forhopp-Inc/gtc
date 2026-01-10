import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // 1. Get counts and debt
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

    // 2. Get recent orders
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
            'name', c.name, 
            'phone', c.phone, 
            'email', c.email, 
            'address', c.address, 
            'cnic', c.cnic, 
            'balance', c.balance, 
            'createdAt', c.created_at, 
            'updatedAt', c.updated_at
        ) as customer,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', oi.id,
            'orderId', oi.order_id,
            'productId', oi.product_id,
            'quantity', oi.quantity,
            'buyingPrice', oi.buying_price,
            'sellingPrice', oi.selling_price,
            'totalCost', oi.total_cost,
            'totalRevenue', oi.total_revenue,
            'profit', oi.profit,
            'createdAt', oi.created_at,
            'updatedAt', oi.updated_at,
            'product', json_build_object(
                'id', p.id,
                'name', p.name,
                'description', p.description,
                'category', p.category,
                'companyId', p.company_id,
                'createdAt', p.created_at,
                'updatedAt', p.updated_at
            )
          )) FROM order_items oi 
          JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = o.id),
          '[]'::json
        ) as "orderItems"
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      ORDER BY o.order_date DESC
      LIMIT 5
    `);

    // 3. Monthly revenue
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

    // 4. Top products
    const topProductsResult = await db.query(`
       SELECT 
         json_build_object(
            'id', p.id,
            'name', p.name,
            'description', p.description,
            'category', p.category,
            'companyId', p.company_id,
            'createdAt', p.created_at,
            'updatedAt', p.updated_at,
            'company', json_build_object(
                'id', c.id, 'name', c.name, 'contactInfo', c.contact_info, 'address', c.address, 'officerId', c.officer_id, 'createdAt', c.created_at, 'updatedAt', c.updated_at
            )
         ) as product,
         SUM(oi.quantity) as "totalQuantity",
         SUM(oi.total_revenue) as "totalRevenue"
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN companies c ON p.company_id = c.id
       GROUP BY p.id, c.id, p.name, p.description, p.category, p.company_id, p.created_at, p.updated_at, c.name, c.contact_info, c.address, c.officer_id, c.created_at, c.updated_at
       ORDER BY "totalQuantity" DESC
       LIMIT 5
    `);

    // 5. Recent expenses
    const recentExpensesResult = await db.query(`
        SELECT 
            id, 
            category, 
            description, 
            amount, 
            expense_date as "expenseDate", 
            notes, 
            created_at as "createdAt", 
            updated_at as "updatedAt"
        FROM expenses
        ORDER BY expense_date DESC
        LIMIT 5
    `);

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
