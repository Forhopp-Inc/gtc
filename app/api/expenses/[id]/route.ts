import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await db.query(`
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
      WHERE id = $1
    `, [params.id]);

    const expense = result.rows[0];

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    return NextResponse.json(expense)
  } catch (error) {
    console.error('Error fetching expense:', error);
    return NextResponse.json({ error: 'Failed to fetch expense' }, { status: 500 })
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
    
    if (body.category !== undefined) { fields.push(`category = $${idx++}`); values.push(body.category); }
    if (body.description !== undefined) { fields.push(`description = $${idx++}`); values.push(body.description); }
    if (body.amount !== undefined) { fields.push(`amount = $${idx++}`); values.push(body.amount); }
    if (body.expenseDate !== undefined) { fields.push(`expense_date = $${idx++}`); values.push(body.expenseDate); }
    if (body.notes !== undefined) { fields.push(`notes = $${idx++}`); values.push(body.notes); }

    if (fields.length === 0) {
       return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    values.push(params.id);
    
    const result = await db.query(`
        UPDATE expenses SET ${fields.join(', ')}
        WHERE id = $${idx}
        RETURNING 
            id, 
            category, 
            description, 
            amount, 
            expense_date as "expenseDate", 
            notes, 
            created_at as "createdAt", 
            updated_at as "updatedAt"
    `, values);
    
    const expense = result.rows[0];
    
    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    return NextResponse.json(expense)
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await db.query(
      'DELETE FROM expenses WHERE id = $1 RETURNING id',
      [params.id]
    );
    
    if (result.rowCount === 0) {
       return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Expense deleted successfully' })
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
  }
}
