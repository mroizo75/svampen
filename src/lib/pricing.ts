/**
 * Prisberegning for bestillingsprosessen.
 * Priser i databasen er lagret ekskl. MVA.
 * I hele bestillingsprosessen vises: pris ekskl. mva + MVA = totalpris inkl. mva.
 */

export const VAT_RATE = 0.25

/** MVA-beløp (25% av pris ekskl. MVA) */
export function mvaAmount(priceExclVat: number): number {
  return Math.round(Number(priceExclVat) * VAT_RATE)
}

/** Pris ekskl. MVA → pris inkl. MVA (25%) */
export function priceWithVat(priceExclVat: number): number {
  return Math.round(Number(priceExclVat) * (1 + VAT_RATE))
}
