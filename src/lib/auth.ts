import { SignJWT, jwtVerify } from 'jose'

const secretKey = process.env.JWT_SECRET

if (!secretKey) {
  throw new Error('FATAL: JWT_SECRET est requis pour lancer l\'application.')
}

const key = new TextEncoder().encode(secretKey)

export async function signToken(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h') // 1 day
    .sign(key)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, key)
    return payload
  } catch (error) {
    return null
  }
}
