import { NextResponse } from 'next/server'
import { getSessionCookieOptions } from '@/lib/auth'

export async function POST() {
  const response = NextResponse.json({ success: true })
  
  // Verify by removing the cookie
  response.cookies.set({
    name: 'auth_token',
    value: '',
    expires: new Date(0),
    ...getSessionCookieOptions(),
  })

  return response
}
