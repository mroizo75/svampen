'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { ArrowLeft, Mail } from 'lucide-react'

import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = (await response.json()) as { message?: string }

      if (!response.ok) {
        setError(data.message ?? 'Kunne ikke sende forespørselen.')
        return
      }

      setMessage(data.message ?? 'Sjekk innboksen din for videre instruksjoner.')
    } catch {
      setError('Kunne ikke kontakte tjenesten. Prøv igjen.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Glemt passord</CardTitle>
            <CardDescription>
              Oppgi e-postadressen din, så sender vi deg en sikker lenke.
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
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading || Boolean(message)}
                  />
                </div>
              </div>

              {message && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center text-sm text-green-900">
                  {message}
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-900">
                  {error}
                </div>
              )}

              {!message && (
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Sender...' : 'Send tilbakestillingslenke'}
                </Button>
              )}

              <div className="text-center text-sm">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Tilbake til innlogging
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
