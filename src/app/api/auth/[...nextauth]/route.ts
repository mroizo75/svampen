import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'
import { rateLimiter, getClientIp } from '@/lib/rate-limiter'
import { NextRequest, NextResponse } from 'next/server'

const handler = NextAuth(authOptions)

// Wrapper for å legge til IP-basert rate limiting
async function POST(request: NextRequest) {
  // Kun sjekk rate limit for signin-endepunktet
  const url = new URL(request.url)
  const isSignIn = url.pathname.includes('signin') || url.searchParams.get('action') === 'signin'
  
  if (isSignIn) {
    const ip = getClientIp(request)
    const ipLimit = rateLimiter.checkIp(ip)
    
    if (!ipLimit.allowed) {
      const minutesLeft = ipLimit.blockedUntil 
        ? Math.ceil((ipLimit.blockedUntil.getTime() - Date.now()) / 60000)
        : 30
      
      console.warn(`🚨 Rate limit exceeded for IP: ${ip}`)
      
      return NextResponse.json(
        { 
          error: `For mange innloggingsforsøk fra denne IP-adressen. Prøv igjen om ${minutesLeft} minutter.` 
        },
        { status: 429 }
      )
    }
  }
  
  return handler(request)
}

export { handler as GET, POST }