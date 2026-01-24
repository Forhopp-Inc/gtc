import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await db.query(`
      SELECT 
        t.id, 
        t.company_id as "companyId", 
        t.transaction_date as "transactionDate", 
        t.type, 
        t.status,
        t.amount, 
        t.from_details as "fromDetails",
        t.to_details as "toDetails",
        t.pr_receipt_number as "prReceiptNumber", 
        t.pr_receipt_date as "prReceiptDate", 
        t.description, 
        t.notes, 
        t.created_at as "createdAt", 
        t.updated_at as "updatedAt",
        json_build_object(
            'id', c.id, 
            'name', c.name, 
            'contactInfo', c.contact_info, 
            'address', c.address, 
            'officerId', c.officer_id, 
            'createdAt', c.created_at, 
            'updatedAt', c.updated_at
        ) as company
      FROM transactions t
      JOIN companies c ON t.company_id = c.id
      WHERE t.id = $1
    `, [params.id]);

    const transaction = result.rows[0];

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json({ error: 'Failed to fetch transaction' }, { status: 500 })
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
    
    if (body.type !== undefined) { fields.push(`type = $${idx++}`); values.push(body.type); }
    if (body.status !== undefined) { fields.push(`status = $${idx++}`); values.push(body.status); }
    if (body.amount !== undefined) { fields.push(`amount = $${idx++}`); values.push(body.amount); }
    if (body.transactionDate !== undefined) { fields.push(`transaction_date = $${idx++}`); values.push(body.transactionDate); }
    if (body.fromDetails !== undefined) { fields.push(`from_details = $${idx++}`); values.push(body.fromDetails); }
    if (body.toDetails !== undefined) { fields.push(`to_details = $${idx++}`); values.push(body.toDetails); }
    if (body.prReceiptNumber !== undefined) { fields.push(`pr_receipt_number = $${idx++}`); values.push(body.prReceiptNumber); }
    if (body.prReceiptDate !== undefined) { fields.push(`pr_receipt_date = $${idx++}`); values.push(body.prReceiptDate); }
    if (body.invoiceNumber !== undefined) { fields.push(`invoice_number = $${idx++}`); values.push(body.invoiceNumber); }
    if (body.description !== undefined) { fields.push(`description = $${idx++}`); values.push(body.description); }
    if (body.notes !== undefined) { fields.push(`notes = $${idx++}`); values.push(body.notes); }

    if (fields.length === 0) {
       return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    values.push(params.id);
    
    const result = await db.query(`
        UPDATE transactions SET ${fields.join(', ')}
        WHERE id = $${idx}
        RETURNING 
            id, 
            company_id as "companyId", 
            transaction_date as "transactionDate", 
            type, 
            status,
            amount, 
            from_details as "fromDetails",
            to_details as "toDetails",
            pr_receipt_number as "prReceiptNumber", 
            pr_receipt_date as "prReceiptDate", 
            description, 
            notes, 
            created_at as "createdAt", 
            updated_at as "updatedAt"
    `, values);
    
    const transaction = result.rows[0];
    
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await db.query(
      'DELETE FROM transactions WHERE id = $1 RETURNING id',
      [params.id]
    );
    
    if (result.rowCount === 0) {
       return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Transaction deleted successfully' })
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
  }
}
