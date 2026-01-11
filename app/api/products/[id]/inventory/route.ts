import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { verifyJwtToken } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('token')?.value
    const payload = await verifyJwtToken(token || '')
    const addedBy = payload?.name || 'System'

    const body = await request.json()
    const { stockToAdd, buyingPrice, totalAmount, invoiceNumber, companyId } = body
    
    // 1. Calculate Current Balance
    const transactionsResult = await db.query(
      `SELECT type, amount, status FROM transactions WHERE company_id = $1`,
      [companyId]
    );

    const currentBalance = transactionsResult.rows.reduce((acc: number, curr: any) => {
        const amount = parseFloat(curr.amount);
        if (curr.type === 'Purchase') {
             // Purchase counts as negative if Completed or Pending
             if (curr.status === 'Completed' || curr.status === 'Pending') {
                 return acc - amount;
             }
        } else {
             // Other types (Advance, Payment) count as positive if Completed
             if (curr.status === 'Completed') {
                 return acc + amount;
             }
        }
        return acc;
    }, 0);

    let balanceDescription = '';
    const cost = parseFloat(totalAmount);
    
    if (currentBalance >= cost) {
        balanceDescription = `Deducted ${cost.toLocaleString()} from credit balance`;
    } else if (currentBalance > 0) {
        const deducted = currentBalance;
        const pending = cost - currentBalance;
        balanceDescription = `Deducted ${deducted.toLocaleString()} from credit balance and ${pending.toLocaleString()} pending`;
    } else {
        balanceDescription = `${cost.toLocaleString()} pending`;
    }
    
    // Fetch product details for calculation and description
    const productResult = await db.query('SELECT name, stock_quantity, price FROM products WHERE id = $1', [params.id]);
    const product = productResult.rows[0];
    const productName = product?.name || 'Product';

    // Calculate Weighted Average Price
    const currentStock = parseFloat(product?.stock_quantity || '0');
    const currentPrice = parseFloat(product?.price || '0');
    const newStock = parseFloat(stockToAdd);
    const newBuyingPrice = parseFloat(buyingPrice);
    
    let updatedPrice = newBuyingPrice;
    if (currentStock > 0) {
        const totalValue = (currentStock * currentPrice) + (newStock * newBuyingPrice);
        const totalStock = currentStock + newStock;
        updatedPrice = totalValue / totalStock;
    }

    const description = `Inventory Purchase: ${stockToAdd} units of ${productName} at ${buyingPrice}/unit. ${balanceDescription}`;
    const notes = `Invoice #: ${invoiceNumber}`;

    // 2. Update Product Stock and Price
    await db.query(
        `UPDATE products SET stock_quantity = stock_quantity + $1, price = $3 WHERE id = $2`,
        [stockToAdd, params.id, updatedPrice]
    );

    // 3. Create Purchase Transaction
    await db.query(
      `INSERT INTO transactions (
        company_id, 
        transaction_date, 
        type, 
        status, 
        amount, 
        invoice_number,
        description, 
        notes,
        from_details,
        added_by
       )
       VALUES ($1, CURRENT_TIMESTAMP, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        companyId, 
        'Purchase', 
        'Completed', 
        totalAmount, 
        invoiceNumber,
        description, 
        notes,
        {
            fromName: "Ghouse Trading Company",
            phone: "+823018481383"
        },
        addedBy
      ]
    );

    return NextResponse.json({ message: 'Inventory added successfully' }, { status: 201 })
  } catch (error) {
    console.error('Error adding inventory:', error);
    return NextResponse.json({ error: 'Failed to add inventory' }, { status: 500 })
  }
}
