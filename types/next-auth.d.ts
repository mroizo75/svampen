import { UserRole } from '@prisma/client'
import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    id: string
    email: string
    name: string
    firstName?: string
    lastName?: string
    phone?: string
    role?: UserRole
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      firstName?: string
      lastName?: string
      phone?: string
      role?: UserRole
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: UserRole
    firstName?: string
    lastName?: string
    phone?: string
  }
}
