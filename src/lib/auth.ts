import { SignJWT, jwtVerify } from 'jose'

const secretKey = process.env.JWT_SECRET
export const SESSION_MAX_AGE = 60 * 60 * 24

if (!secretKey) {
  throw new Error('FATAL: JWT_SECRET est requis pour lancer l\'application.')
}

const key = new TextEncoder().encode(secretKey)

type SessionPayload = {
  id: string
  email: string
  role: string
  name: string
}

export async function signToken(payload: SessionPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, key)
    return payload
  } catch {
    return null
  }
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE,
    sameSite: 'lax' as const,
  }
}
