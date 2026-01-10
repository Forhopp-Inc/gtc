import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { verifyJwtToken } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const type = searchParams.get('type')

    let query = `
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
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (companyId) {
        query += ` AND t.company_id = $${idx++}`;
        params.push(companyId);
    }
    if (type) {
        query += ` AND t.type = $${idx++}`;
        params.push(type);
    }

    query += ` ORDER BY t.transaction_date DESC`;

    const result = await db.query(query, params);
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('token')?.value
    const payload = await verifyJwtToken(token || '')
    const addedBy = payload?.name || 'System'

    const body = await request.json()
    const { 
        companyId, 
        transactionDate, 
        type, 
        amount, 
        status = 'Pending', 
        fromDetails, 
        toDetails, 
        prReceiptNumber, 
        prReceiptDate, 
        description, 
        notes 
    } = body
    
    // First create transaction
    const result = await db.query(
      `INSERT INTO transactions (
        company_id, 
        transaction_date, 
        type, 
        status, 
        amount, 
        from_details, 
        to_details, 
        pr_receipt_number, 
        pr_receipt_date, 
        description, 
        notes,
        added_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
        added_by as "addedBy",
        created_at as "createdAt", 
        updated_at as "updatedAt"`,
      [
        companyId, 
        transactionDate || new Date(), 
        type, 
        status, 
        amount, 
        fromDetails, 
        toDetails, 
        prReceiptNumber, 
        prReceiptDate, 
        description, 
        notes,
        addedBy
      ]
    );

    const transaction = result.rows[0];

    // Fetch company to return
    const companyResult = await db.query(
        `SELECT 
            id, 
            name, 
            contact_info as "contactInfo", 
            address, 
            officer_id as "officerId", 
            created_at as "createdAt", 
            updated_at as "updatedAt"
         FROM companies WHERE id = $1`,
        [companyId]
    );

    transaction.company = companyResult.rows[0];

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}
