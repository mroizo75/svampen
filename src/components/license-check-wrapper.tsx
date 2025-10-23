'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { XCircle, Loader2 } from 'lucide-react'

export function LicenseCheckWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)
  const [isValid, setIsValid] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Paths som alltid skal være tilgjengelige
  const publicPaths = ['/login', '/api/auth', '/admin/lisens']
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  useEffect(() => {
    if (isPublicPath) {
      setIsChecking(false)
      setIsValid(true)
      return
    }

    const checkLicense = async () => {
      try {
        const response = await fetch('/api/admin/license/status')
        
        if (!response.ok) {
          throw new Error('Kunne ikke hente lisensstatus')
        }

        const status = await response.json()

        if (!status.isValid || !status.isActive) {
          setIsValid(false)
          setErrorMessage(status.errorMessage || 'Ingen gyldig lisens')
          // Redirect til lisens-side
          if (!pathname.startsWith('/admin/lisens')) {
            router.push('/admin/lisens')
          }
        } else {
          setIsValid(true)
        }
      } catch (error) {
        console.error('License check error:', error)
        // Ved feil, tillat tilgang men vis warning i konsollen
        setIsValid(true)
      } finally {
        setIsChecking(false)
      }
    }

    checkLicense()
  }, [pathname, isPublicPath, router])

  if (isPublicPath) {
    return <>{children}</>
  }

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-gray-600">Verifiserer lisens...</p>
        </div>
      </div>
    )
  }

  if (!isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full">
          <Alert className="bg-red-50 border-red-200">
            <XCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-900">
              <strong className="block mb-2">⚠️ Ingen gyldig lisens</strong>
              <p className="text-sm">{errorMessage}</p>
              <p className="text-sm mt-2">Du vil bli videresendt til lisens-siden...</p>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

