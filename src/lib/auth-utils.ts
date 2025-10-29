import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { UserRole } from '@prisma/client'
import { redirect } from 'next/navigation'

export async function getServerAuthSession() {
  return await getServerSession(authOptions)
}

export async function requireAuth() {
  const session = await getServerAuthSession()
  if (!session) {
    redirect('/login')
  }
  return session
}

export async function requireAdmin() {
  const session = await requireAuth()
  if (session.user.role !== UserRole.ADMIN) {
    redirect('/')
  }
  return session
}

export function hasRole(session: any, role: UserRole): boolean {
  return session?.user?.role === role
}

export function isAdmin(session: any): boolean {
  return hasRole(session, UserRole.ADMIN)
}

export function isAnsatt(session: any): boolean {
  return hasRole(session, UserRole.ANSATT)
}

export function isWorkshop(session: any): boolean {
  return hasRole(session, UserRole.WORKSHOP)
}

export function canManageBookings(session: any): boolean {
  return isAdmin(session) || isAnsatt(session)
}

export function canViewAllBookings(session: any): boolean {
  return isAdmin(session) || isAnsatt(session) || isWorkshop(session)
}