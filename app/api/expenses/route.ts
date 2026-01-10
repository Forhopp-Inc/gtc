import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let query = `
      SELECT 
        id, 
        category, 
        description, 
        amount, 
        expense_date as "expenseDate", 
        notes, 
        created_at as "createdAt", 
        updated_at as "updatedAt"
      FROM expenses
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (category) {
        query += ` AND category = $${idx++}`;
        params.push(category);
    }
    if (startDate && endDate) {
        query += ` AND expense_date >= $${idx++} AND expense_date <= $${idx++}`;
        params.push(startDate, endDate);
    }

    query += ` ORDER BY expense_date DESC`;

    const result = await db.query(query, params);
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { category, description, amount, expenseDate, notes } = body
    
    const result = await db.query(
      `INSERT INTO expenses (category, description, amount, expense_date, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING 
        id, 
        category, 
        description, 
        amount, 
        expense_date as "expenseDate", 
        notes, 
        created_at as "createdAt", 
        updated_at as "updatedAt"`,
      [category, description, amount, expenseDate || new Date(), notes]
    )
    
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}
