import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const result = await db.query(`
      SELECT 
        o.id, 
        o.name, 
        o.phone, 
        o.email, 
        o.created_at as "createdAt", 
        o.updated_at as "updatedAt",
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', c.id,
            'name', c.name,
            'contactInfo', c.contact_info,
            'address', c.address,
            'officerId', c.officer_id,
            'createdAt', c.created_at,
            'updatedAt', c.updated_at
          )) FROM companies c WHERE c.officer_id = o.id),
          '[]'::json
        ) as companies
      FROM officers o
      ORDER BY o.created_at DESC
    `);
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching officers:', error);
    return NextResponse.json({ error: 'Failed to fetch officers' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, phone, email } = body
    
    const result = await db.query(
      `INSERT INTO officers (name, phone, email)
       VALUES ($1, $2, $3)
       RETURNING 
        id, 
        name, 
        phone, 
        email, 
        created_at as "createdAt", 
        updated_at as "updatedAt"`,
      [name, phone, email]
    )
    
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('Error creating officer:', error);
    return NextResponse.json({ error: 'Failed to create officer' }, { status: 500 })
  }
}
