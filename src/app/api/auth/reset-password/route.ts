import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { hashPasswordResetToken } from '@/lib/password-reset'
import { prisma } from '@/lib/prisma'
import { getClientIp, rateLimiter } from '@/lib/rate-limiter'
import { passwordSchema } from '@/lib/validation'

const resetPasswordSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/),
  password: passwordSchema,
})

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const isAllowed = rateLimiter.checkCustomLimit(
    `reset-password:${ip}`,
    10,
    15 * 60 * 1000,
    30 * 60 * 1000
  )

  if (!isAllowed) {
    return NextResponse.json(
      { message: 'For mange forsøk. Prøv igjen senere.' },
      { status: 429 }
    )
  }

  try {
    const body: unknown = await request.json()
    const parsedBody = resetPasswordSchema.safeParse(body)

    if (!parsedBody.success) {
      return NextResponse.json(
        { message: 'Lenken eller passordet er ugyldig.' },
        { status: 400 }
      )
    }

    const tokenHash = hashPasswordResetToken(parsedBody.data.token)
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        expiresAt: true,
        userId: true,
      },
    })

    if (!resetToken || resetToken.expiresAt <= new Date()) {
      if (resetToken) {
        await prisma.passwordResetToken.delete({
          where: { id: resetToken.id },
        })
      }

      return NextResponse.json(
        { message: 'Lenken er ugyldig eller har utløpt. Be om en ny lenke.' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(parsedBody.data.password, 12)

    await prisma.$transaction([
      prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      }),
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { userId: resetToken.userId },
      }),
    ])

    return NextResponse.json({
      message: 'Passordet er oppdatert. Du kan nå logge inn.',
    })
  } catch {
    return NextResponse.json(
      { message: 'Kunne ikke tilbakestille passordet. Prøv igjen senere.' },
      { status: 500 }
    )
  }
}
