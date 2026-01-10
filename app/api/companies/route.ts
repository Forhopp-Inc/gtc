import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
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
        json_build_object(
          'products', (SELECT COUNT(*) FROM products p WHERE p.company_id = c.id),
          'transactions', (SELECT COUNT(*) FROM transactions t WHERE t.company_id = c.id)
        ) as "_count",
        (
            SELECT COALESCE(SUM(
                CASE 
                    WHEN t.type = 'Purchase' THEN -t.amount
                    ELSE t.amount
                END
            ), 0)
            FROM transactions t 
            WHERE t.company_id = c.id
            AND (
                t.status = 'Completed' 
                OR (t.type = 'Purchase' AND t.status = 'Pending')
            )
        ) as "totalBalance"
      FROM companies c
      LEFT JOIN officers o ON c.officer_id = o.id
      ORDER BY c.created_at DESC
    `);
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, contactInfo, address, officerId } = body
    
    const result = await db.query(
      `INSERT INTO companies (name, contact_info, address, officer_id)
       VALUES ($1, $2, $3, $4)
       RETURNING 
        id, 
        name, 
        contact_info as "contactInfo", 
        address, 
        officer_id as "officerId", 
        created_at as "createdAt", 
        updated_at as "updatedAt"`,
      [name, contactInfo, address, officerId]
    )
    
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('Error creating company:', error);
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
  }
}
