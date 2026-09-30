import { createHash, randomBytes } from 'crypto'

const PASSWORD_RESET_TOKEN_BYTES = 32

export const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000

export function createPasswordResetToken(): string {
  return randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString('hex')
}

export function hashPasswordResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
