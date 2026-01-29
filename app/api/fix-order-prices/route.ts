import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// API to fix old order items with buying_price = 0
export async function POST(request: Request) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    
    // Update order items with buying_price = 0 to use current product price
    const updateResult = await client.query(`
      UPDATE order_items oi
      SET 
        buying_price = p.price,
        total_cost = oi.quantity * p.price,
        profit = oi.total_revenue - (oi.quantity * p.price)
      FROM products p
      WHERE oi.product_id = p.id 
        AND (oi.buying_price = 0 OR oi.buying_price IS NULL)
        AND p.price > 0
    `);
    
    const updatedCount = updateResult.rowCount || 0;
    
    await client.query('COMMIT');
    
    return NextResponse.json({ 
      success: true, 
      message: `Updated ${updatedCount} order items with current buying prices`,
      updatedCount 
    })
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error fixing order prices:', error);
    return NextResponse.json({ 
      error: 'Failed to fix order prices', 
      details: error.message 
    }, { status: 500 })
  } finally {
    client.release();
  }
}

// Get count of order items that need fixing
export async function GET() {
  try {
    const result = await db.query(`
      SELECT COUNT(*) as count
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE (oi.buying_price = 0 OR oi.buying_price IS NULL)
        AND p.price > 0
    `);
    
    return NextResponse.json({ 
      count: parseInt(result.rows[0].count) 
    })
  } catch (error: any) {
    console.error('Error checking order prices:', error);
    return NextResponse.json({ 
      error: 'Failed to check order prices' 
    }, { status: 500 })
  }
}