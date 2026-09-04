export function isRealCustomerEmail(email?: string | null): boolean {
  if (!email) return false
  const normalized = email.trim().toLowerCase()
  if (!normalized) return false
  if (normalized.includes('*')) return false
  if (normalized.endsWith('@svampen.local')) return false
  if (normalized.endsWith('@ugyldig.svampen')) return false
  if (normalized.startsWith('noepost.')) return false
  if (normalized.startsWith('deaktivert_')) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
}

export function formatCustomerEmail(email?: string | null): string {
  if (!isRealCustomerEmail(email) || !email) {
    return 'Ingen e-post'
  }
  return email.trim()
}

export function formatCustomerContact(email?: string | null, phone?: string | null): string {
  const parts: string[] = []
  if (isRealCustomerEmail(email) && email) {
    parts.push(email.trim())
  }
  const trimmedPhone = phone?.trim()
  if (trimmedPhone) {
    parts.push(trimmedPhone)
  }
  return parts.join(' · ') || 'Ingen kontaktinfo'
}

export function shouldGeneratePlaceholderEmail(email?: string | null): boolean {
  if (isRealCustomerEmail(email)) return false
  if (!email || !email.trim()) return true
  const normalized = email.trim().toLowerCase()
  if (normalized.endsWith('@svampen.local') || normalized.endsWith('@ugyldig.svampen')) {
    return false
  }
  return true
}

export function generatePlaceholderEmail(firstName: string, lastName: string): string {
  const uniqueId = crypto.randomUUID().split('-')[0]
  const timestamp = Date.now()
  const nameSlug = `${firstName}-${lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .substring(0, 30)
  return `noepost.${nameSlug || 'kunde'}.${uniqueId}.${timestamp}@svampen.local`
}
