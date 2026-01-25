import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { UserRole } from '@prisma/client'
import { rateLimiter } from './rate-limiter'

// Valider at NEXTAUTH_SECRET er satt
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET er ikke satt i environment variables')
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('E-post og passord er påkrevd')
        }

        // Sjekk rate limit basert på email
        const emailLimit = rateLimiter.checkEmail(credentials.email)
        if (!emailLimit.allowed) {
          const minutesLeft = emailLimit.blockedUntil 
            ? Math.ceil((emailLimit.blockedUntil.getTime() - Date.now()) / 60000)
            : 30
          throw new Error(
            `For mange innloggingsforsøk. Kontoen er midlertidig låst. Prøv igjen om ${minutesLeft} minutter.`
          )
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          if (!user) {
            // Ikke avslør om brukeren eksisterer eller ikke
            throw new Error('Ugyldig e-post eller passord')
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            throw new Error('Ugyldig e-post eller passord')
          }

          // Vellykket innlogging - reset rate limit for denne e-posten
          rateLimiter.resetEmail(credentials.email)

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone || undefined,
            role: user.role,
          }
        } catch (error) {
          console.error('Auth error:', error)
          // Re-throw error for å vise brukeren
          if (error instanceof Error) {
            throw error
          }
          throw new Error('En feil oppstod under innlogging')
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 dager
    updateAge: 24 * 60 * 60, // Oppdater session hver 24 timer
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = user.role
        token.firstName = user.firstName
        token.lastName = user.lastName
        // Fjernet phone fra JWT token for å redusere sensitiv data
      }
      
      // Token refresh logikk
      if (trigger === 'update' && token.sub) {
        // Hent oppdatert brukerinfo ved token refresh
        const updatedUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          }
        })
        
        if (updatedUser) {
          token.role = updatedUser.role
          token.firstName = updatedUser.firstName
          token.lastName = updatedUser.lastName
        }
      }
      
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as UserRole
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
        // Phone hentes fra database ved behov i stedet for å være i token
      }
      return session
    }
  },
  pages: {
    signIn: '/login'
  },
  secret: process.env.NEXTAUTH_SECRET,
}

declare module 'next-auth' {
  interface User {
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
      role: UserRole
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    firstName?: string
    lastName?: string
    role?: UserRole
  }
}