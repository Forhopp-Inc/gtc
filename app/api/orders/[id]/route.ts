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
  try {
    const body = await request.json()
    
    const fields = [];
    const values = [];
    let idx = 1;
    
    if (body.status !== undefined) { fields.push(`status = $${idx++}`); values.push(body.status); }
    if (body.notes !== undefined) { fields.push(`notes = $${idx++}`); values.push(body.notes); }
    // Add other fields if editable

    if (fields.length === 0) {
       return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    values.push(params.id);
    
    const result = await db.query(`
        UPDATE orders SET ${fields.join(', ')}
        WHERE id = $${idx}
        RETURNING *
    `, values);
    
    const order = result.rows[0];
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Map keys to camelCase if needed, but for now simple return might suffice or do full mapping
    // Since PUT returns the updated object, I should map it to match typical response structure if frontend relies on it.
    // However, the current code just returns `order` which would be snake_case from `pg`.
    // I should map it.
    
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
        createdAt: order.created_at,
        updatedAt: order.updated_at
    };

    return NextResponse.json(mappedOrder)
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await db.query(
      'DELETE FROM orders WHERE id = $1 RETURNING id',
      [params.id]
    );
    
    if (result.rowCount === 0) {
       return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Order deleted successfully' })
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
  }
}
