import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AnsattHeader } from '@/components/ansatt/ansatt-header'
import { AnsattSidebar } from '@/components/ansatt/ansatt-sidebar'

export default async function AnsattLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  // Sjekk om bruker er logget inn
  if (!session) {
    redirect('/login')
  }

  // Sjekk om bruker har ANSATT eller ADMIN rolle
  if (session.user.role !== 'ANSATT' && session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AnsattHeader user={session.user as any} />
      <div className="flex">
        <AnsattSidebar />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}

