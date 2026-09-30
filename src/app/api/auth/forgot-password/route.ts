import { NextRequest, NextResponse } from 'next/server'

import { sendEmail } from '@/lib/email'
import {
  createPasswordResetToken,
  hashPasswordResetToken,
  PASSWORD_RESET_TOKEN_TTL_MS,
} from '@/lib/password-reset'
import { prisma } from '@/lib/prisma'
import { getClientIp, rateLimiter } from '@/lib/rate-limiter'
import { emailSchema } from '@/lib/validation'

const GENERIC_RESPONSE = {
  message: 'Hvis e-postadressen finnes, sender vi en lenke for å tilbakestille passordet.',
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const isAllowed = rateLimiter.checkCustomLimit(
    `forgot-password:${ip}`,
    5,
    15 * 60 * 1000,
    30 * 60 * 1000
  )

  if (!isAllowed) {
    return NextResponse.json(
      { message: 'For mange forespørsler. Prøv igjen senere.' },
      { status: 429 }
    )
  }

  try {
    const body: unknown = await request.json()
    const parsedBody = emailSchema.safeParse(
      typeof body === 'object' && body !== null && 'email' in body
        ? body.email
        : undefined
    )

    if (!parsedBody.success) {
      return NextResponse.json(
        { message: 'Oppgi en gyldig e-postadresse.' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: parsedBody.data },
      select: { id: true, email: true },
    })

    if (!user) {
      return NextResponse.json(GENERIC_RESPONSE)
    }

    const token = createPasswordResetToken()
    const tokenHash = hashPasswordResetToken(token)
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS)

    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      }),
      prisma.passwordResetToken.create({
        data: {
          tokenHash,
          expiresAt,
          userId: user.id,
        },
      }),
    ])

    const baseUrl = process.env.NEXTAUTH_URL ?? request.nextUrl.origin
    const resetUrl = new URL('/reset-password', baseUrl)
    resetUrl.searchParams.set('token', token)

    const emailResult = await sendEmail({
      to: user.email,
      subject: 'Tilbakestill passordet ditt',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
          <h1 style="font-size: 24px;">Tilbakestill passord</h1>
          <p>Vi mottok en forespørsel om å tilbakestille passordet til Svampen-kontoen din.</p>
          <p>
            <a href="${resetUrl.toString()}" style="display: inline-block; padding: 12px 20px; border-radius: 6px; background: #2563eb; color: #ffffff; text-decoration: none;">
              Velg nytt passord
            </a>
          </p>
          <p>Lenken er gyldig i én time. Hvis du ikke ba om dette, kan du se bort fra e-posten.</p>
        </div>
      `,
    })

    if (!emailResult.success) {
      await prisma.passwordResetToken.deleteMany({
        where: { tokenHash },
      })
    }

    return NextResponse.json(GENERIC_RESPONSE)
  } catch {
    return NextResponse.json(
      { message: 'Kunne ikke behandle forespørselen. Prøv igjen senere.' },
      { status: 500 }
    )
  }
}
