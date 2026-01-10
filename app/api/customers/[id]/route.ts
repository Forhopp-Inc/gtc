import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        orders: {
          include: {
            orderItems: {
              include: {
                product: true,
              },
            },
          },
          orderBy: {
            orderDate: 'desc',
          },
        },
        payments: {
          orderBy: {
            paymentDate: 'desc',
          },
        },
      },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json(customer)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: body,
    })
    return NextResponse.json(customer)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.customer.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ message: 'Customer deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 })
  }
}