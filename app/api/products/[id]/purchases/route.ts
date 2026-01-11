import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Get Product Details (Name and Company ID)
    const productResult = await db.query(
        `SELECT name, company_id FROM products WHERE id = $1`,
        [params.id]
    );

    const product = productResult.rows[0];
    if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // 2. Find Transactions
    // We look for transactions from this company that mention "Inventory Purchase" and the product name
    const transactionsResult = await db.query(`
      SELECT 
        id, 
        transaction_date as "transactionDate", 
        amount, 
        invoice_number as "invoiceNumber",
        description, 
        notes,
        added_by as "addedBy",
        created_at as "createdAt"
      FROM transactions 
      WHERE company_id = $1 
      AND type = 'Purchase'
      AND description ILIKE '%Inventory Purchase%'
      AND description ILIKE '%' || $2 || '%'
      ORDER BY transaction_date DESC
      LIMIT 20
    `, [product.company_id, product.name]);

    return NextResponse.json(transactionsResult.rows)
  } catch (error) {
    console.error('Error fetching product purchases:', error);
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 })
  }
}
