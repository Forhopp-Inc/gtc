import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { signJwtToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }

    // Fetch user
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username])
    const user = result.rows[0]

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash)

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Create JWT
    const token = await signJwtToken({ id: user.id, username: user.username, name: user.name })

    // Create response
    const response = NextResponse.json({ message: 'Login successful' })

    // Set Cookie
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
