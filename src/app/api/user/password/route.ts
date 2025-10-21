import { NextRequest, NextResponse } from 'next/server'
import { getServerAuthSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Nåværende passord er påkrevd'),
  newPassword: z.string().min(6, 'Nytt passord må være minst 6 tegn'),
})

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerAuthSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Ikke autentisert' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = changePasswordSchema.parse(body)

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    })

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Bruker ikke funnet' },
        { status: 404 }
      )
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      validatedData.currentPassword,
      user.password
    )

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Nåværende passord er feil' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10)

    // Update password
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    })

    return NextResponse.json({
      message: 'Passord endret',
    })
  } catch (error: any) {
    console.error('Error changing password:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Ugyldig data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Kunne ikke endre passord' },
      { status: 500 }
    )
  }
}

