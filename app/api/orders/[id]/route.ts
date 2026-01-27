import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
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
        o.handled_by as "handledBy",
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
          ) ORDER BY pay.payment_date DESC) FROM payments pay WHERE pay.order_id = o.id),
          '[]'::json
        ) as payments
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.id = $1
    `, [params.id]);

    const order = result.rows[0];

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const client = await db.pool.connect();
  try {
    const body = await request.json()
    
    await client.query('BEGIN');
    
    // First, fetch the current order to check for status changes
    const currentOrderResult = await client.query(
      'SELECT * FROM orders WHERE id = $1',
      [params.id]
    );
    
    if (currentOrderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    
    const currentOrder = currentOrderResult.rows[0];
    const previousStatus = currentOrder.status;
    const newStatus = body.status !== undefined ? body.status : previousStatus;
    
    // Check if order was paid from Balance (to handle it differently)
    const paymentsResult = await client.query(
      "SELECT * FROM payments WHERE order_id = $1 AND payment_method = 'Balance' LIMIT 1",
      [params.id]
    );
    const paidFromBalance = paymentsResult.rows.length > 0;
    
    // Handle balance adjustment if order is being cancelled
    // When order was created:
    // - If unpaid: remaining_amount was ADDED to customer balance (debt)
    // - If paid from Balance: total_amount was ADDED to customer balance (debt)
    // When cancelled, we need to SUBTRACT it to remove the debt
    if (newStatus === 'Cancelled' && previousStatus !== 'Cancelled') {
      let balanceToSubtract = 0;
      
      if (paidFromBalance) {
        // Paid from balance - subtract total amount
        balanceToSubtract = parseFloat(currentOrder.total_amount);
      } else {
        // Not paid or paid with other method - subtract remaining amount
        balanceToSubtract = parseFloat(currentOrder.remaining_amount);
      }
      
      if (balanceToSubtract > 0) {
        await client.query(
          'UPDATE customers SET balance = balance - $1 WHERE id = $2',
          [balanceToSubtract, currentOrder.customer_id]
        );
      }
    }
    
    // Handle balance restoration if order is being un-cancelled
    // Re-add the debt back to customer balance
    if (previousStatus === 'Cancelled' && newStatus !== 'Cancelled') {
      let balanceToAdd = 0;
      
      if (paidFromBalance) {
        // Paid from balance - add total amount back
        balanceToAdd = parseFloat(currentOrder.total_amount);
      } else {
        // Not paid or paid with other method - add remaining amount back
        balanceToAdd = parseFloat(currentOrder.remaining_amount);
      }
      
      if (balanceToAdd > 0) {
        await client.query(
          'UPDATE customers SET balance = balance + $1 WHERE id = $2',
          [balanceToAdd, currentOrder.customer_id]
        );
      }
    }
    
    const fields = [];
    const values = [];
    let idx = 1;
    
    if (body.status !== undefined) { fields.push(`status = $${idx++}`); values.push(body.status); }
    if (body.notes !== undefined) { fields.push(`notes = $${idx++}`); values.push(body.notes); }
    if (body.orderDate !== undefined) { fields.push(`order_date = $${idx++}`); values.push(body.orderDate); }

    if (fields.length === 0) {
       await client.query('ROLLBACK');
       return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    values.push(params.id);
    
    const result = await client.query(`
        UPDATE orders SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${idx}
        RETURNING *
    `, values);
    
    const order = result.rows[0];
    
    await client.query('COMMIT');
    
    const mappedOrder = {
        id: order.id,
        orderNumber: order.order_number,
        customerId: order.customer_id,
        orderDate: order.order_date,
        totalAmount: order.total_amount,
        paidAmount: order.paid_amount,
        remainingAmount: order.remaining_amount,
        status: order.status,
        notes: order.notes,
        handledBy: order.handled_by,
        createdAt: order.created_at,
        updatedAt: order.updated_at
    };

    return NextResponse.json(mappedOrder)
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  } finally {
    client.release();
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    
    // First, fetch the order to get balance info
    const orderResult = await client.query(
      'SELECT * FROM orders WHERE id = $1',
      [params.id]
    );
    
    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    
    const order = orderResult.rows[0];
    
    // Only adjust balance if order is not already cancelled
    if (order.status !== 'Cancelled') {
      // Check if order was paid from Balance
      const paymentsResult = await client.query(
        "SELECT * FROM payments WHERE order_id = $1 AND payment_method = 'Balance' LIMIT 1",
        [params.id]
      );
      const paidFromBalance = paymentsResult.rows.length > 0;
      
      // Calculate balance to subtract from customer
      // When order was created:
      // - If unpaid/partial: remaining_amount was ADDED to customer balance (debt)
      // - If paid from Balance: total_amount was ADDED to customer balance (debt)
      // When deleted, we need to SUBTRACT it to remove the debt
      let balanceToSubtract = 0;
      
      if (paidFromBalance) {
        // Paid from balance - subtract total amount
        balanceToSubtract = parseFloat(order.total_amount);
      } else {
        // Not paid or paid with other method - subtract remaining amount
        balanceToSubtract = parseFloat(order.remaining_amount);
      }
      
      if (balanceToSubtract > 0) {
        await client.query(
          'UPDATE customers SET balance = balance - $1 WHERE id = $2',
          [balanceToSubtract, order.customer_id]
        );
      }
    }
    
    // Delete associated payments first (foreign key constraint)
    await client.query('DELETE FROM payments WHERE order_id = $1', [params.id]);
    
    // Delete order items (if not cascaded)
    await client.query('DELETE FROM order_items WHERE order_id = $1', [params.id]);
    
    // Delete the order
    await client.query('DELETE FROM orders WHERE id = $1', [params.id]);
    
    await client.query('COMMIT');
    
    return NextResponse.json({ message: 'Order deleted successfully' })
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting order:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
  } finally {
    client.release();
  }
}
