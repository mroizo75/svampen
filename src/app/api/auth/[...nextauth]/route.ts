import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

// Email-basert rate limiting håndteres direkte i authOptions
// Dette gir bedre brukeropplevelse og unngår å blokkere flere brukere bak samme IP

export { handler as GET, handler as POST }