import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const result = await db.query(`
      SELECT 
        c.id, 
        c.name, 
        c.phone, 
        c.email, 
        c.address, 
        c.cnic, 
        c.balance, 
        c.created_at as "createdAt", 
        c.updated_at as "updatedAt",
        json_build_object(
          'orders', (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id),
          'payments', (SELECT COUNT(*) FROM payments p WHERE p.customer_id = c.id)
        ) as "_count"
      FROM customers c
      ORDER BY c.created_at DESC
    `);
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, phone, email, address, cnic, balance } = body
    
    // Check for duplicates by name (case-insensitive), phone, or CNIC
    const conditions = ['LOWER(TRIM(name)) = LOWER(TRIM($1))']
    const params: string[] = [name]
    
    if (phone && phone.trim()) {
      params.push(phone)
      conditions.push(`phone = $${params.length}`)
    }
    
    if (cnic && cnic.trim()) {
      params.push(cnic)
      conditions.push(`cnic = $${params.length}`)
    }
    
    const duplicateCheck = await db.query(`
      SELECT id, name, phone, cnic FROM customers 
      WHERE ${conditions.join(' OR ')}
    `, params)
    
    if (duplicateCheck.rows.length > 0) {
      const existing = duplicateCheck.rows[0]
      let duplicateField = 'name'
      if (phone && existing.phone === phone) duplicateField = 'phone'
      if (cnic && existing.cnic === cnic) duplicateField = 'CNIC'
      
      return NextResponse.json({ 
        error: `Customer with this ${duplicateField} already exists`,
        existingCustomer: {
          id: existing.id,
          name: existing.name,
          phone: existing.phone,
          cnic: existing.cnic
        }
      }, { status: 409 })
    }
    
    const result = await db.query(
      `INSERT INTO customers (name, phone, email, address, cnic, balance)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING 
        id, 
        name, 
        phone, 
        email, 
        address, 
        cnic, 
        balance, 
        created_at as "createdAt", 
        updated_at as "updatedAt"`,
      [name, phone, email, address, cnic, balance || 0]
    )
    
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}
