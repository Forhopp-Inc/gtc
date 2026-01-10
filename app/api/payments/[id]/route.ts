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
        p.payment_date as "paymentDate", 
        p.amount, 
        p.payment_method as "paymentMethod", 
        p.reference_no as "referenceNo", 
        p.bank_name as "bankName",
        p.notes, 
        p.created_at as "createdAt",
        json_build_object(
            'id', c.id, 
            'name', c.name, 
            'phone', c.phone
        ) as customer
      FROM payments p
      JOIN customers c ON p.customer_id = c.id
      WHERE p.id = $1
    `, [params.id]);

    const payment = result.rows[0];

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    return NextResponse.json(payment)
  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json({ error: 'Failed to fetch payment' }, { status: 500 })
  }
}
