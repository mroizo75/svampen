import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Edge Runtime støtter ikke Prisma, så vi gjør ikke lisenssjekk her
// Lisenssjekk gjøres i stedet i root layout og admin sider
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
