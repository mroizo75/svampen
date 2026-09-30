'use client'

import Link from 'next/link'
import { FormEvent, Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Lock } from 'lucide-react'

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

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!token) {
      setError('Tilbakestillingslenken er ugyldig.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passordene er ikke like.')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = (await response.json()) as { message?: string }

      if (!response.ok) {
        setError(data.message ?? 'Kunne ikke tilbakestille passordet.')
        return
      }

      setMessage(data.message ?? 'Passordet er oppdatert.')
      setPassword('')
      setConfirmPassword('')
    } catch {
      setError('Kunne ikke kontakte tjenesten. Prøv igjen.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Velg nytt passord</CardTitle>
        <CardDescription>
          Passordet må ha minst åtte tegn, stor og liten bokstav og ett tall.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {message ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center text-sm text-green-900">
              {message}
            </div>
            <Button asChild className="w-full">
              <Link href="/login">Gå til innlogging</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordInput
              id="password"
              label="Nytt passord"
              value={password}
              showPassword={showPassword}
              onChange={setPassword}
              onToggleVisibility={() => setShowPassword((current) => !current)}
              disabled={isLoading}
            />

            <PasswordInput
              id="confirmPassword"
              label="Gjenta nytt passord"
              value={confirmPassword}
              showPassword={showPassword}
              onChange={setConfirmPassword}
              onToggleVisibility={() => setShowPassword((current) => !current)}
              disabled={isLoading}
            />

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-900">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading || !token}>
              {isLoading ? 'Oppdaterer...' : 'Oppdater passord'}
            </Button>

            {!token && (
              <div className="text-center text-sm">
                <Link href="/forgot-password" className="text-blue-600 hover:underline">
                  Be om en ny lenke
                </Link>
              </div>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  )
}

interface PasswordInputProps {
  id: string
  label: string
  value: string
  showPassword: boolean
  onChange: (value: string) => void
  onToggleVisibility: () => void
  disabled: boolean
}

function PasswordInput({
  id,
  label,
  value,
  showPassword,
  onChange,
  onToggleVisibility,
  disabled,
}: PasswordInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="pl-10 pr-10"
          minLength={8}
          required
          disabled={disabled}
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          aria-label={showPassword ? 'Skjul passord' : 'Vis passord'}
          disabled={disabled}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <MainLayout>
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4">
        <Suspense fallback={<div>Laster...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </MainLayout>
  )
}
