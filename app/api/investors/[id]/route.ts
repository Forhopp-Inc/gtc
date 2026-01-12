import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await db.query(
      `SELECT * FROM investors WHERE id = $1`,
      [params.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Investor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])
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
