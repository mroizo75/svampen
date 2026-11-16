import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { CASH_CUSTOMER } from '@/lib/cash-customer'

export async function ensureCashCustomer() {
  const existing = await prisma.user.findUnique({
    where: { email: CASH_CUSTOMER.email },
  })

  if (existing) {
    if (
      existing.phone
      || existing.firstName !== CASH_CUSTOMER.firstName
      || existing.lastName !== CASH_CUSTOMER.lastName
    ) {
      return prisma.user.update({
        where: { id: existing.id },
        data: {
          firstName: CASH_CUSTOMER.firstName,
          lastName: CASH_CUSTOMER.lastName,
          phone: null,
        },
      })
    }
    return existing
  }

  const password = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12)
  return prisma.user.create({
    data: {
      email: CASH_CUSTOMER.email,
      password,
      firstName: CASH_CUSTOMER.firstName,
      lastName: CASH_CUSTOMER.lastName,
      phone: null,
      role: 'USER',
    },
  })
}
