'use client'

import { useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  User, 
  Mail, 
  Phone, 
  Lock,
  UserPlus,
  LogIn,
  CheckCircle,
  Info
} from 'lucide-react'

interface CustomerInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  address?: string
  postalCode?: string
  city?: string
  createAccount: boolean
  password?: string
  isExistingUser: boolean
}

interface CustomerInfoStepProps {
  customerInfo: CustomerInfo
  onCustomerInfoChange: (customerInfo: CustomerInfo) => void
  isAdminBooking?: boolean
}

export function CustomerInfoStep({ customerInfo, onCustomerInfoChange, isAdminBooking = false }: CustomerInfoStepProps) {
  const { data: session } = useSession()
  const [showLogin, setShowLogin] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  const handleInputChange = (field: keyof CustomerInfo, value: string | boolean) => {
    onCustomerInfoChange({
      ...customerInfo,
      [field]: value,
    })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')

    try {
      const result = await signIn('credentials', {
        email: loginEmail,
        password: loginPassword,
        redirect: false,
      })

      if (result?.error) {
        setLoginError('Ugyldig e-post eller passord')
      } else {
        // Login successful - session will update automatically
        setShowLogin(false)
      }
    } catch (error) {
      setLoginError('En feil oppstod ved innlogging')
    } finally {
      setLoginLoading(false)
    }
  }

  // If user is logged in, show their info but allow editing
  // UNNTATT for admin-bookinger - da skal de fylle inn kundens info
  if (session?.user && !isAdminBooking) {
    return (
      <div className="space-y-6">
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            Du er logget inn som <strong>{session.user.email}</strong>. 
            Du kan oppdatere informasjonen under hvis nødvendig.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Kunde informasjon
            </CardTitle>
            <CardDescription>
              Bekreft eller oppdater dine kontaktopplysninger
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Fornavn *</Label>
                <Input
                  id="firstName"
                  value={customerInfo.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Ditt fornavn"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Etternavn *</Label>
                <Input
                  id="lastName"
                  value={customerInfo.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Ditt etternavn"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-post *</Label>
              <Input
                id="email"
                type="email"
                value={customerInfo.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="din@email.com"
                disabled
              />
              <p className="text-xs text-gray-500">
                E-post kan ikke endres for innloggede brukere
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefonnummer *</Label>
              <Input
                id="phone"
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+47 xxx xx xxx"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={customerInfo.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Gateadresse"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postnummer</Label>
                <Input
                  id="postalCode"
                  value={customerInfo.postalCode || ''}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  placeholder="0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Poststed</Label>
                <Input
                  id="city"
                  value={customerInfo.city || ''}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="By"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Admin booking varsel */}
      {isAdminBooking && (
        <Alert className="bg-blue-50 border-blue-300">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>🎯 Admin-booking:</strong> Fyll inn KUNDENS informasjon, ikke din egen. 
            Denne bookingen er for kunden som ringer inn.
          </AlertDescription>
        </Alert>
      )}

      {!isAdminBooking && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Du kan enten oppgi dine opplysninger som gjest, eller logge inn/registrere deg for en bedre opplevelse.
          </AlertDescription>
        </Alert>
      )}

      {/* Login Option */}
      {!isAdminBooking && (
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <LogIn className="mr-2 h-5 w-5" />
            Har du allerede en konto?
          </CardTitle>
          <CardDescription>
            Logg inn for å hente dine lagrede opplysninger
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showLogin ? (
            <Button 
              variant="outline" 
              onClick={() => setShowLogin(true)}
              className="w-full"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Logg inn
            </Button>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="loginEmail">E-post</Label>
                <Input
                  id="loginEmail"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="din@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loginPassword">Passord</Label>
                <Input
                  id="loginPassword"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Ditt passord"
                  required
                />
              </div>
              {loginError && (
                <Alert variant="destructive">
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}
              <div className="flex space-x-2">
                <Button 
                  type="submit" 
                  disabled={loginLoading}
                  className="flex-1"
                >
                  {loginLoading ? 'Logger inn...' : 'Logg inn'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowLogin(false)}
                  className="flex-1"
                >
                  Avbryt
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
      )}

      {!isAdminBooking && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Eller</span>
          </div>
        </div>
      )}

      {/* Guest/Registration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="mr-2 h-5 w-5" />
            {isAdminBooking ? 'Kundens opplysninger' : 'Dine opplysninger'}
          </CardTitle>
          <CardDescription>
            {isAdminBooking 
              ? 'Fyll ut kundens kontaktinformasjon' 
              : 'Fyll ut informasjonen under for å fullføre bestillingen'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Fornavn *</Label>
              <Input
                id="firstName"
                value={customerInfo.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="Ditt fornavn"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Etternavn *</Label>
              <Input
                id="lastName"
                value={customerInfo.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Ditt etternavn"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-post {isAdminBooking && customerInfo.phone ? '(valgfri)' : '*'}</Label>
            <Input
              id="email"
              type="email"
              value={customerInfo.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="din@email.com"
              pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
              title="Vennligst oppgi en gyldig e-postadresse (f.eks. navn@eksempel.no)"
              required={!isAdminBooking}
            />
            <p className="text-xs text-gray-500">
              {isAdminBooking 
                ? (customerInfo.phone ? 'Valgfri når telefon er oppgitt' : 'Påkrevd hvis telefon ikke oppgis')
                : 'E-post er påkrevd for å motta bestillingsbekreftelse'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefonnummer {isAdminBooking ? (customerInfo.email ? '(valgfri)' : '*') : '(valgfri)'}</Label>
            <Input
              id="phone"
              type="tel"
              value={customerInfo.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+47 xxx xx xxx"
              pattern="^[\d\s\+\-\(\)]+$"
              title="Vennligst oppgi et gyldig telefonnummer"
            />
            <p className="text-xs text-gray-500">
              {isAdminBooking 
                ? (customerInfo.email ? 'Valgfri når e-post er oppgitt' : 'Påkrevd hvis e-post ikke oppgis')
                : 'Valgfri - brukes for SMS-bekreftelse'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={customerInfo.address || ''}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Gateadresse"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postnummer</Label>
              <Input
                id="postalCode"
                value={customerInfo.postalCode || ''}
                onChange={(e) => handleInputChange('postalCode', e.target.value)}
                placeholder="0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Poststed</Label>
              <Input
                id="city"
                value={customerInfo.city || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="By"
              />
            </div>
          </div>

          <Separator />

          {/* Account Creation Option */}
          {!isAdminBooking && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="createAccount"
                  checked={customerInfo.createAccount}
                  onCheckedChange={(checked) => handleInputChange('createAccount', checked === true)}
                />
                <Label htmlFor="createAccount" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Opprett konto for raskere bestillinger i fremtiden
                </Label>
              </div>

              {customerInfo.createAccount && (
                <div className="space-y-2">
                  <Label htmlFor="password">Velg passord *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={customerInfo.password || ''}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Minimum 6 tegn"
                    minLength={6}
                  />
                  <p className="text-xs text-gray-500">
                    Ved å opprette konto godtar du våre vilkår og betingelser
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}