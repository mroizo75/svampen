export const CASH_CUSTOMER = {
  firstName: 'Kontantkunde',
  lastName: '\u200b',
  email: 'kontantkunde.car4sale@svampen.local',
} as const

export const CASH_CUSTOMER_LABEL = 'Kontantkunde'

export function isCashCustomer(input?: {
  email?: string | null
  firstName?: string | null
  lastName?: string | null
} | null): boolean {
  if (!input) return false
  const email = input.email?.trim().toLowerCase()
  if (email === CASH_CUSTOMER.email) return true
  const firstName = input.firstName?.trim().toLowerCase()
  const lastName = input.lastName?.trim().toLowerCase()
  return firstName === CASH_CUSTOMER.firstName.toLowerCase()
    && lastName === CASH_CUSTOMER.lastName.toLowerCase()
}

export function formatBookingCustomerName(
  firstName?: string | null,
  lastName?: string | null,
): string {
  if (isCashCustomer({ firstName, lastName })) return CASH_CUSTOMER_LABEL
  return `${firstName ?? ''} ${lastName ?? ''}`.replace(/\s+/g, ' ').trim()
}

export function searchMatchesCashCustomer(query: string): boolean {
  const normalized = query.trim().toLowerCase()
  if (normalized.length < 4) return false
  return normalized.includes('car4') || normalized.includes('kontant')
}
