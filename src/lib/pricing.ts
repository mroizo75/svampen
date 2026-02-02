/**
 * Prisberegning for kundefacing visning.
 * Priser i databasen er lagret ekskl. MVA.
 * Ved visning til kunder vises pris inkl. 25% MVA.
 */

export const VAT_RATE = 0.25

/** Pris ekskl. MVA → pris inkl. MVA (25%) */
export function priceWithVat(priceExclVat: number): number {
  return Math.round(Number(priceExclVat) * (1 + VAT_RATE))
}
