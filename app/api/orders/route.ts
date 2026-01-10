import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const status = searchParams.get('status')

    const where: any = {}
    if (customerId) where.customerId = customerId
    if (status) where.status = status

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        orderItems: {
          include: {
            product: {
              include: {
                company: true,
              },
            },
          },
        },
        payments: true,
      },
      orderBy: {
        orderDate: 'desc',
      },
    })
    return NextResponse.json(orders)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customerId, orderItems, notes } = body

    // Generate order number
    const orderCount = await prisma.order.count()
    const orderNumber = `ORD-${String(orderCount + 1).padStart(6, '0')}`

    // Calculate totals
    let totalAmount = new Decimal(0)
    let totalCost = new Decimal(0)
    let totalProfit = new Decimal(0)

    // Create order with items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          totalAmount: 0,
          paidAmount: 0,
          remainingAmount: 0,
          status: 'Pending',
          notes,
        },
      })

      // Create order items
      for (const item of orderItems) {
        const itemTotalCost = new Decimal(item.quantity).mul(item.buyingPrice)
        const itemTotalRevenue = new Decimal(item.quantity).mul(item.sellingPrice)
        const itemProfit = itemTotalRevenue.sub(itemTotalCost)

        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            buyingPrice: item.buyingPrice,
            sellingPrice: item.sellingPrice,
            totalCost: itemTotalCost,
            totalRevenue: itemTotalRevenue,
            profit: itemProfit,
          },
        })

        totalAmount = totalAmount.add(itemTotalRevenue)
        totalCost = totalCost.add(itemTotalCost)
        totalProfit = totalProfit.add(itemProfit)
      }

      // Update order with totals
      const updatedOrder = await tx.order.update({
        where: { id: newOrder.id },
        data: {
          totalAmount,
          remainingAmount: totalAmount,
        },
        include: {
          customer: true,
          orderItems: {
            include: {
              product: true,
            },
          },
        },
      })

      // Update customer balance (debt)
      await tx.customer.update({
        where: { id: customerId },
        data: {
          balance: {
            increment: totalAmount,
          },
        },
      })

      return updatedOrder
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}