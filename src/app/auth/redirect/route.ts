import { UserRole } from '@prisma/client'
import { NextResponse } from 'next/server'

import { getServerAuthSession } from '@/lib/auth-utils'

const roleDestinations: Record<UserRole, string> = {
  ADMIN: '/admin',
  ANSATT: '/ansatt',
  WORKSHOP: '/verksted',
  USER: '/dashboard',
}

function redirectTo(path: string): NextResponse {
  return new NextResponse(null, {
    status: 307,
    headers: {
      Location: path,
    },
  })
}

export async function GET() {
  const session = await getServerAuthSession()

  if (!session?.user?.role) {
    return redirectTo('/login')
  }

  return redirectTo(roleDestinations[session.user.role])
}
