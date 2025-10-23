'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function LicenseActivationForm() {
  const router = useRouter()
  const [licenseKey, setLicenseKey] = useState('')
  const [validationToken, setValidationToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/license/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          licenseKey,
          validationToken,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Kunne ikke aktivere lisens')
      }

      setSuccess('Lisens aktivert! Siden lastes inn på nytt...')
      setLicenseKey('')
      setValidationToken('')
      
      // Refresh siden etter 2 sekunder
      setTimeout(() => {
        router.refresh()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'En feil oppstod')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            {success}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="licenseKey">Lisenskode *</Label>
        <Input
          id="licenseKey"
          type="text"
          placeholder="SVAMPEN-2025-XXXX-XXXX-XXXX"
          value={licenseKey}
          onChange={(e) => setLicenseKey(e.target.value)}
          required
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500">
          Finner du på www.kksas.no under "Mine Lisenser"
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="validationToken">Validerings-token *</Label>
        <Input
          id="validationToken"
          type="password"
          placeholder="••••••••••••••••"
          value={validationToken}
          onChange={(e) => setValidationToken(e.target.value)}
          required
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500">
          Validerings-token finner du sammen med lisenskoden
        </p>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || !licenseKey || !validationToken}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Aktiverer lisens...
          </>
        ) : (
          'Aktiver Lisens'
        )}
      </Button>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>💡 Tips:</strong> Hvis du ikke har en lisens ennå, besøk{' '}
          <a
            href="https://www.kksas.no"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            www.kksas.no
          </a>{' '}
          for å kjøpe eller administrere din lisens.
        </p>
      </div>
    </form>
  )
}

