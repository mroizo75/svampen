import { UserRole } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import { getServerAuthSession } from '@/lib/auth-utils'

const roleDestinations: Record<UserRole, string> = {
  ADMIN: '/admin',
  ANSATT: '/ansatt',
  WORKSHOP: '/verksted',
  USER: '/dashboard',
}

export async function GET(request: NextRequest) {
  const session = await getServerAuthSession()

  if (!session?.user?.role) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.redirect(
    new URL(roleDestinations[session.user.role], request.url)
  )
}
