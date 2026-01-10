import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const response = NextResponse.json({ message: 'Logout successful' })
  response.cookies.delete('token')
  return response
}
