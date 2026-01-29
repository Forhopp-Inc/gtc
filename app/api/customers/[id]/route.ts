import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await db.query(`
      SELECT 
        c.id, 
        c.name, 
        c.phone, 
        c.email, 
        c.address, 
        c.cnic, 
        c.balance, 
        c.created_at as "createdAt", 
        c.updated_at as "updatedAt",
        COALESCE(
          (SELECT json_agg(json_build_object(
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
            'updatedAt', o.updated_at,
            'orderItems', COALESCE(
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
                        'id', prod.id,
                        'name', prod.name,
                        'description', prod.description,
                        'category', prod.category,
                        'companyId', prod.company_id,
                        'createdAt', prod.created_at,
                        'updatedAt', prod.updated_at
                    )
                )) FROM order_items oi 
                JOIN products prod ON oi.product_id = prod.id
                WHERE oi.order_id = o.id),
                '[]'::json
            )
          ) ORDER BY o.order_date DESC) FROM orders o WHERE o.customer_id = c.id),
          '[]'::json
        ) as orders,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', p.id,
            'customerId', p.customer_id,
            'orderId', p.order_id,
            'paymentDate', p.payment_date,
            'amount', p.amount,
            'paymentMethod', p.payment_method,
            'referenceNo', p.reference_no,
            'notes', p.notes,
            'type', p.type,
            'createdAt', p.created_at,
            'updatedAt', p.updated_at
          ) ORDER BY p.payment_date DESC) FROM payments p WHERE p.customer_id = c.id),
          '[]'::json
        ) as payments
      FROM customers c
      WHERE c.id = $1
    `, [params.id]);

    const customer = result.rows[0];

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 })
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
    
    if (body.name !== undefined) { fields.push(`name = $${idx++}`); values.push(body.name); }
    if (body.phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(body.phone); }
    if (body.email !== undefined) { fields.push(`email = $${idx++}`); values.push(body.email); }
    if (body.address !== undefined) { fields.push(`address = $${idx++}`); values.push(body.address); }
    if (body.cnic !== undefined) { fields.push(`cnic = $${idx++}`); values.push(body.cnic); }
    if (body.balance !== undefined) { fields.push(`balance = $${idx++}`); values.push(body.balance); }

    if (fields.length === 0) {
       return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    values.push(params.id);
    
    const result = await db.query(`
        UPDATE customers SET ${fields.join(', ')}
        WHERE id = $${idx}
        RETURNING 
            id, 
            name, 
            phone, 
            email, 
            address, 
            cnic, 
            balance, 
            created_at as "createdAt", 
            updated_at as "updatedAt"
    `, values);
    
    const customer = result.rows[0];
    
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if customer has any orders or payments
    const checkResult = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM orders WHERE customer_id = $1) as order_count,
        (SELECT COUNT(*) FROM payments WHERE customer_id = $1) as payment_count
    `, [params.id]);
    
    const { order_count, payment_count } = checkResult.rows[0];
    
    if (parseInt(order_count) > 0 || parseInt(payment_count) > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete customer with existing orders or payments',
        details: {
          orders: parseInt(order_count),
          payments: parseInt(payment_count)
        },
        message: `This customer has ${order_count} order(s) and ${payment_count} payment(s). Delete them first or transfer to another customer.`
      }, { status: 400 })
    }
    
    const result = await db.query(
      'DELETE FROM customers WHERE id = $1 RETURNING id, name',
      [params.id]
    );
    
    if (result.rowCount === 0) {
       return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      message: 'Customer deleted successfully',
      deletedCustomer: result.rows[0]
    })
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    
    // Handle foreign key constraint error
    if (error.code === '23503') {
      return NextResponse.json({ 
        error: 'Cannot delete customer with existing related records'
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 })
  }
}
