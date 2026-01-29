import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await db.query(`
      SELECT 
        p.id, 
        p.name, 
        p.description, 
        p.category, 
        p.stock_quantity as "stockQuantity",
        p.price,
        p.company_id as "companyId", 
        p.created_at as "createdAt", 
        p.updated_at as "updatedAt",
        -- Analytics fields
        COALESCE((SELECT AVG(oi.selling_price) FROM order_items oi WHERE oi.product_id = p.id), 0) as "avgSellingPrice",
        COALESCE((SELECT AVG(oi.buying_price) FROM order_items oi WHERE oi.product_id = p.id), 0) as "avgBuyingPrice",
        COALESCE((SELECT SUM(oi.profit) FROM order_items oi WHERE oi.product_id = p.id), 0) as "totalProfit",
        COALESCE((SELECT SUM(oi.quantity) FROM order_items oi WHERE oi.product_id = p.id), 0) as "totalQuantitySold",
        COALESCE((SELECT SUM(oi.total_revenue) FROM order_items oi WHERE oi.product_id = p.id), 0) as "totalRevenue",
        COALESCE((SELECT SUM(oi.total_cost) FROM order_items oi WHERE oi.product_id = p.id), 0) as "totalCost",
        -- Inventory value calculation (stock * average buying price)
        COALESCE(p.stock_quantity * (SELECT AVG(oi.buying_price) FROM order_items oi WHERE oi.product_id = p.id), 0) as "inventoryValue",
        json_build_object(
            'id', c.id, 
            'name', c.name, 
            'contactInfo', c.contact_info, 
            'address', c.address, 
            'officerId', c.officer_id, 
            'createdAt', c.created_at, 
            'updatedAt', c.updated_at
        ) as company,
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
            'order', json_build_object(
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
                'customer', json_build_object(
                    'id', cust.id,
                    'name', cust.name,
                    'phone', cust.phone,
                    'email', cust.email,
                    'address', cust.address,
                    'cnic', cust.cnic,
                    'balance', cust.balance,
                    'createdAt', cust.created_at,
                    'updatedAt', cust.updated_at
                )
            )
          )) 
          FROM order_items oi 
          JOIN orders o ON oi.order_id = o.id
          JOIN customers cust ON o.customer_id = cust.id
          WHERE oi.product_id = p.id),
          '[]'::json
        ) as "orderItems"
      FROM products p
      JOIN companies c ON p.company_id = c.id
      WHERE p.id = $1
    `, [params.id]);

    const product = result.rows[0];

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
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
    if (body.description !== undefined) { fields.push(`description = $${idx++}`); values.push(body.description); }
    if (body.category !== undefined) { fields.push(`category = $${idx++}`); values.push(body.category); }
    if (body.stockQuantity !== undefined) { fields.push(`stock_quantity = $${idx++}`); values.push(body.stockQuantity); }
    if (body.companyId !== undefined) { fields.push(`company_id = $${idx++}`); values.push(body.companyId); }

    if (fields.length === 0) {
       return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    values.push(params.id);
    
    const result = await db.query(`
        UPDATE products SET ${fields.join(', ')}
        WHERE id = $${idx}
        RETURNING 
            id, 
            name, 
            description, 
            category, 
            stock_quantity as "stockQuantity",
            company_id as "companyId", 
            created_at as "createdAt", 
            updated_at as "updatedAt"
    `, values);
    
    const product = result.rows[0];
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await db.query(
      'DELETE FROM products WHERE id = $1 RETURNING id',
      [params.id]
    );
    
    if (result.rowCount === 0) {
       return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
