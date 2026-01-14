import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const result = await db.query(
      'SELECT * FROM bank_accounts ORDER BY created_at DESC'
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch bank accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bank accounts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bankName, accountTitle, accountNumber, iban } = body;

    const result = await db.query(
      `INSERT INTO bank_accounts (bank_name, account_title, account_number, iban)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [bankName, accountTitle, accountNumber, iban]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to create bank account:', error);
    return NextResponse.json(
      { error: 'Failed to create bank account' },
      { status: 500 }
    );
  }
}
