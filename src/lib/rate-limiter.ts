// In-memory rate limiter for å beskytte mot brute force-angrep
// For produksjon med flere servere, bruk Redis i stedet

interface RateLimitEntry {
  count: number
  resetAt: number
  blockedUntil?: number
}

class RateLimiter {
  private ipAttempts = new Map<string, RateLimitEntry>()
  private emailAttempts = new Map<string, RateLimitEntry>()
  
  // Konfigurering
  private readonly MAX_ATTEMPTS = 5 // Maks 5 forsøk
  private readonly WINDOW_MS = 15 * 60 * 1000 // 15 minutter
  private readonly BLOCK_DURATION_MS = 30 * 60 * 1000 // Blokker i 30 minutter
  
  constructor() {
    // Cleanup gamle entries hver 10. minutt
    setInterval(() => this.cleanup(), 10 * 60 * 1000)
  }

  private cleanup() {
    const now = Date.now()
    
    // Cleanup IP attempts
    for (const [key, entry] of this.ipAttempts.entries()) {
      if (entry.resetAt < now && (!entry.blockedUntil || entry.blockedUntil < now)) {
        this.ipAttempts.delete(key)
      }
    }
    
    // Cleanup email attempts
    for (const [key, entry] of this.emailAttempts.entries()) {
      if (entry.resetAt < now && (!entry.blockedUntil || entry.blockedUntil < now)) {
        this.emailAttempts.delete(key)
      }
    }
  }

  private checkLimit(map: Map<string, RateLimitEntry>, key: string): { 
    allowed: boolean
    remainingAttempts?: number
    blockedUntil?: Date
  } {
    const now = Date.now()
    const entry = map.get(key)

    // Sjekk om nøkkelen er blokkert
    if (entry?.blockedUntil && entry.blockedUntil > now) {
      return {
        allowed: false,
        blockedUntil: new Date(entry.blockedUntil)
      }
    }

    // Hvis vinduet har utløpt, reset
    if (!entry || entry.resetAt < now) {
      map.set(key, {
        count: 1,
        resetAt: now + this.WINDOW_MS
      })
      return {
        allowed: true,
        remainingAttempts: this.MAX_ATTEMPTS - 1
      }
    }

    // Inkrementer forsøk
    entry.count++

    // Hvis grensen er nådd, blokker
    if (entry.count > this.MAX_ATTEMPTS) {
      entry.blockedUntil = now + this.BLOCK_DURATION_MS
      console.warn(`🚨 Rate limit exceeded for ${key}. Blocked until ${new Date(entry.blockedUntil).toISOString()}`)
      return {
        allowed: false,
        blockedUntil: new Date(entry.blockedUntil)
      }
    }

    return {
      allowed: true,
      remainingAttempts: this.MAX_ATTEMPTS - entry.count
    }
  }

  checkIp(ip: string) {
    return this.checkLimit(this.ipAttempts, ip)
  }

  checkEmail(email: string) {
    return this.checkLimit(this.emailAttempts, email.toLowerCase())
  }

  // Reset etter vellykket innlogging
  resetEmail(email: string) {
    this.emailAttempts.delete(email.toLowerCase())
  }

  // Få status for debugging
  getStatus() {
    return {
      ipAttempts: this.ipAttempts.size,
      emailAttempts: this.emailAttempts.size
    }
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter()

// Helper function for å hente IP fra request
export function getClientIp(request: Request): string {
  // Sjekk X-Forwarded-For header først (for proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  // Sjekk X-Real-IP header
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback (ikke ideelt, men bedre enn ingenting)
  return 'unknown'
}

