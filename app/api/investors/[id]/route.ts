import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await db.query(
      `SELECT 
        i.*,
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
      WHERE i.id = $1`,
      [params.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Investor not found' },
        { status: 404 }
      )
    }

    const investor = result.rows[0];
    // Calculate balance
    // Balance = Investment + Profit - Withdrawal
    const balance = (
        parseFloat(investor.total_investment) + 
        parseFloat(investor.total_profit) - 
        parseFloat(investor.total_withdrawn)
    ).toFixed(2);

    return NextResponse.json({ ...investor, balance })
  } catch (error) {
    console.error('Error fetching investor:', error)
    return NextResponse.json(
      { error: 'Failed to fetch investor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, cnic, phone, email, address, status } = body

    const result = await db.query(
      `UPDATE investors 
       SET name = $1, cnic = $2, phone = $3, email = $4, address = $5, status = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [name, cnic, phone, email, address, status, params.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Investor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error updating investor:', error)
    return NextResponse.json(
      { error: 'Failed to update investor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await db.query(
      'DELETE FROM investors WHERE id = $1 RETURNING id',
      [params.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Investor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Investor deleted successfully' })
  } catch (error) {
    console.error('Error deleting investor:', error)
    return NextResponse.json(
      { error: 'Failed to delete investor' },
      { status: 500 }
    )
  }
}
