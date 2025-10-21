import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getServerAuthSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { ProfileForm } from '@/components/dashboard/profile-form'
import { PasswordChangeForm } from '@/components/dashboard/password-change-form'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Phone, Calendar, Shield } from 'lucide-react'

async function getUserData(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    })
    return user
  } catch (error) {
    console.error('Error fetching user data:', error)
    return null
  }
}

export default async function ProfilPage() {
  const session = await getServerAuthSession()
  
  if (!session?.user?.id) {
    return null // Middleware will handle redirect
  }

  const userData = await getUserData(session.user.id)

  if (!userData) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Min profil</h1>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-gray-500">Kunne ikke laste inn profil</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Min profil</h1>
        <p className="text-gray-600">Administrer din personlige informasjon og innstillinger</p>
      </div>

      {/* User Info Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Kontoinformasjon</CardTitle>
          <CardDescription>Oversikt over din konto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Navn</p>
                <p className="font-medium">{userData.firstName} {userData.lastName}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">E-post</p>
                <p className="font-medium">{userData.email}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Phone className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Telefon</p>
                <p className="font-medium">{userData.phone || 'Ikke angitt'}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Medlem siden</p>
                <p className="font-medium">
                  {new Date(userData.createdAt).toLocaleDateString('nb-NO', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Rolle</p>
                <div className="mt-1">
                  {userData.role === 'ADMIN' ? (
                    <Badge className="bg-blue-100 text-blue-800">Administrator</Badge>
                  ) : (
                    <Badge variant="secondary">Kunde</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Totale bestillinger</p>
                <p className="font-medium">{userData._count.bookings}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Update Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>Rediger profil</CardTitle>
          <CardDescription>Oppdater din personlige informasjon</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm 
            defaultValues={{
              firstName: userData.firstName,
              lastName: userData.lastName,
              email: userData.email,
              phone: userData.phone || '',
            }}
          />
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Endre passord</CardTitle>
          <CardDescription>Oppdater ditt passord for å holde kontoen sikker</CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordChangeForm />
        </CardContent>
      </Card>
    </div>
  )
}

