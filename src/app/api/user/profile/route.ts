import { NextRequest, NextResponse } from 'next/server'
import { getServerAuthSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'Fornavn er påkrevd'),
  lastName: z.string().min(1, 'Etternavn er påkrevd'),
  email: z.string().email('Ugyldig e-postadresse'),
  phone: z.string().optional(),
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
    const validatedData = updateProfileSchema.parse(body)

    // Check if email is already taken by another user
    if (validatedData.email !== session.user.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: validatedData.email,
          NOT: {
            id: session.user.id,
          },
        },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'E-postadressen er allerede i bruk' },
          { status: 400 }
        )
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone || null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    })

    return NextResponse.json({
      message: 'Profil oppdatert',
      user: updatedUser,
    })
  } catch (error: any) {
    console.error('Error updating profile:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Ugyldig data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Kunne ikke oppdatere profil' },
      { status: 500 }
    )
  }
}

