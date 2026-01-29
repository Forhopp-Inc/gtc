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
            'productName', oi.product_name,
            'productCategory', oi.product_category,
            'companyName', oi.company_name,
            'createdAt', oi.created_at,
            'updatedAt', oi.updated_at,
            'product', CASE WHEN p.id IS NOT NULL THEN json_build_object(
                'id', p.id,
                'name', p.name,
                'description', p.description,
                'category', p.category,
                'companyId', p.company_id,
                'createdAt', p.created_at,
                'updatedAt', p.updated_at,
                'company', CASE WHEN comp.id IS NOT NULL THEN json_build_object(
                    'id', comp.id,
                    'name', comp.name,
                    'contactInfo', comp.contact_info,
                    'address', comp.address,
                    'officerId', comp.officer_id,
                    'createdAt', comp.created_at,
                    'updatedAt', comp.updated_at
                ) ELSE json_build_object('name', oi.company_name) END
            ) ELSE json_build_object(
                'id', NULL,
                'name', COALESCE(oi.product_name, 'Deleted Product'),
                'category', oi.product_category,
                'company', json_build_object('name', COALESCE(oi.company_name, 'Unknown'))
            ) END
          )) FROM order_items oi 
          LEFT JOIN products p ON oi.product_id = p.id
          LEFT JOIN companies comp ON p.company_id = comp.id
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
    const { customerId, orderItems, notes, paymentStatus, paymentMethod, bankName, transactionNumber, handledBy, partialAmount } = body

    await client.query('BEGIN');

    // Generate order number using MAX to avoid duplicates after deletions
    const maxResult = await client.query(`
      SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 5) AS INTEGER)), 0) as max_num 
      FROM orders 
      WHERE order_number LIKE 'ORD-%'
    `);
    const maxOrderNum = parseInt(maxResult.rows[0].max_num) || 0;
    const orderNumber = `ORD-${String(maxOrderNum + 1).padStart(6, '0')}`;

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
        const itemSellingPrice = parseFloat(item.sellingPrice);
        
        // Fetch the current buying price from product table
        const productResult = await client.query(`
            SELECT p.name as product_name, p.category as product_category, p.price as buying_price, c.name as company_name
            FROM products p
            JOIN companies c ON p.company_id = c.id
            WHERE p.id = $1
        `, [item.productId]);
        
        const productDetails = productResult.rows[0] || { product_name: 'Unknown Product', product_category: '', company_name: '', buying_price: 0 };
        
        // Use buying price from product table, fallback to item.buyingPrice if provided, then to 0
        const itemBuyingPrice = parseFloat(productDetails.buying_price) || parseFloat(item.buyingPrice) || 0;
        
        const itemTotalCost = itemQuantity * itemBuyingPrice;
        const itemTotalRevenue = itemQuantity * itemSellingPrice;
        const itemProfit = itemTotalRevenue - itemTotalCost;

        await client.query(
            `INSERT INTO order_items (order_id, product_id, quantity, buying_price, selling_price, total_cost, total_revenue, profit, product_name, product_category, company_name)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [orderId, item.productId, itemQuantity, itemBuyingPrice, itemSellingPrice, itemTotalCost, itemTotalRevenue, itemProfit, 
             productDetails.product_name, productDetails.product_category, productDetails.company_name]
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

    // Calculate Paid/Remaining based on payment status
    let paidAmount = 0;
    let remainingAmount = totalAmount;
    let paidFromBalance = false;

    if (paymentStatus === 'Done') {
        // Full payment
        paidAmount = totalAmount;
        remainingAmount = 0;

        // Check if payment is from Balance (store credit)
        if (paymentMethod === 'Balance') {
            paidFromBalance = true;
        }

        // Create Payment Record
        let paymentNotes = paidFromBalance ? 'Paid from customer balance' : 'Full payment for Order';

        await client.query(
            `INSERT INTO payments (customer_id, order_id, payment_date, amount, payment_method, reference_no, bank_name, notes, added_by)
             VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, $5, $6, $7, $8)`,
            [customerId, orderId, totalAmount, paymentMethod, transactionNumber, bankName || null, paymentNotes, addedBy]
        );
    } else if (paymentStatus === 'Partial') {
        // Partial payment
        const partialPaymentAmount = parseFloat(partialAmount) || 0;
        
        if (partialPaymentAmount <= 0 || partialPaymentAmount >= totalAmount) {
            throw new Error('Invalid partial payment amount. Must be between 0 and total amount.');
        }

        paidAmount = partialPaymentAmount;
        remainingAmount = totalAmount - partialPaymentAmount;

        // Create Payment Record for partial payment
        let paymentNotes = `Partial payment for Order (Rs. ${remainingAmount.toLocaleString()} remaining)`;

        await client.query(
            `INSERT INTO payments (customer_id, order_id, payment_date, amount, payment_method, reference_no, bank_name, notes, added_by)
             VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, $5, $6, $7, $8)`,
            [customerId, orderId, partialPaymentAmount, paymentMethod, transactionNumber, bankName || null, paymentNotes, addedBy]
        );
    }
    // For 'Pending' status, paidAmount stays 0 and remainingAmount stays totalAmount

    // Update order totals
    await client.query(
        `UPDATE orders SET total_amount = $1, paid_amount = $2, remaining_amount = $3 WHERE id = $4`,
        [totalAmount, paidAmount, remainingAmount, orderId]
    );

    // Update customer balance
    // Add remaining debt to customer balance
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
            'productName', oi.product_name,
            'productCategory', oi.product_category,
            'companyName', oi.company_name,
            'createdAt', oi.created_at,
            'updatedAt', oi.updated_at,
            'product', CASE WHEN p.id IS NOT NULL THEN json_build_object(
                'id', p.id,
                'name', p.name,
                'description', p.description,
                'category', p.category,
                'companyId', p.company_id,
                'createdAt', p.created_at,
                'updatedAt', p.updated_at
            ) ELSE json_build_object(
                'id', NULL,
                'name', COALESCE(oi.product_name, 'Deleted Product'),
                'category', oi.product_category,
                'company', json_build_object('name', COALESCE(oi.company_name, 'Unknown'))
            ) END
          )) FROM order_items oi 
          LEFT JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = o.id),
          '[]'::json
        ) as "orderItems"
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.id = $1
    `, [orderId]);

    return NextResponse.json(finalResult.rows[0], { status: 201 })
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Order creation error:', error);
    
    // Provide more descriptive error messages
    let errorMessage = 'Failed to create order';
    if (error.code === '23503') {
      // Foreign key violation
      errorMessage = 'Invalid customer or product ID. Please check your selection.';
    } else if (error.code === '23505') {
      // Unique violation
      errorMessage = 'Duplicate order number. Please try again.';
    } else if (error.code === '23502') {
      // Not null violation
      errorMessage = `Missing required field: ${error.column || 'unknown'}`;
    } else if (error.message) {
      errorMessage = `Order creation failed: ${error.message}`;
    }
    
    return NextResponse.json({ error: errorMessage, details: error.message }, { status: 500 })
  } finally {
    client.release();
  }
}
