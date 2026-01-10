import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const orderId = searchParams.get('orderId')

    let query = `
      SELECT 
        p.id, 
        p.customer_id as "customerId", 
        p.order_id as "orderId", 
        p.payment_date as "paymentDate", 
        p.amount, 
        p.payment_method as "paymentMethod", 
        p.reference_no as "referenceNo", 
        p.notes, 
        p.created_at as "createdAt", 
        p.updated_at as "updatedAt",
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
        CASE WHEN o.id IS NOT NULL THEN
            json_build_object(
                'id', o.id, 
                'orderNumber', o.order_number, 
                'customerId', o.customer_id, 
                'orderDate', o.order_date, 
                'totalAmount', o.total_amount, 
                'paidAmount', o.paid_amount, 
                'remainingAmount', o.remaining_amount, 
                'status', o.status, 
                'notes', o.notes, 
                'createdAt', o.created_at, 
                'updatedAt', o.updated_at
            )
        ELSE null END as "order"
      FROM payments p
      JOIN customers c ON p.customer_id = c.id
      LEFT JOIN orders o ON p.order_id = o.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (customerId) {
        query += ` AND p.customer_id = $${idx++}`;
        params.push(customerId);
    }
    if (orderId) {
        query += ` AND p.order_id = $${idx++}`;
        params.push(orderId);
    }

    query += ` ORDER BY p.payment_date DESC`;

    const result = await db.query(query, params);
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const client = await db.pool.connect();
  try {
    const body = await request.json()
    const { customerId, orderId, amount, paymentMethod, referenceNo, notes } = body
    const paymentAmount = parseFloat(amount);

    await client.query('BEGIN');

    // Create payment
    const paymentResult = await client.query(
        `INSERT INTO payments (customer_id, order_id, amount, payment_method, reference_no, notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [customerId, orderId || null, paymentAmount, paymentMethod, referenceNo, notes]
    );
    const paymentId = paymentResult.rows[0].id;

    // Update customer balance (decrement debt)
    await client.query(
        `UPDATE customers SET balance = balance - $1 WHERE id = $2`,
        [paymentAmount, customerId]
    );

    // Update order if exists
    if (orderId) {
        // Fetch current order state
        const orderRes = await client.query('SELECT total_amount, paid_amount FROM orders WHERE id = $1', [orderId]);
        if (orderRes.rows.length > 0) {
            const order = orderRes.rows[0];
            const currentPaid = parseFloat(order.paid_amount);
            const total = parseFloat(order.total_amount);
            
            const newPaid = currentPaid + paymentAmount;
            const newRemaining = total - newPaid;
            const newStatus = newRemaining <= 0 ? 'Completed' : 'Pending';

            await client.query(
                `UPDATE orders SET paid_amount = $1, remaining_amount = $2, status = $3 WHERE id = $4`,
                [newPaid, newRemaining, newStatus, orderId]
            );
        }
    }

    await client.query('COMMIT');

    // Fetch full payment to return
    const finalResult = await client.query(`
      SELECT 
        p.id, 
        p.customer_id as "customerId", 
        p.order_id as "orderId", 
        p.payment_date as "paymentDate", 
        p.amount, 
        p.payment_method as "paymentMethod", 
        p.reference_no as "referenceNo", 
        p.notes, 
        p.created_at as "createdAt", 
        p.updated_at as "updatedAt",
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
        CASE WHEN o.id IS NOT NULL THEN
            json_build_object(
                'id', o.id, 
                'orderNumber', o.order_number, 
                'customerId', o.customer_id, 
                'orderDate', o.order_date, 
                'totalAmount', o.total_amount, 
                'paidAmount', o.paid_amount, 
                'remainingAmount', o.remaining_amount, 
                'status', o.status, 
                'notes', o.notes, 
                'createdAt', o.created_at, 
                'updatedAt', o.updated_at
            )
        ELSE null END as "order"
      FROM payments p
      JOIN customers c ON p.customer_id = c.id
      LEFT JOIN orders o ON p.order_id = o.id
      WHERE p.id = $1
    `, [paymentId]);

    return NextResponse.json(finalResult.rows[0], { status: 201 })
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  } finally {
    client.release();
  }
}
