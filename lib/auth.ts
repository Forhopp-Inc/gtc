import { jwtVerify, SignJWT } from 'jose'

export const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not defined')
  }
  return new TextEncoder().encode(secret)
}

export async function verifyJwtToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey())
    return payload
  } catch (error) {
    return null
  }
}

export async function signJwtToken(payload: any) {
  const secret = getJwtSecretKey()
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h') // Token expires in 24 hours
    .sign(secret)
}
