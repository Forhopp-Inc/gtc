import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}
    if (category) where.category = category
    if (startDate && endDate) {
      where.expenseDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: {
        expenseDate: 'desc',
      },
    })
    return NextResponse.json(expenses)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const expense = await prisma.expense.create({
      data: body,
    })
    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}