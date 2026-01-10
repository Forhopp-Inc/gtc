import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const type = searchParams.get('type')

    const where: any = {}
    if (companyId) where.companyId = companyId
    if (type) where.type = type

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        company: true,
      },
      orderBy: {
        transactionDate: 'desc',
      },
    })
    return NextResponse.json(transactions)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const transaction = await prisma.transaction.create({
      data: body,
      include: {
        company: true,
      },
    })
    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}