import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Return items from an order
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const client = await db.pool.connect();
  try {
    const body = await request.json()
    const { items } = body // Array of { orderItemId, quantity }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items to return are required' }, { status: 400 })
    }
    
    await client.query('BEGIN');
    
    // Fetch the order
    const orderResult = await client.query(
      'SELECT * FROM orders WHERE id = $1',
      [params.id]
    );
    
    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    
    const order = orderResult.rows[0];
    
    if (order.status === 'Cancelled') {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Cannot return items from a cancelled order' }, { status: 400 })
    }
    
    let totalRefundAmount = 0;
    let totalCostReduction = 0;
    let totalProfitReduction = 0;
    
    // Process each return item
    for (const item of items) {
      const { orderItemId, quantity } = item;
      
      if (!orderItemId || !quantity || quantity <= 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Invalid return item data' }, { status: 400 })
      }
      
      // Fetch the order item
      const orderItemResult = await client.query(
        'SELECT * FROM order_items WHERE id = $1 AND order_id = $2',
        [orderItemId, params.id]
      );
      
      if (orderItemResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: `Order item ${orderItemId} not found` }, { status: 404 })
      }
      
      const orderItem = orderItemResult.rows[0];
      const currentQuantity = parseFloat(orderItem.quantity);
      const returnQuantity = parseFloat(quantity);
      
      if (returnQuantity > currentQuantity) {
        await client.query('ROLLBACK');
        return NextResponse.json({ 
          error: `Cannot return more than ordered. Item has ${currentQuantity}, trying to return ${returnQuantity}` 
        }, { status: 400 })
      }
      
      const sellingPrice = parseFloat(orderItem.selling_price);
      const buyingPrice = parseFloat(orderItem.buying_price);
      const refundAmount = returnQuantity * sellingPrice;
      const costReduction = returnQuantity * buyingPrice;
      const profitReduction = refundAmount - costReduction;
      
      totalRefundAmount += refundAmount;
      totalCostReduction += costReduction;
      totalProfitReduction += profitReduction;
      
      // Add quantity back to product inventory
      await client.query(
        'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
        [returnQuantity, orderItem.product_id]
      );
      
      // Update or delete order item based on remaining quantity
      const remainingQuantity = currentQuantity - returnQuantity;
      
      if (remainingQuantity <= 0) {
        // Delete the order item if fully returned
        await client.query('DELETE FROM order_items WHERE id = $1', [orderItemId]);
      } else {
        // Update the order item with reduced quantity
        const newTotalCost = remainingQuantity * buyingPrice;
        const newTotalRevenue = remainingQuantity * sellingPrice;
        const newProfit = newTotalRevenue - newTotalCost;
        
        await client.query(`
          UPDATE order_items 
          SET quantity = $1, total_cost = $2, total_revenue = $3, profit = $4, updated_at = CURRENT_TIMESTAMP
          WHERE id = $5
        `, [remainingQuantity, newTotalCost, newTotalRevenue, newProfit, orderItemId]);
      }
    }
    
    // Update order totals
    const newTotalAmount = parseFloat(order.total_amount) - totalRefundAmount;
    
    // Calculate new remaining amount
    // If customer paid some amount, the refund should reduce their remaining debt
    const paidAmount = parseFloat(order.paid_amount);
    let newRemainingAmount = newTotalAmount - paidAmount;
    
    // If remaining amount goes negative, it means customer overpaid - refund goes to balance credit
    let balanceAdjustment = totalRefundAmount;
    
    // Check if order was paid from Balance
    const paymentsResult = await client.query(
      "SELECT * FROM payments WHERE order_id = $1 AND payment_method = 'Balance' LIMIT 1",
      [params.id]
    );
    const paidFromBalance = paymentsResult.rows.length > 0;
    
    // Update customer balance (subtract refund amount as it reduces their debt)
    // If paid from balance, the debt was already recorded, so we subtract refund
    // If not paid from balance, only remaining_amount was debt, so we still subtract refund
    await client.query(
      'UPDATE customers SET balance = balance - $1 WHERE id = $2',
      [balanceAdjustment, order.customer_id]
    );
    
    // Update order
    if (newRemainingAmount < 0) {
      newRemainingAmount = 0;
    }
    
    // Check if all items are returned
    const remainingItemsResult = await client.query(
      'SELECT COUNT(*) as count FROM order_items WHERE order_id = $1',
      [params.id]
    );
    const remainingItemsCount = parseInt(remainingItemsResult.rows[0].count);
    
    const newStatus = remainingItemsCount === 0 ? 'Returned' : order.status;
    
    await client.query(`
      UPDATE orders 
      SET total_amount = $1, remaining_amount = $2, status = $3, updated_at = CURRENT_TIMESTAMP,
          notes = COALESCE(notes, '') || $4
      WHERE id = $5
    `, [
      newTotalAmount, 
      newRemainingAmount, 
      newStatus,
      `\n[Return on ${new Date().toISOString()}] Refund: Rs. ${totalRefundAmount.toLocaleString()}`,
      params.id
    ]);
    
    await client.query('COMMIT');
    
    return NextResponse.json({ 
      message: 'Items returned successfully',
      refundAmount: totalRefundAmount,
      newOrderTotal: newTotalAmount,
      itemsRemaining: remainingItemsCount
    })
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing return:', error);
    return NextResponse.json({ error: 'Failed to process return' }, { status: 500 })
  } finally {
    client.release();
  }
}