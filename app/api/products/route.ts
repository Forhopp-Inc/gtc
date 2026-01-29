import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    const result = await db.query(`
      SELECT 
        p.id, 
        p.name, 
        p.description, 
        p.category, 
        p.stock_quantity as "stockQuantity",
        p.price,
        p.company_id as "companyId", 
        p.created_at as "createdAt", 
        p.updated_at as "updatedAt",
        json_build_object(
            'id', c.id, 
            'name', c.name, 
            'contactInfo', c.contact_info, 
            'address', c.address, 
            'officerId', c.officer_id, 
            'createdAt', c.created_at, 
            'updatedAt', c.updated_at
        ) as company
      FROM products p
      JOIN companies c ON p.company_id = c.id
      WHERE ($1::uuid IS NULL OR p.company_id = $1)
      ORDER BY p.created_at DESC
    `, [companyId || null]);

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, category, companyId, stockQuantity = 0 } = body
    
    // Check if product with same name already exists for this company
    const existingProduct = await db.query(
      `SELECT id, name FROM products WHERE LOWER(name) = LOWER($1) AND company_id = $2`,
      [name, companyId]
    );

    if (existingProduct.rows.length > 0) {
      return NextResponse.json(
        { error: `Product "${name}" already exists for this company` },
        { status: 409 }
      );
    }
    
    // Create product
    const result = await db.query(
      `INSERT INTO products (name, description, category, company_id, stock_quantity)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING 
        id, 
        name, 
        description, 
        category, 
        stock_quantity as "stockQuantity",
        company_id as "companyId", 
        created_at as "createdAt", 
        updated_at as "updatedAt"`,
      [name, description, category, companyId, stockQuantity]
    );

    const product = result.rows[0];

    // Then fetch company details to return
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
    
    product.company = companyResult.rows[0];
    
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
