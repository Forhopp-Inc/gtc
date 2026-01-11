import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await db.query(`
      SELECT 
        c.id, 
        c.name, 
        c.contact_info as "contactInfo", 
        c.address, 
        c.officer_id as "officerId", 
        c.created_at as "createdAt", 
        c.updated_at as "updatedAt",
        CASE WHEN o.id IS NOT NULL THEN
          json_build_object(
            'id', o.id,
            'name', o.name,
            'phone', o.phone,
            'email', o.email,
            'createdAt', o.created_at,
            'updatedAt', o.updated_at
          )
        ELSE null END as officer,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', p.id,
            'name', p.name,
            'description', p.description,
            'category', p.category,
            'stockQuantity', p.stock_quantity,
            'companyId', p.company_id,
            'createdAt', p.created_at,
            'updatedAt', p.updated_at,
            'lastPurchase', (
                SELECT json_build_object(
                    'id', t.id,
                    'date', t.transaction_date,
                    'amount', t.amount,
                    'invoiceNumber', t.invoice_number
                )
                FROM transactions t
                WHERE t.company_id = c.id 
                AND t.type = 'Purchase' 
                AND t.description ILIKE '%' || p.name || '%'
                ORDER BY t.transaction_date DESC
                LIMIT 1
            )
          )) FROM products p WHERE p.company_id = c.id),
          '[]'::json
        ) as products,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', t.id,
            'companyId', t.company_id,
            'transactionDate', t.transaction_date,
            'type', t.type,
            'status', t.status,
            'amount', t.amount,
            'fromDetails', t.from_details,
            'toDetails', t.to_details,
            'prReceiptNumber', t.pr_receipt_number,
            'prReceiptDate', t.pr_receipt_date,
            'description', t.description,
            'notes', t.notes,
            'createdAt', t.created_at,
            'updatedAt', t.updated_at
          ) ORDER BY t.transaction_date DESC, t.created_at DESC) FROM transactions t WHERE t.company_id = c.id),
          '[]'::json
        ) as transactions
      FROM companies c
      LEFT JOIN officers o ON c.officer_id = o.id
      WHERE c.id = $1
    `, [params.id]);

    const company = result.rows[0];

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    return NextResponse.json(company)
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 })
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
    
    if (body.name !== undefined) { fields.push(`name = $${idx++}`); values.push(body.name); }
    if (body.contactInfo !== undefined) { fields.push(`contact_info = $${idx++}`); values.push(body.contactInfo); }
    if (body.address !== undefined) { fields.push(`address = $${idx++}`); values.push(body.address); }
    if (body.officerId !== undefined) { fields.push(`officer_id = $${idx++}`); values.push(body.officerId); }

    if (fields.length === 0) {
       return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    values.push(params.id);
    
    const result = await db.query(`
        UPDATE companies SET ${fields.join(', ')}
        WHERE id = $${idx}
        RETURNING 
            id, 
            name, 
            contact_info as "contactInfo", 
            address, 
            officer_id as "officerId", 
            created_at as "createdAt", 
            updated_at as "updatedAt"
    `, values);
    
    const company = result.rows[0];
    
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    return NextResponse.json(company)
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await db.query(
      'DELETE FROM companies WHERE id = $1 RETURNING id',
      [params.id]
    );
    
    if (result.rowCount === 0) {
       return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Company deleted successfully' })
  } catch (error) {
    console.error('Error deleting company:', error);
    return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 })
  }
}
