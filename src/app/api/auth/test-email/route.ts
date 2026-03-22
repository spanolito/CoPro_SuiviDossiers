import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/services/email'

export async function GET() {
    await sendEmail({
        to: 'andujar.oscar@gmail.com',
        subject: 'TEST CoPro',
        body: '<p>Ça marche 🚀</p>',
    })

    return NextResponse.json({ success: true })
}