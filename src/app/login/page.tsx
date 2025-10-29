'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MainLayout } from '@/components/layout/main-layout'
import { Eye, EyeOff, Mail, Lock, Car } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        // NextAuth sender feilmeldingen som en string i result.error
        // Hvis det er en rate limit-feil, vis den spesifikke meldingen
        if (result.error.includes('For mange')) {
          setError(result.error)
        } else if (result.error === 'CredentialsSignin') {
          setError('Ugyldig e-post eller passord')
        } else {
          setError(result.error || 'Ugyldig e-post eller passord')
        }
      } else {
        // Hent session for å sjekke rolle
        const session = await getSession()
        if (session?.user?.role === 'ADMIN') {
          router.push('/admin')
        } else if (session?.user?.role === 'ANSATT') {
          router.push('/ansatt')
        } else if (session?.user?.role === 'WORKSHOP') {
          router.push('/verksted')
        } else {
          router.push('/dashboard')
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('En feil oppstod. Prøv igjen.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Car className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Logg inn</CardTitle>
            <CardDescription>
              Logg inn på din Svampen-konto for å administrere bestillinger
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-postadresse</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="din@epost.no"
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Passord</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ditt passord"
                    className="pl-10 pr-10"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className={`p-3 rounded-lg text-sm text-center ${
                  error.includes('For mange') 
                    ? 'bg-orange-50 text-orange-900 border border-orange-200' 
                    : 'bg-red-50 text-red-900 border border-red-200'
                }`}>
                  <p className="font-medium">
                    {error.includes('For mange') ? '⚠️ For mange forsøk' : '❌ Innlogging feilet'}
                  </p>
                  <p className="mt-1 text-xs">
                    {error}
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Logger inn...' : 'Logg inn'}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Har du ikke en konto?{' '}
                <Link href="/register" className="text-blue-600 hover:underline">
                  Registrer deg her
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}