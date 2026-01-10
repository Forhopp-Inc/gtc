import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get counts
    const [
      totalCompanies,
      totalProducts,
      totalCustomers,
      totalOrders,
      pendingOrders,
      completedOrders,
    ] = await Promise.all([
      prisma.company.count(),
      prisma.product.count(),
      prisma.customer.count(),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'Pending' } }),
      prisma.order.count({ where: { status: 'Completed' } }),
    ])

    // Get total customer debt
    const customers = await prisma.customer.findMany({
      select: { balance: true },
    })
    const totalCustomerDebt = customers.reduce(
      (sum: number, customer: { balance: any }) => sum + Number(customer.balance),
      0
    )

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      take: 5,
      include: {
        customer: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        orderDate: 'desc',
      },
    })

    // Get monthly revenue (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const orders = await prisma.order.findMany({
      where: {
        orderDate: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        orderDate: true,
        totalAmount: true,
        paidAmount: true,
      },
    })

    // Group by month
    const monthlyData = orders.reduce((acc: any, order: any) => {
      const month = order.orderDate.toISOString().slice(0, 7) // YYYY-MM
      if (!acc[month]) {
        acc[month] = {
          month,
          revenue: 0,
          collected: 0,
        }
      }
      acc[month].revenue += Number(order.totalAmount)
      acc[month].collected += Number(order.paidAmount)
      return acc
    }, {})

    const monthlyRevenue = Object.values(monthlyData)

    // Top selling products
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
        totalRevenue: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    })

    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item: any) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: { company: true },
        })
        return {
          product,
          totalQuantity: item._sum.quantity,
          totalRevenue: item._sum.totalRevenue,
        }
      })
    )

    // Recent expenses
    const recentExpenses = await prisma.expense.findMany({
      take: 5,
      orderBy: {
        expenseDate: 'desc',
      },
    })

    return NextResponse.json({
      counts: {
        totalCompanies,
        totalProducts,
        totalCustomers,
        totalOrders,
        pendingOrders,
        completedOrders,
      },
      financial: {
        totalCustomerDebt,
      },
      recentOrders,
      monthlyRevenue,
      topProducts: topProductsWithDetails,
      recentExpenses,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
  }
}