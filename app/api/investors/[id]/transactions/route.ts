import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await db.query(
      `SELECT * FROM investor_transactions 
       WHERE investor_id = $1 
       ORDER BY transaction_date DESC, created_at DESC`,
      [params.id]
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { type, amount, description, transaction_date, paymentMethod, paymentDetails } = body
    
    // type: 'Investment', 'Withdrawal', 'Profit'

    const result = await db.query(
      `INSERT INTO investor_transactions (investor_id, type, amount, description, transaction_date, payment_method, payment_details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [params.id, type, amount, description, transaction_date || new Date(), paymentMethod || null, paymentDetails || null]
    )
    
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}
