import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { verifyJwtToken } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const client = await db.pool.connect();
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('token')?.value
    const payload = await verifyJwtToken(token || '')
    const addedBy = payload?.name || 'System'

    const body = await request.json()
    const { amount, paymentMethod, paymentDate, referenceNo, bankName, notes, type } = body
    const paymentType = type || 'credit';
    
    await client.query('BEGIN');

    // 1. Create Payment Record
    await client.query(
      `INSERT INTO payments (
        customer_id, 
        payment_date, 
        amount, 
        payment_method, 
        reference_no, 
        bank_name, 
        notes,
        type,
        added_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        params.id, 
        paymentDate || new Date(), 
        amount, 
        paymentMethod, 
        referenceNo, 
        bankName, 
        notes,
        paymentType,
        addedBy
      ]
    );

    // 2. Update Customer Balance
    if (paymentType === 'debit') {
        // Withdrawal: Increase balance/debt
        await client.query(
            `UPDATE customers SET balance = balance + $1 WHERE id = $2`,
            [amount, params.id]
        );
    } else {
        // Payment: Decrease balance/debt
        await client.query(
            `UPDATE customers SET balance = balance - $1 WHERE id = $2`,
            [amount, params.id]
        );
    }

    await client.query('COMMIT');

    return NextResponse.json({ message: 'Payment recorded successfully' }, { status: 201 })
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error recording payment:', error);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
  } finally {
    client.release();
  }
}
