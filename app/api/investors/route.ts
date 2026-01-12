import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const result = await db.query(`
      SELECT 
        i.id, 
        i.name, 
        i.cnic, 
        i.phone, 
        i.email, 
        i.address, 
        i.status,
        i.created_at as "createdAt", 
        i.updated_at as "updatedAt",
        (
            SELECT COALESCE(SUM(CASE WHEN type = 'Investment' THEN amount ELSE 0 END), 0) 
            FROM investor_transactions WHERE investor_id = i.id
        ) as total_investment,
        (
            SELECT COALESCE(SUM(CASE WHEN type = 'Withdrawal' THEN amount ELSE 0 END), 0)
            FROM investor_transactions WHERE investor_id = i.id
        ) as total_withdrawn,
        (
            SELECT COALESCE(SUM(CASE WHEN type = 'Profit' THEN amount ELSE 0 END), 0)
            FROM investor_transactions WHERE investor_id = i.id
        ) as total_profit
      FROM investors i
      ORDER BY i.created_at DESC
    `);
    
    // Calculate balance in JS or SQL? 
    // Balance = Investment + Profit - Withdrawal ??
    // Or Balance = Investment - Withdrawal? 
    // Profit is usually allocated but maybe not "Invested" back unless reinvested?
    // User said: "keep records of profit... suppose business did audit... found profit is 2k... we will keep records of it."
    // Usually, Profit increases the Equity (Balance). Withdrawal decreases it. Investment increases it.
    // So Balance = Investment + Profit - Withdrawal.
    
    const investors = result.rows.map(inv => ({
        ...inv,
        balance: (parseFloat(inv.total_investment) + parseFloat(inv.total_profit) - parseFloat(inv.total_withdrawn)).toFixed(2)
    }));

    return NextResponse.json(investors)
  } catch (error) {
    console.error('Error fetching investors:', error);
    return NextResponse.json({ error: 'Failed to fetch investors' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, cnic, phone, email, address } = body
    
    const result = await db.query(
      `INSERT INTO investors (name, cnic, phone, email, address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, cnic, phone, email, address]
    )
    
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('Error creating investor:', error);
    return NextResponse.json({ error: 'Failed to create investor' }, { status: 500 })
  }
}
