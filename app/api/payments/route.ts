import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const orderId = searchParams.get('orderId')

    const where: any = {}
    if (customerId) where.customerId = customerId
    if (orderId) where.orderId = orderId

    const payments = await prisma.payment.findMany({
      where,
      include: {
        customer: true,
        order: true,
      },
      orderBy: {
        paymentDate: 'desc',
      },
    })
    return NextResponse.json(payments)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customerId, orderId, amount, paymentMethod, referenceNo, notes } = body

    // Create payment and update balances in a transaction
    const payment = await prisma.$transaction(async (tx) => {
      // Create the payment
      const newPayment = await tx.payment.create({
        data: {
          customerId,
          orderId: orderId || null,
          amount,
          paymentMethod,
          referenceNo,
          notes,
        },
        include: {
          customer: true,
          order: true,
        },
      })

      // Update customer balance (reduce debt)
      await tx.customer.update({
        where: { id: customerId },
        data: {
          balance: {
            decrement: new Decimal(amount),
          },
        },
      })

      // If payment is for a specific order, update order paid amount
      if (orderId) {
        const order = await tx.order.findUnique({
          where: { id: orderId },
        })

        if (order) {
          const newPaidAmount = new Decimal(order.paidAmount).add(amount)
          const newRemainingAmount = new Decimal(order.totalAmount).sub(newPaidAmount)

          await tx.order.update({
            where: { id: orderId },
            data: {
              paidAmount: newPaidAmount,
              remainingAmount: newRemainingAmount,
              status: newRemainingAmount.lte(0) ? 'Completed' : 'Pending',
            },
          })
        }
      }

      return newPayment
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }
}