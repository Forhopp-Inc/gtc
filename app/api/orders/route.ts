import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { verifyJwtToken } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const status = searchParams.get('status')

    const result = await db.query(`
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
                'updatedAt', p.updated_at,
                'company', json_build_object(
                    'id', comp.id,
                    'name', comp.name,
                    'contactInfo', comp.contact_info,
                    'address', comp.address,
                    'officerId', comp.officer_id,
                    'createdAt', comp.created_at,
                    'updatedAt', comp.updated_at
                )
            )
          )) FROM order_items oi 
          JOIN products p ON oi.product_id = p.id
          JOIN companies comp ON p.company_id = comp.id
          WHERE oi.order_id = o.id),
          '[]'::json
        ) as "orderItems",
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', pay.id,
            'customerId', pay.customer_id,
            'orderId', pay.order_id,
            'paymentDate', pay.payment_date,
            'amount', pay.amount,
            'paymentMethod', pay.payment_method,
            'referenceNo', pay.reference_no,
            'notes', pay.notes,
            'createdAt', pay.created_at,
            'updatedAt', pay.updated_at
          )) FROM payments pay WHERE pay.order_id = o.id),
          '[]'::json
        ) as payments
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE 
        ($1::uuid IS NULL OR o.customer_id = $1)
        AND ($2::text IS NULL OR o.status = $2)
      ORDER BY o.order_date DESC
    `, [customerId || null, status || null]);

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const client = await db.pool.connect();
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('token')?.value
    const payload = await verifyJwtToken(token || '')
    const addedBy = payload?.name || 'System'

    const body = await request.json()
    const { customerId, orderItems, notes, paymentStatus, paymentMethod, bankName, transactionNumber, handledBy } = body

    await client.query('BEGIN');

    // Generate order number
    const countResult = await client.query('SELECT count(*) FROM orders');
    const orderCount = parseInt(countResult.rows[0].count);
    const orderNumber = `ORD-${String(orderCount + 1).padStart(6, '0')}`;

    // Determine Status
    const status = 'Completed';

    // Create order (initial amounts 0, updated later)
    const orderResult = await client.query(
        `INSERT INTO orders (order_number, customer_id, total_amount, paid_amount, remaining_amount, status, notes, added_by, handled_by)
         VALUES ($1, $2, 0, 0, 0, $3, $4, $5, $6)
         RETURNING id`,
        [orderNumber, customerId, status, notes, addedBy, handledBy]
    );
    const orderId = orderResult.rows[0].id;

    let totalAmount = 0;
    let totalCost = 0;
    let totalProfit = 0;

    // Create order items
    for (const item of orderItems) {
        const itemQuantity = parseFloat(item.quantity);
        const itemBuyingPrice = parseFloat(item.buyingPrice);
        const itemSellingPrice = parseFloat(item.sellingPrice);
        
        const itemTotalCost = itemQuantity * itemBuyingPrice;
        const itemTotalRevenue = itemQuantity * itemSellingPrice;
        const itemProfit = itemTotalRevenue - itemTotalCost;

        await client.query(
            `INSERT INTO order_items (order_id, product_id, quantity, buying_price, selling_price, total_cost, total_revenue, profit)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [orderId, item.productId, itemQuantity, itemBuyingPrice, itemSellingPrice, itemTotalCost, itemTotalRevenue, itemProfit]
        );

        // Deduct from inventory
        await client.query(
            `UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2`,
            [itemQuantity, item.productId]
        );

        totalAmount += itemTotalRevenue;
        totalCost += itemTotalCost;
        totalProfit += itemProfit;
    }

    // Calculate Paid/Remaining
    let paidAmount = 0;
    let remainingAmount = totalAmount;

    if (paymentStatus === 'Done') {
        paidAmount = totalAmount;
        remainingAmount = 0;

        // Create Payment Record
        let paymentNotes = 'Immediate payment for Order';

        await client.query(
            `INSERT INTO payments (customer_id, order_id, payment_date, amount, payment_method, reference_no, bank_name, notes, added_by)
             VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, $5, $6, $7, $8)`,
            [customerId, orderId, totalAmount, paymentMethod, transactionNumber, bankName || null, paymentNotes, addedBy]
        );
    }

    // Update order totals
    await client.query(
        `UPDATE orders SET total_amount = $1, paid_amount = $2, remaining_amount = $3 WHERE id = $4`,
        [totalAmount, paidAmount, remainingAmount, orderId]
    );

    // Update customer balance (Add the remaining debt)
    if (remainingAmount > 0) {
        await client.query(
            `UPDATE customers SET balance = balance + $1 WHERE id = $2`,
            [remainingAmount, customerId]
        );
    }

    await client.query('COMMIT');

    // Fetch full order to return
    const finalResult = await client.query(`
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
      WHERE o.id = $1
    `, [orderId]);

    return NextResponse.json(finalResult.rows[0], { status: 201 })
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  } finally {
    client.release();
  }
}
