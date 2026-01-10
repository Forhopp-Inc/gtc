import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const company = await prisma.company.findUnique({
      where: { id: params.id },
      include: {
        officer: true,
        products: true,
        transactions: {
          orderBy: { transactionDate: 'desc' },
        },
      },
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    return NextResponse.json(company)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const company = await prisma.company.update({
      where: { id: params.id },
      data: body,
    })
    return NextResponse.json(company)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.company.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ message: 'Company deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 })
  }
}