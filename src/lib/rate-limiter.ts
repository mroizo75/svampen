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
  private customAttempts = new Map<string, RateLimitEntry>()
  
  // Konfigurering for email (strengt)
  private readonly MAX_ATTEMPTS_EMAIL = 5 // Maks 5 forsøk per email
  private readonly WINDOW_MS = 15 * 60 * 1000 // 15 minutter
  private readonly BLOCK_DURATION_MS = 30 * 60 * 1000 // Blokker i 30 minutter
  
  // Konfigurering for IP (mer liberalt - kun mot store angrep)
  private readonly MAX_ATTEMPTS_IP = 20 // Maks 20 forsøk per IP
  private readonly WINDOW_MS_IP = 10 * 60 * 1000 // 10 minutter
  private readonly BLOCK_DURATION_MS_IP = 15 * 60 * 1000 // Blokker i 15 minutter
  
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
    
    // Cleanup custom attempts
    for (const [key, entry] of this.customAttempts.entries()) {
      if (entry.resetAt < now && (!entry.blockedUntil || entry.blockedUntil < now)) {
        this.customAttempts.delete(key)
      }
    }
  }

  private checkLimit(
    map: Map<string, RateLimitEntry>, 
    key: string, 
    maxAttempts: number,
    windowMs: number,
    blockDurationMs: number,
    type: 'email' | 'ip'
  ): { 
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
        resetAt: now + windowMs
      })
      return {
        allowed: true,
        remainingAttempts: maxAttempts - 1
      }
    }

    // Inkrementer forsøk
    entry.count++

    // Hvis grensen er nådd, blokker
    if (entry.count > maxAttempts) {
      entry.blockedUntil = now + blockDurationMs
      console.warn(`🚨 Rate limit exceeded for ${type}: ${key}. Blocked until ${new Date(entry.blockedUntil).toISOString()}`)
      return {
        allowed: false,
        blockedUntil: new Date(entry.blockedUntil)
      }
    }

    return {
      allowed: true,
      remainingAttempts: maxAttempts - entry.count
    }
  }

  checkIp(ip: string) {
    // Ignorer 'unknown' IP for å unngå å blokkere alle
    if (ip === 'unknown') {
      return { allowed: true }
    }
    return this.checkLimit(
      this.ipAttempts, 
      ip, 
      this.MAX_ATTEMPTS_IP, 
      this.WINDOW_MS_IP, 
      this.BLOCK_DURATION_MS_IP,
      'ip'
    )
  }

  checkEmail(email: string) {
    return this.checkLimit(
      this.emailAttempts, 
      email.toLowerCase(), 
      this.MAX_ATTEMPTS_EMAIL, 
      this.WINDOW_MS, 
      this.BLOCK_DURATION_MS,
      'email'
    )
  }

  // Reset etter vellykket innlogging
  resetEmail(email: string) {
    this.emailAttempts.delete(email.toLowerCase())
  }

  // Få status for debugging
  getStatus() {
    return {
      ipAttempts: this.ipAttempts.size,
      emailAttempts: this.emailAttempts.size,
      customAttempts: this.customAttempts.size,
    }
  }

  // Generisk rate limit sjekk for custom scenarios (f.eks. booking)
  checkCustomLimit(
    key: string, 
    maxAttempts: number, 
    windowMs: number, 
    blockDurationMs: number = windowMs * 2
  ): boolean {
    const result = this.checkLimit(
      this.customAttempts, // Bruk egen map for custom limits
      key,
      maxAttempts,
      windowMs,
      blockDurationMs,
      'ip' // Type brukes bare for logging
    )
    return result.allowed
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

