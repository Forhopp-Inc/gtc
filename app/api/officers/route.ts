import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const officers = await prisma.officer.findMany({
      include: {
        companies: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return NextResponse.json(officers)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch officers' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const officer = await prisma.officer.create({
      data: body,
    })
    return NextResponse.json(officer, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create officer' }, { status: 500 })
  }
}