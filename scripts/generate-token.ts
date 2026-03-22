import { SignJWT } from 'jose'

const secretKey = 'copro-ambassadeur-jwt-secret-2026'
const key = new TextEncoder().encode(secretKey)

async function generate() {
  const token = await new SignJWT({ id: '1', name: 'Test User', role: 'Admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key)
  console.log(token)
}

generate()
